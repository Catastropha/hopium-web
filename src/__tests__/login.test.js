import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockContainer, flushPromises } from './helpers.js'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
}))

vi.mock('../store.js', () => {
  const _state = {}
  const store = {
    _state,
    get: vi.fn((key) => store._state[key] ?? null),
    set: vi.fn((updates) => Object.assign(store._state, updates)),
    login: vi.fn(),
    get isAuthenticated() {
      return !!store._state.token
    },
  }
  return { store }
})

vi.mock('../api.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(status, code, message) {
      super(message || code || `HTTP ${status}`)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock('../router.js', () => ({
  router: {
    navigate: vi.fn(),
  },
}))

vi.mock('../constants.js', () => ({
  BOT_USERNAME: 'HopiumBot',
  TMA_URL: 'https://t.me/HopiumBot/app',
}))

vi.mock('../utils/mobile.js', () => ({
  isMobile: () => false,
  getTMALink: (ctx) => ctx ? `https://t.me/HopiumBot/app?startapp=${ctx}` : 'https://t.me/HopiumBot/app',
}))

import { loginPage } from '../pages/login.js'
import { store } from '../store.js'
import { router } from '../router.js'
import { api } from '../api.js'

describe('login page', () => {
  let mockContainer

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  it('redirects if already authenticated', async () => {
    store._state.token = 'tok'

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  it('redirects to custom redirect path', async () => {
    store._state.token = 'tok'

    await loginPage({
      params: {},
      query: { redirect: '/my-bets' },
      container: mockContainer.container,
    })

    expect(router.navigate).toHaveBeenCalledWith('/my-bets')
  })

  it('renders login card when not authenticated', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.querySelector('.login-card')).not.toBeNull()
  })

  it('renders logo image', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const img = mockContainer.container.querySelector('.login-card__logo img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/logo-letter.svg')
  })

  it('renders code input for web-code flow', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const codeInput = mockContainer.container.querySelector('.login-code-input')
    expect(codeInput).not.toBeNull()
    expect(codeInput.getAttribute('type')).toBe('text')
    expect(codeInput.getAttribute('maxlength')).toBe('6')
  })

  it('renders verify button', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const submitBtn = mockContainer.container.querySelector('.login-submit')
    expect(submitBtn).not.toBeNull()
    expect(submitBtn.textContent).toBe('loginVerify')
  })

  it('returns cleanup function', async () => {
    const cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(typeof cleanup).toBe('function')
  })

  it('renders Telegram link at bottom of login card', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const tmaLink = mockContainer.container.querySelector('.login-card__tma-link')
    expect(tmaLink).not.toBeNull()
    expect(tmaLink.getAttribute('href')).toBe('https://t.me/HopiumBot/app')
    expect(tmaLink.textContent).toBe('onMobileOpenTelegram')
  })
})

