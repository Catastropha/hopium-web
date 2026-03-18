import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockContainer } from './helpers.js'

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
}))

import { loginPage } from '../pages/login.js'
import { store } from '../store.js'
import { router } from '../router.js'

describe('login page', () => {
  let mockContainer

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
    delete window.__hopiumTelegramAuth
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

  it('mounts Telegram widget script', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    const script = mockContainer.container.querySelector('script')
    expect(script).not.toBeNull()
    expect(script.src).toContain('telegram.org')
  })

  it('exposes __hopiumTelegramAuth global callback', async () => {
    await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(typeof window.__hopiumTelegramAuth).toBe('function')
  })

  it('returns cleanup function', async () => {
    const cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    expect(typeof cleanup).toBe('function')
  })

  it('cleanup removes global callback', async () => {
    const cleanup = await loginPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })

    cleanup()
    expect(window.__hopiumTelegramAuth).toBeUndefined()
  })
})
