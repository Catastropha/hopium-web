import { API_BASE } from './constants.js'
import { store } from './store.js'

function fetchWithTimeout(url, options, timeout = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

let isRefreshing = false
let refreshPromise = null

async function refreshToken() {
  const refreshToken = store.get('refreshToken')
  if (!refreshToken) {
    store.logout()
    throw new Error('No refresh token')
  }

  const res = await fetchWithTimeout(`${API_BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    store.logout()
    throw new Error('Refresh failed')
  }

  const data = await res.json()
  store.login(data)
  return data.token
}

async function getValidToken() {
  const token = store.get('token')
  const tokenExp = store.get('tokenExp')

  // If token exists and not expired (with 30s buffer), use it
  if (token && tokenExp && tokenExp * 1000 > Date.now() + 30_000) {
    return token
  }

  // Need to refresh
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = refreshToken().finally(() => {
      isRefreshing = false
      refreshPromise = null
    })
  }

  try {
    await refreshPromise
    return store.get('token')
  } catch {
    return null
  }
}

/**
 * API client. Thin wrapper around fetch.
 *
 * api.get('/v1/bet/', { size: 20 })
 * api.post('/v1/position/', { bet_id: '...', outcome_id: '...', amount: 100 })
 */
export const api = {
  async request(method, path, { params, body, auth = false } = {}) {
    let url = `${API_BASE}${path}`

    if (params) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== '') qs.set(k, String(v))
      }
      const str = qs.toString()
      if (str) url += `?${str}`
    }

    const headers = { 'Content-Type': 'application/json' }

    if (auth || store.isAuthenticated) {
      const token = await getValidToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetchWithTimeout(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401 && store.isAuthenticated) {
      // Try refresh once
      try {
        const newToken = await refreshToken()
        headers['Authorization'] = `Bearer ${newToken}`
        const retry = await fetchWithTimeout(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}))
          throw new ApiError(retry.status, err.detail?.code, err.detail?.message)
        }
        return retry.json()
      } catch (e) {
        if (e instanceof ApiError) throw e
        store.logout()
        throw e
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new ApiError(res.status, err.detail?.code, err.detail?.message)
    }

    // Handle 204 No Content
    if (res.status === 204) return null
    return res.json()
  },

  get(path, params) {
    return this.request('GET', path, { params })
  },

  post(path, body) {
    return this.request('POST', path, { body, auth: true })
  },
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code || `HTTP ${status}`)
    this.status = status
    this.code = code
  }
}
