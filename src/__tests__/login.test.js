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

  it('renders email input for OTP flow', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    expect(emailInput).not.toBeNull()
  })

  it('renders send code button', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const submitBtn = mockContainer.container.querySelector('.login-submit')
    expect(submitBtn).not.toBeNull()
    expect(submitBtn.textContent).toBe('authSendCode')
  })

  it('returns cleanup function', async () => {
    const cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(typeof cleanup).toBe('function')
  })

  it('shows OTP step after successful email submission', async () => {
    api.request.mockResolvedValue(null)

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    emailInput.value = 'test@example.com'
    mockContainer.container.querySelector('.login-submit').click()

    await flushPromises()

    const otpInputs = mockContainer.container.querySelectorAll('.login-otp-digit')
    expect(otpInputs.length).toBe(6)
  })

  it('shows error on failed email submission', async () => {
    api.request.mockRejectedValue(new Error('Network error'))

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    emailInput.value = 'test@example.com'
    mockContainer.container.querySelector('.login-submit').click()

    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
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

describe('two-step email OTP auth flow', () => {
  let mockContainer, cleanup

  /** Render login page and advance to OTP step with the given email */
  async function renderAndGoToOtp(email = 'user@example.com', query = {}) {
    cleanup = await loginPage({
      params: {},
      query,
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    emailInput.value = email
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()
  }

  /** Fill all 6 OTP digit inputs by dispatching input events */
  function fillOtp(code = '123456') {
    const digits = mockContainer.container.querySelectorAll('.login-otp-digit')
    code.split('').forEach((ch, i) => {
      digits[i].value = ch
      digits[i].dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
    cleanup = null
  })

  afterEach(() => {
    vi.useRealTimers()
    if (cleanup) cleanup()
    mockContainer.cleanup()
  })

  // --- Step 1: Email ---

  it('ignores empty email', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.request).not.toHaveBeenCalled()
  })

  it('ignores email without @', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    mockContainer.container.querySelector('.login-input[type="email"]').value = 'notanemail'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.request).not.toHaveBeenCalled()
  })

  it('disables button and shows loading during email submission', async () => {
    let resolveRequest
    api.request.mockImplementation(() => new Promise(r => { resolveRequest = r }))

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    const submitBtn = mockContainer.container.querySelector('.login-submit')
    emailInput.value = 'user@example.com'
    submitBtn.click()

    // While request is in-flight
    expect(submitBtn.disabled).toBe(true)
    expect(submitBtn.textContent).toBe('...')

    resolveRequest(null)
    await flushPromises()
  })

  it('calls POST /v1/auth/email with correct body', async () => {
    api.request.mockResolvedValueOnce(null)

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    mockContainer.container.querySelector('.login-input[type="email"]').value = 'user@example.com'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email', {
      body: { email: 'user@example.com' },
    })
  })

  it('submits email on Enter keypress', async () => {
    api.request.mockResolvedValueOnce(null)

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    emailInput.value = 'user@example.com'
    emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email', {
      body: { email: 'user@example.com' },
    })
  })

  it('shows rate limit error on 429 during email step', async () => {
    const { ApiError } = await import('../api.js')
    api.request.mockRejectedValueOnce(new ApiError(429, 'rate_limit'))

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    mockContainer.container.querySelector('.login-input[type="email"]').value = 'user@example.com'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('authTooManyAttempts')
  })

  it('re-enables submit button after email error', async () => {
    api.request.mockRejectedValueOnce(new Error('fail'))

    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const submitBtn = mockContainer.container.querySelector('.login-submit')
    mockContainer.container.querySelector('.login-input[type="email"]').value = 'user@example.com'
    submitBtn.click()
    await flushPromises()

    expect(submitBtn.disabled).toBe(false)
    expect(submitBtn.textContent).toBe('authSendCode')
  })

  // --- Transition to OTP ---

  it('shows confirmation email in OTP step', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp('test@mail.com')

    const emailText = mockContainer.container.querySelector('.login-otp-email')
    expect(emailText.textContent).toContain('test@mail.com')
  })

  it('updates title to authCheckEmail on OTP step', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    const title = mockContainer.container.querySelector('.login-card__title')
    expect(title.textContent).toBe('authCheckEmail')
  })

  it('renders 6 digit inputs in OTP step', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    const digits = mockContainer.container.querySelectorAll('.login-otp-digit')
    expect(digits.length).toBe(6)
  })

  it('renders back and resend buttons in OTP step', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    expect(mockContainer.container.querySelector('.login-back-btn')).not.toBeNull()
    expect(mockContainer.container.querySelector('.login-resend-btn')).not.toBeNull()
  })

  // --- Step 2: OTP submission ---

  it('auto-submits when all 6 digits are filled', async () => {
    const authResponse = {
      token: 'access-tok',
      token_exp: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'refresh-tok',
      refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
      user_id: 'u1',
    }
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 5000 })

    await renderAndGoToOtp('user@example.com')
    fillOtp('654321')
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email/validate', {
      body: { email: 'user@example.com', code: '654321' },
    })
  })

  it('calls store.login and store.set with auth data and email', async () => {
    const authResponse = {
      token: 'access-tok',
      token_exp: 9999999999,
      refresh_token: 'refresh-tok',
      refresh_token_exp: 9999999999,
      user_id: 'u1',
    }
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 1000 })

    await renderAndGoToOtp('user@example.com')
    fillOtp('111111')
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith(authResponse)
    expect(store.set).toHaveBeenCalledWith({ email: 'user@example.com' })
  })

  it('fetches balance after successful OTP validation', async () => {
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 4200 })

    await renderAndGoToOtp()
    fillOtp('123456')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/v1/balance/', { size: 1 })
    expect(store.set).toHaveBeenCalledWith({ balance: 4200 })
  })

  it('navigates to / after successful auth', async () => {
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 0 })

    await renderAndGoToOtp()
    fillOtp('123456')
    await flushPromises()

    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  it('navigates to redirect param after successful auth', async () => {
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockResolvedValue({ balance: 0 })

    await renderAndGoToOtp('user@example.com', { redirect: '/bet/abc' })
    fillOtp('123456')
    await flushPromises()

    expect(router.navigate).toHaveBeenCalledWith('/bet/abc')
  })

  it('still completes auth when balance fetch fails', async () => {
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' })
    api.get.mockRejectedValue(new Error('network'))

    await renderAndGoToOtp()
    fillOtp('123456')
    await flushPromises()

    expect(store.login).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  // --- OTP errors ---

  it('shows invalid code error on 401 and clears inputs', async () => {
    const { ApiError } = await import('../api.js')
    api.request
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))

    await renderAndGoToOtp()
    fillOtp('000000')
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('authInvalidCode')

    // Inputs should be cleared
    const digits = mockContainer.container.querySelectorAll('.login-otp-digit')
    digits.forEach(d => expect(d.value).toBe(''))
  })

  it('adds shake class on invalid code', async () => {
    const { ApiError } = await import('../api.js')
    api.request
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))

    await renderAndGoToOtp()
    fillOtp('000000')
    await flushPromises()

    const otpGroup = mockContainer.container.querySelector('.login-otp-inputs')
    expect(otpGroup.classList.contains('login-otp-inputs--shake')).toBe(true)
  })

  it('shows rate limit error on 429 during OTP step', async () => {
    const { ApiError } = await import('../api.js')
    api.request
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new ApiError(429, 'rate_limit'))

    await renderAndGoToOtp()
    fillOtp('123456')
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('authTooManyAttempts')
  })

  it('shows generic error message for unexpected OTP errors', async () => {
    api.request
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('Server exploded'))

    await renderAndGoToOtp()
    fillOtp('123456')
    await flushPromises()

    const errorEl = mockContainer.container.querySelector('.login-error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('Server exploded')
  })

  it('allows retry after failed OTP submission', async () => {
    const { ApiError } = await import('../api.js')
    const authResponse = { token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' }
    api.request
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new ApiError(401, 'unauthorized'))
      .mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 0 })

    await renderAndGoToOtp()
    fillOtp('000000')
    await flushPromises()

    // Inputs cleared, try again
    fillOtp('123456')
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith(authResponse)
    expect(router.navigate).toHaveBeenCalledWith('/')
  })

  // --- OTP input behavior ---

  it('handles paste of full code', async () => {
    const authResponse = { token: 't', token_exp: 9999999999, refresh_token: 'r', refresh_token_exp: 9999999999, user_id: 'u' }
    api.request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 0 })

    await renderAndGoToOtp()

    const digits = mockContainer.container.querySelectorAll('.login-otp-digit')
    const pasteEvent = new Event('paste', { bubbles: true })
    pasteEvent.clipboardData = { getData: () => '987654' }
    pasteEvent.preventDefault = vi.fn()
    digits[0].dispatchEvent(pasteEvent)
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email/validate', {
      body: { email: 'user@example.com', code: '987654' },
    })
  })

  it('backspace moves focus to previous digit', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    const digits = mockContainer.container.querySelectorAll('.login-otp-digit')
    digits[1].focus()
    digits[1].value = ''
    digits[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))

    expect(document.activeElement).toBe(digits[0])
  })

  // --- Back button ---

  it('back button returns to email step', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    mockContainer.container.querySelector('.login-back-btn').click()

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    expect(emailInput).not.toBeNull()
    expect(mockContainer.container.querySelectorAll('.login-otp-digit').length).toBe(0)
  })

  it('title resets to signInToHopium on back', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()
    mockContainer.container.querySelector('.login-back-btn').click()

    const title = mockContainer.container.querySelector('.login-card__title')
    expect(title.textContent).toBe('signInToHopium')
  })

  // --- Resend ---

  it('resend button starts disabled with cooldown', async () => {
    api.request.mockResolvedValueOnce(null)
    await renderAndGoToOtp()

    const resendBtn = mockContainer.container.querySelector('.login-resend-btn')
    expect(resendBtn.disabled).toBe(true)
    expect(resendBtn.textContent).toContain('45')
  })

  it('resend calls POST /v1/auth/email again', async () => {
    vi.useFakeTimers()
    api.request.mockResolvedValueOnce(null)

    // Render login page and go to OTP step using advanceTimersByTimeAsync
    // to flush promises under fake timers
    cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    emailInput.value = 'user@example.com'
    mockContainer.container.querySelector('.login-submit').click()
    await vi.advanceTimersByTimeAsync(0)

    // Fast-forward past the 45s cooldown
    vi.advanceTimersByTime(45000)

    const resendBtn = mockContainer.container.querySelector('.login-resend-btn')
    expect(resendBtn.disabled).toBe(false)

    api.request.mockResolvedValueOnce(null)
    resendBtn.click()
    await vi.advanceTimersByTimeAsync(0)

    expect(api.request).toHaveBeenLastCalledWith('POST', '/v1/auth/email', {
      body: { email: 'user@example.com' },
    })
  })

  // --- Full end-to-end flow ---

  it('complete flow: email → OTP → auth → redirect', async () => {
    const authResponse = {
      token: 'my-token',
      token_exp: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'my-refresh',
      refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
      user_id: 'user-42',
    }

    // Step 1: Email submission succeeds
    api.request.mockResolvedValueOnce(null)

    cleanup = await loginPage({
      params: {},
      query: { redirect: '/my-bets' },
      container: mockContainer.container,
    })

    // Verify email step rendered
    const emailInput = mockContainer.container.querySelector('.login-input[type="email"]')
    expect(emailInput).not.toBeNull()

    // Submit email
    emailInput.value = 'player@hopium.bet'
    mockContainer.container.querySelector('.login-submit').click()
    await flushPromises()

    // Verify transition to OTP step
    expect(mockContainer.container.querySelector('.login-otp-email').textContent).toContain('player@hopium.bet')
    expect(mockContainer.container.querySelectorAll('.login-otp-digit').length).toBe(6)

    // Step 2: Set up OTP mocks after email mock is consumed
    api.request.mockResolvedValueOnce(authResponse)
    api.get.mockResolvedValue({ balance: 25000 })

    fillOtp('482901')
    await flushPromises()

    // Verify full auth sequence
    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email', {
      body: { email: 'player@hopium.bet' },
    })
    expect(api.request).toHaveBeenCalledWith('POST', '/v1/auth/email/validate', {
      body: { email: 'player@hopium.bet', code: '482901' },
    })
    expect(store.login).toHaveBeenCalledWith(authResponse)
    expect(store.set).toHaveBeenCalledWith({ email: 'player@hopium.bet' })
    expect(store.set).toHaveBeenCalledWith({ balance: 25000 })
    expect(router.navigate).toHaveBeenCalledWith('/my-bets')
  })
})
