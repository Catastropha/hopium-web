import { describe, it, expect, beforeEach, vi } from 'vitest'

// We need to mock localStorage before importing store
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    _store: store,
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Fresh store for each test — re-import to reset module state
let store

async function loadStore() {
  vi.resetModules()
  localStorageMock.clear()
  const mod = await import('../store.js')
  return mod.store
}

describe('store', () => {
  beforeEach(async () => {
    store = await loadStore()
  })

  describe('get / set', () => {
    it('returns null for unset keys', () => {
      expect(store.get('balance')).toBeNull()
    })

    it('sets and gets a value', () => {
      store.set({ balance: 500 })
      expect(store.get('balance')).toBe(500)
    })

    it('sets multiple values at once', () => {
      store.set({ balance: 100, selectedBetId: 'abc' })
      expect(store.get('balance')).toBe(100)
      expect(store.get('selectedBetId')).toBe('abc')
    })

    it('does not notify listeners when value unchanged', () => {
      store.set({ balance: 100 })
      const fn = vi.fn()
      store.on('balance', fn)
      store.set({ balance: 100 })
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('getAll', () => {
    it('returns a snapshot of state', () => {
      store.set({ balance: 250 })
      const all = store.getAll()
      expect(all.balance).toBe(250)
      // Should be a copy, not a reference
      all.balance = 999
      expect(store.get('balance')).toBe(250)
    })
  })

  describe('isAuthenticated', () => {
    it('is false when no token', () => {
      expect(store.isAuthenticated).toBe(false)
    })

    it('is true when token is set', () => {
      store.set({ token: 'abc123' })
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('listeners', () => {
    it('notifies on key change', () => {
      const fn = vi.fn()
      store.on('balance', fn)
      store.set({ balance: 42 })
      expect(fn).toHaveBeenCalledWith(42)
    })

    it('notifies wildcard listeners on any change', () => {
      const fn = vi.fn()
      store.on('*', fn)
      store.set({ selectedBetId: 'xyz' })
      expect(fn).toHaveBeenCalledTimes(1)
      const arg = fn.mock.calls[0][0]
      expect(arg.selectedBetId).toBe('xyz')
    })

    it('unsubscribes when returned function is called', () => {
      const fn = vi.fn()
      const unsub = store.on('balance', fn)
      unsub()
      store.set({ balance: 999 })
      expect(fn).not.toHaveBeenCalled()
    })

    it('handles multiple listeners on the same key', () => {
      const fn1 = vi.fn()
      const fn2 = vi.fn()
      store.on('balance', fn1)
      store.on('balance', fn2)
      store.set({ balance: 10 })
      expect(fn1).toHaveBeenCalledWith(10)
      expect(fn2).toHaveBeenCalledWith(10)
    })
  })

  describe('login', () => {
    it('maps API response fields to store keys', () => {
      store.login({
        token: 'tok_123',
        token_exp: 1700000000,
        refresh_token: 'ref_456',
        refresh_token_exp: 1700100000,
        user_id: 'u42',
      })
      expect(store.get('token')).toBe('tok_123')
      expect(store.get('tokenExp')).toBe(1700000000)
      expect(store.get('refreshToken')).toBe('ref_456')
      expect(store.get('refreshTokenExp')).toBe(1700100000)
      expect(store.get('userId')).toBe('u42')
      expect(store.isAuthenticated).toBe(true)
    })

    it('persists auth to localStorage', () => {
      store.login({
        token: 'tok',
        token_exp: 999,
        refresh_token: 'ref',
        refresh_token_exp: 1000,
        user_id: 'u1',
      })
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const saved = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)[1])
      expect(saved.token).toBe('tok')
      expect(saved.refreshToken).toBe('ref')
    })
  })

  describe('logout', () => {
    it('clears auth state and localStorage', () => {
      store.login({
        token: 'tok',
        token_exp: 999,
        refresh_token: 'ref',
        refresh_token_exp: 1000,
        user_id: 'u1',
      })
      store.logout()
      expect(store.isAuthenticated).toBe(false)
      expect(store.get('token')).toBeNull()
      expect(store.get('refreshToken')).toBeNull()
      expect(store.get('userId')).toBeNull()
      expect(store.get('balance')).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hopium_auth')
    })
  })

  describe('persistence', () => {
    it('does not persist non-auth keys', () => {
      localStorageMock.setItem.mockClear()
      store.set({ selectedBetId: 'bet_1' })
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('loadPersistedAuth', () => {
    it('restores auth from localStorage', async () => {
      const authData = {
        token: 'saved_tok',
        tokenExp: Math.floor(Date.now() / 1000) + 3600, // not expired
        refreshToken: 'saved_ref',
        refreshTokenExp: Math.floor(Date.now() / 1000) + 86400,
        userId: 'u99',
        username: 'testuser',
        photoUrl: 'https://example.com/photo.jpg',
      }
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authData))

      vi.resetModules()
      const mod = await import('../store.js')
      const s = mod.store

      expect(s.get('token')).toBe('saved_tok')
      expect(s.get('refreshToken')).toBe('saved_ref')
      expect(s.get('userId')).toBe('u99')
      expect(s.isAuthenticated).toBe(true)
    })

    it('keeps refresh token but clears access token when expired', async () => {
      const authData = {
        token: 'expired_tok',
        tokenExp: Math.floor(Date.now() / 1000) - 100, // expired
        refreshToken: 'still_good_ref',
        refreshTokenExp: Math.floor(Date.now() / 1000) + 86400,
        userId: 'u99',
        username: 'testuser',
        photoUrl: 'https://example.com/photo.jpg',
      }
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authData))

      vi.resetModules()
      const mod = await import('../store.js')
      const s = mod.store

      // Access token should NOT be restored (expired)
      expect(s.get('token')).toBeNull()
      // Refresh token should still be present
      expect(s.get('refreshToken')).toBe('still_good_ref')
      expect(s.get('userId')).toBe('u99')
      expect(s.get('username')).toBe('testuser')
      expect(s.isAuthenticated).toBe(false)
    })

    it('returns empty state when localStorage has invalid JSON', async () => {
      localStorageMock.getItem.mockReturnValueOnce('not valid json{{{')

      vi.resetModules()
      const mod = await import('../store.js')
      const s = mod.store

      expect(s.get('token')).toBeNull()
      expect(s.get('refreshToken')).toBeNull()
      expect(s.isAuthenticated).toBe(false)
    })

    it('returns empty state when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)

      vi.resetModules()
      const mod = await import('../store.js')
      const s = mod.store

      expect(s.get('token')).toBeNull()
      expect(s.isAuthenticated).toBe(false)
    })
  })
})
