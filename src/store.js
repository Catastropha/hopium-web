/**
 * Minimal reactive store. No dependencies.
 * Usage:
 *   store.set({ balance: 100 })
 *   store.on('balance', (val) => { ... })
 */

const LS_KEY = 'hopium_auth'

function loadPersistedAuth() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    // Check token expiry
    if (data.tokenExp && data.tokenExp * 1000 < Date.now()) {
      // Access token expired — keep refresh token for refresh attempt
      return {
        refreshToken: data.refreshToken,
        refreshTokenExp: data.refreshTokenExp,
        userId: data.userId,
        username: data.username,
        photoUrl: data.photoUrl,
      }
    }
    return data
  } catch {
    return {}
  }
}

function persistAuth(state) {
  const data = {
    token: state.token,
    tokenExp: state.tokenExp,
    refreshToken: state.refreshToken,
    refreshTokenExp: state.refreshTokenExp,
    userId: state.userId,
    username: state.username,
    photoUrl: state.photoUrl,
  }
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

const persisted = loadPersistedAuth()

const state = {
  // Auth
  token: persisted.token || null,
  tokenExp: persisted.tokenExp || null,
  refreshToken: persisted.refreshToken || null,
  refreshTokenExp: persisted.refreshTokenExp || null,
  userId: persisted.userId || null,
  username: persisted.username || null,
  photoUrl: persisted.photoUrl || null,
  balance: null,

  // UI
  selectedBetId: null,
  unreadNotifications: 0,

  // Countries cache
  countries: null,
}

const listeners = new Map()

export const store = {
  get(key) {
    return state[key]
  },

  getAll() {
    return { ...state }
  },

  get isAuthenticated() {
    return !!state.token
  },

  set(updates) {
    const changed = []
    for (const [key, value] of Object.entries(updates)) {
      if (state[key] !== value) {
        state[key] = value
        changed.push(key)
      }
    }
    // Persist auth-related changes
    const authKeys = ['token', 'tokenExp', 'refreshToken', 'refreshTokenExp', 'userId', 'username', 'photoUrl']
    if (changed.some(k => authKeys.includes(k))) {
      persistAuth(state)
    }
    // Notify listeners
    for (const key of changed) {
      const fns = listeners.get(key)
      if (fns) fns.forEach(fn => fn(state[key]))
    }
    // Also notify wildcard listeners
    if (changed.length > 0) {
      const fns = listeners.get('*')
      if (fns) fns.forEach(fn => fn(state))
    }
  },

  on(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set())
    listeners.get(key).add(fn)
    return () => listeners.get(key)?.delete(fn)
  },

  login(authResponse) {
    this.set({
      token: authResponse.token,
      tokenExp: authResponse.token_exp,
      refreshToken: authResponse.refresh_token,
      refreshTokenExp: authResponse.refresh_token_exp,
      userId: authResponse.user_id,
    })
  },

  logout() {
    this.set({
      token: null,
      tokenExp: null,
      refreshToken: null,
      refreshTokenExp: null,
      userId: null,
      username: null,
      photoUrl: null,
      balance: null,
    })
    localStorage.removeItem(LS_KEY)
  },
}
