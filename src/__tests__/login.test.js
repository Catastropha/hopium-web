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
})