describe('web-code auth flow', () => {
  let mockContainer, cleanup

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
    cleanup = null
  })

  afterEach(() => {
    if (cleanup) cleanup()
    mockContainer.cleanup()
  })

  it('ignores submission when code is too short', async () => {
    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'AB'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.request).not.toHaveBeenCalled()
  })

  it('auto-uppercases input and strips invalid characters', async () => {
    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'abc!23'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(input.value).toBe('ABC23')
  })

  it('disables button and shows loading during submission', async () => {
    let resolveRequest
    api.request.mockImplementation(() => new Promise(r => { resolveRequest = r }))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    const submitBtn = mockContainer.container.querySelector('.login-submit')
    input.value = 'ABC234'
    submitBtn.click()

    expect(submitBtn.disabled).toBe(true)
    expect(submitBtn.textContent).toBe('...')

    resolveRequest({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    await flushPromises()
  })

  it('calls POST /v1/auth/web-code/validate with correct body', async () => {
    const authResponse = { token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' }
    api.request.mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 0 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'XYZ789'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/web-code/validate', {
      body: { code: 'XYZ789' },
    })
  })

  it('submits code on Enter keypress', async () => {
    const authResponse = { token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' }
    api.request.mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 0 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/web-code/validate', {
      body: { code: 'ABC234' },
    })
  })

  it('calls store.login with auth response', async () => {
    const authResponse = {
      token: 'access-tok',
      token_exp: 9999999999,
      refresh_token: 'refresh-tok',
      refresh_token_exp: 9999999999,
      user_id: 'u1',
    }
    api.request.mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 1000 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith(authResponse)
  })

  it('fetches balance after successful validation', async () => {
    api.request.mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 4200 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/v1/balance/', { size: 1 })
    expect(store.set).toHaveBeenCalledWith({ balance: 4200 })
  })

  it('navigates to / after successful auth', async () => {
    api.request.mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 0 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  it('navigates to redirect param after successful auth', async () => {
    api.request.mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 0 })

    cleanup = await loginPage({
      params: {},
      query: { redirect: '/bet/abc' },
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(router.navigate).toHaveBeenCalledWith('/bet/abc')
  })

  it('still completes auth when balance fetch fails', async () => {
    api.request.mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockRejectedValue(new Error('network'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(store.login).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  // --- Error handling ---

  it('shows invalid code error on 401 and clears input', async () => {
    const { ApiError } = await import('../api.js')
    api.request.mockRejectedValueOnce(new ApiError(401, 'unauthorized'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'BADCOD'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('authInvalidCode')
    expect(input.value).toBe('')
  })

  it('adds shake class on invalid code', async () => {
    const { ApiError } = await import('../api.js')
    api.request.mockRejectedValueOnce(new ApiError(401, 'unauthorized'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'BADCOD'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(input.classList.contains('login-code-input--shake')).toBe(true)
  })

  it('shows rate limit error on 429', async () => {
    const { ApiError } = await import('../api.js')
    api.request.mockRejectedValueOnce(new ApiError(429, 'rate_limit'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('authTooManyAttempts')
  })

  it('shows generic error message for unexpected errors', async () => {
    api.request.mockRejectedValueOnce(new Error('Server exploded'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('Server exploded')
  })

  it('re-enables submit button after error', async () => {
    api.request.mockRejectedValueOnce(new Error('fail'))

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')
    const submitBtn = mockContainer.container.querySelector('.login-submit')
    input.value = 'ABC234'
    submitBtn.click()
    await flushPromises()

    expect(submitBtn.disabled).toBe(false)
    expect(submitBtn.textContent).toBe('loginVerify')
  })

  it('allows retry after failed submission', async () => {
    const { ApiError } = await import('../api.js')
    const authResponse = { token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' }
    api.request
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))
      .mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 0 })

    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const input = mockContainer.container.querySelector('.login-code-input')

    // First attempt fails
    input.value = 'BADCOD'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    // Input cleared, retry with correct code
    input.value = 'ABC234'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith(authResponse)
    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  // --- Full end-to-end flow ---

  it('complete flow: enter code → auth → redirect', async () => {
    const authResponse = {
      token: 'my-token',
      token_exp: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'my-refresh',
      refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
      user_id: 'user-42',
    }

    api.request.mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 25000 })

    cleanup = await loginPage({
      params: {},
      query: { redirect: '/my-bets' },
      container: mockContainer.container,
    })

    // Verify code input rendered
    const input = mockContainer.container.querySelector('.login-code-input')
    expect(input).not.toBeNull()

    // Submit code
    input.value = 'XYZ789'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    // Verify full auth sequence
    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/web-code/validate', {
      body: { code: 'XYZ789' },
    })
    expect(store.login).toHaveBeenCalledWith(authResponse)
    expect(store.set).toHaveBeenCalledWith({ balance: 25000 })
    expect(router.navigate).toHaveBeenCalledWith('/my-bets')
  })
})
