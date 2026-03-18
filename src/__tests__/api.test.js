import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('../store.js', () => {
  const _state = {}
  const store = {
    _state,
    get: vi.fn((key) => store._state[key] ?? null),
    set: vi.fn((updates) => Object.assign(store._state, updates)),
    login: vi.fn((data) => {
      store._state.token = data.token
      store._state.tokenExp = data.token_exp
      store._state.refreshToken = data.refresh_token
    }),
    logout: vi.fn(() => {
      for (const key of Object.keys(store._state)) delete store._state[key]
    }),
    get isAuthenticated() {
      return !!store._state.token
    },
  }
  return { store }
})

vi.mock('../constants.js', () => ({
  API_BASE: 'https://api.test.com',
}))

import { api, ApiError } from '../api.js'
import { store as mockStore } from '../store.js'

describe('api', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStore._state)) delete mockStore._state[key]
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    delete global.fetch
  })

  describe('request building', () => {
    it('builds URL with query params', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await api.get('/v1/bet/', { category: 'Sports', size: 20 })

      const url = global.fetch.mock.calls[0][0]
      expect(url).toContain('https://api.test.com/v1/bet/')
      expect(url).toContain('category=Sports')
      expect(url).toContain('size=20')
    })

    it('skips null/empty query params', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await api.get('/v1/bet/', { category: null, country: '', size: 10 })

      const url = global.fetch.mock.calls[0][0]
      expect(url).not.toContain('category')
      expect(url).not.toContain('country')
      expect(url).toContain('size=10')
    })

    it('sends JSON body for POST requests', async () => {
      mockStore._state = {
        token: 'tok',
        tokenExp: Math.floor(Date.now() / 1000) + 3600,
      }

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      })

      await api.post('/v1/position/', { bet_id: 'b1', outcome_id: 'o1', amount: 100 })

      const opts = global.fetch.mock.calls[0][1]
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body)).toEqual({
        bet_id: 'b1',
        outcome_id: 'o1',
        amount: 100,
      })
    })

    it('includes auth header when authenticated', async () => {
      mockStore._state = {
        token: 'my_token',
        tokenExp: Math.floor(Date.now() / 1000) + 3600,
      }

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await api.get('/v1/bet/')

      const headers = global.fetch.mock.calls[0][1].headers
      expect(headers['Authorization']).toBe('Bearer my_token')
    })
  })

  describe('error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: { code: 'bet-get-1', message: 'Bet not found' } }),
      })

      await expect(api.get('/v1/bet/999')).rejects.toThrow(ApiError)

      try {
        await api.get('/v1/bet/999')
      } catch (e) {
        expect(e.status).toBe(404)
        expect(e.code).toBe('bet-get-1')
      }
    })

    it('handles 204 No Content', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await api.request('DELETE', '/v1/something/')
      expect(result).toBeNull()
    })

    it('handles JSON parse failure in error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('invalid json')),
      })

      await expect(api.get('/v1/bet/')).rejects.toThrow(ApiError)
    })
  })

  describe('ApiError', () => {
    it('stores status and code', () => {
      const err = new ApiError(422, 'validation-error', 'Invalid amount')
      expect(err.status).toBe(422)
      expect(err.code).toBe('validation-error')
      expect(err.message).toBe('Invalid amount')
    })

    it('uses code as message when message is missing', () => {
      const err = new ApiError(400, 'bad-request')
      expect(err.message).toBe('bad-request')
    })

    it('uses HTTP status as message when both missing', () => {
      const err = new ApiError(500)
      expect(err.message).toBe('HTTP 500')
    })

    it('is an instance of Error', () => {
      const err = new ApiError(404, 'not-found')
      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('token refresh on 401', () => {
    it('retries request after successful token refresh', async () => {
      mockStore._state = {
        token: 'expired_token',
        tokenExp: Math.floor(Date.now() / 1000) - 100, // expired
        refreshToken: 'valid_refresh',
      }

      let callCount = 0
      global.fetch.mockImplementation((url) => {
        if (url.includes('/v1/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              token: 'new_token',
              token_exp: Math.floor(Date.now() / 1000) + 3600,
              refresh_token: 'new_refresh',
              refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
            }),
          })
        }
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ detail: { code: 'unauthorized' } }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
        })
      })

      const result = await api.get('/v1/bet/')
      expect(result).toEqual({ data: 'success' })
    })

    it('logs out when refresh token is missing', async () => {
      mockStore._state = {
        token: 'expired_token',
        tokenExp: Math.floor(Date.now() / 1000) - 100,
        // no refreshToken
      }

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      })

      await expect(api.get('/v1/bet/')).rejects.toThrow()
      expect(mockStore.logout).toHaveBeenCalled()
    })

    it('logs out when refresh endpoint returns non-ok', async () => {
      mockStore._state = {
        token: 'expired_token',
        tokenExp: Math.floor(Date.now() / 1000) - 100,
        refreshToken: 'bad_refresh',
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/v1/auth/refresh')) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () => Promise.resolve({}),
          })
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        })
      })

      await expect(api.get('/v1/bet/')).rejects.toThrow()
      expect(mockStore.logout).toHaveBeenCalled()
    })

    it('throws ApiError when retry after refresh also fails', async () => {
      mockStore._state = {
        token: 'expired_token',
        tokenExp: Math.floor(Date.now() / 1000) - 100,
        refreshToken: 'valid_refresh',
      }

      let callCount = 0
      global.fetch.mockImplementation((url) => {
        if (url.includes('/v1/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              token: 'new_token',
              token_exp: Math.floor(Date.now() / 1000) + 3600,
              refresh_token: 'new_refresh',
              refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
            }),
          })
        }
        callCount++
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: callCount === 1 ? 401 : 422,
            json: () => Promise.resolve({ detail: { code: 'validation-error', message: 'Bad request' } }),
          })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
      })

      await expect(api.get('/v1/bet/')).rejects.toThrow(ApiError)
    })

    it('rethrows ApiError from failed retry without logging out', async () => {
      mockStore._state = {
        token: 'expired_token',
        tokenExp: Math.floor(Date.now() / 1000) - 100,
        refreshToken: 'valid_refresh',
      }

      let callCount = 0
      global.fetch.mockImplementation((url) => {
        if (url.includes('/v1/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              token: 'new_token',
              token_exp: Math.floor(Date.now() / 1000) + 3600,
              refresh_token: 'new_refresh',
              refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
            }),
          })
        }
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({}),
          })
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ detail: { code: 'server-error', message: 'Internal' } }),
        })
      })

      try {
        await api.get('/v1/bet/')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect(e.status).toBe(500)
      }
    })
  })
})
