import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockContainer, flushPromises } from './helpers.js'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
  getLang: () => 'en',
  setLang: vi.fn(),
  localize: (dict) => {
    if (!dict) return ''
    if (typeof dict === 'string') return dict
    return dict.en || ''
  },
}))

vi.mock('../store.js', () => {
  const _state = {}
  const _listeners = new Map()
  const store = {
    _state,
    get: vi.fn((key) => store._state[key] ?? null),
    set: vi.fn((updates) => Object.assign(store._state, updates)),
    on: vi.fn((key, fn) => {
      if (!_listeners.has(key)) _listeners.set(key, new Set())
      _listeners.get(key).add(fn)
      return () => _listeners.get(key)?.delete(fn)
    }),
    get isAuthenticated() {
      return !!store._state.token
    },
    _listeners,
  }
  return { store }
})

vi.mock('../constants.js', () => ({
  API_BASE: 'https://api.test.com',
  CATEGORIES: ['Sports', 'Politics', 'Crypto', 'Culture', 'Tech'],
  CATEGORY_COLORS: { Crypto: '#F59E0B' },
  MIN_BET: 1_000_000_000,
  MIN_DEPOSIT: 1_000_000_000,
  MIN_WITHDRAWAL: 5_000_000_000,
  PLATFORM_FEE: 0.05,
}))

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

import { profilePage } from '../pages/profile.js'
import { api, ApiError } from '../api.js'
import { store } from '../store.js'

function makeTxItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    type: i % 2 === 0 ? 'deposit' : 'bet_placed',
    amount: i % 2 === 0 ? 1_000_000_000 : -500_000_000,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

describe('profilePage', () => {
  let mockContainer

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  function renderPage(opts = {}) {
    return profilePage({
      params: {},
      query: {},
      container: mockContainer.container,
      ...opts,
    })
  }

  it('shows login prompt when not authenticated', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty--login')).not.toBeNull()
    expect(mockContainer.container.querySelector('.page--profile')).toBeNull()
    cleanup()
  })

  it('login prompt links to /login with redirect', async () => {
    const cleanup = await renderPage()
    const link = mockContainer.container.querySelector('a[href*="/login"]')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toContain('redirect=/profile')
    cleanup()
  })

  it('renders page shell when authenticated', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page--profile')).not.toBeNull()
    cleanup()
  })

  it('renders balance card with formatted balance', async () => {
    store._state.token = 'tok'
    store._state.balance = 100_000_000_000
    api.get.mockResolvedValue({ balance: 100_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.balance-card')).not.toBeNull()
    expect(mockContainer.container.querySelector('.balance-card__value')).not.toBeNull()
    cleanup()
  })

  it('renders deposit and withdraw buttons', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.balance-deposit-btn')).not.toBeNull()
    expect(mockContainer.container.querySelector('.balance-withdraw-btn')).not.toBeNull()
    cleanup()
  })

  it('renders transactions section', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: makeTxItems(3), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.tx-table')).not.toBeNull()
    const rows = mockContainer.container.querySelectorAll('.tx-row')
    expect(rows.length).toBe(3)
    cleanup()
  })

  it('shows empty state when no transactions', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 10_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('shows load more button when cursor present', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: makeTxItems(5), prev: 'cursor-1' })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).not.toBeNull()
    cleanup()
  })

  it('hides load more when no cursor', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: makeTxItems(3), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).toBeNull()
    cleanup()
  })

  it('clicking deposit button shows deposit form', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    const depositBtn = mockContainer.container.querySelector('.balance-deposit-btn')
    depositBtn.click()

    expect(mockContainer.container.querySelector('.balance-flow--deposit')).not.toBeNull()
    cleanup()
  })

  it('clicking withdraw button shows withdraw form', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    const withdrawBtn = mockContainer.container.querySelector('.balance-withdraw-btn')
    withdrawBtn.click()

    expect(mockContainer.container.querySelector('.balance-flow--withdraw')).not.toBeNull()
    cleanup()
  })

  it('toggling deposit button twice closes the form', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    const depositBtn = mockContainer.container.querySelector('.balance-deposit-btn')
    depositBtn.click() // open
    depositBtn.click() // close

    expect(mockContainer.container.querySelector('.balance-flow--deposit')).toBeNull()
    cleanup()
  })

  it('deposit form has quick amount buttons', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-deposit-btn').click()

    const quickBtns = mockContainer.container.querySelectorAll('.stake-quick')
    expect(quickBtns.length).toBe(4)
    cleanup()
  })

  it('quick amount button sets deposit input value', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-deposit-btn').click()
    mockContainer.container.querySelector('.stake-quick[data-amount="5"]').click()

    const input = mockContainer.container.querySelector('.balance-flow__input')
    expect(input.value).toBe('5')
    cleanup()
  })

  it('deposit confirm calls API with nanotons', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    api.post.mockResolvedValue({ ton_deep_link: 'ton://transfer/EQ...', memo: 'abc123', amount_nanoton: 10_000_000_000, expires_at: new Date(Date.now() + 30 * 60_000).toISOString() })
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-deposit-btn').click()
    const input = mockContainer.container.querySelector('.balance-flow__input')
    input.value = '10'
    mockContainer.container.querySelector('.balance-flow__confirm').click()

    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/v1/balance/deposit', { amount: 10_000_000_000 })
    cleanup()
  })

  it('deposit error shows error message', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    api.post.mockRejectedValue(new ApiError(400, 'deposit-1', 'fail'))
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-deposit-btn').click()
    const input = mockContainer.container.querySelector('.balance-flow__input')
    input.value = '10'
    mockContainer.container.querySelector('.balance-flow__confirm').click()

    await flushPromises()
    const errorEl = mockContainer.container.querySelector('.balance-flow__error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('paymentUnavailable')
    cleanup()
  })

  it('withdraw confirm calls API with nanotons and wallet address', async () => {
    store._state.token = 'tok'
    store._state.balance = 50_000_000_000
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    api.post.mockResolvedValue({ withdrawal_id: 'w-1', amount: 50_000_000_000 })
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-withdraw-btn').click()
    const amountInput = mockContainer.container.querySelector('.balance-flow__amount')
    amountInput.value = '50'
    const walletInput = mockContainer.container.querySelector('.balance-flow__wallet')
    walletInput.value = 'EQDrjaLahLkMB-hMCmkzOyBuHJ186Kj3BbFJXwdFEEPayIGH'
    mockContainer.container.querySelector('.balance-flow__confirm').click()

    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/v1/balance/withdraw', {
      amount: 50_000_000_000,
      wallet_address: 'EQDrjaLahLkMB-hMCmkzOyBuHJ186Kj3BbFJXwdFEEPayIGH',
    })
    cleanup()
  })

  it('withdraw error shows specific error messages', async () => {
    store._state.token = 'tok'
    store._state.balance = 50_000_000_000
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    api.post.mockRejectedValue(new ApiError(400, 'withdraw-3', 'fail'))
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-withdraw-btn').click()
    const amountInput = mockContainer.container.querySelector('.balance-flow__amount')
    amountInput.value = '50'
    const walletInput = mockContainer.container.querySelector('.balance-flow__wallet')
    walletInput.value = 'EQDrjaLahLkMB-hMCmkzOyBuHJ186Kj3BbFJXwdFEEPayIGH'
    mockContainer.container.querySelector('.balance-flow__confirm').click()

    await flushPromises()
    const errorEl = mockContainer.container.querySelector('.balance-flow__error')
    expect(errorEl.hidden).toBe(false)
    expect(errorEl.textContent).toBe('withdrawFailed')
    cleanup()
  })

  it('shows error state on transaction fetch failure', async () => {
    store._state.token = 'tok'
    api.get.mockRejectedValue(new Error('Network error'))
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('updates balance from API response', async () => {
    store._state.token = 'tok'
    store._state.balance = 10_000_000_000
    api.get.mockResolvedValue({ balance: 99_900_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(store.set).toHaveBeenCalledWith({ balance: 99_900_000_000 })
    cleanup()
  })

  it('cleanup removes event listeners without error', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(() => cleanup()).not.toThrow()
  })

  it('switching from deposit to withdraw replaces the form', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.balance-deposit-btn').click()
    expect(mockContainer.container.querySelector('.balance-flow--deposit')).not.toBeNull()

    mockContainer.container.querySelector('.balance-withdraw-btn').click()
    expect(mockContainer.container.querySelector('.balance-flow--deposit')).toBeNull()
    expect(mockContainer.container.querySelector('.balance-flow--withdraw')).not.toBeNull()
    cleanup()
  })

  it('transactions section has title', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ balance: 50_000_000_000, items: makeTxItems(1), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.tx-section__title').textContent).toBe('transactions')
    cleanup()
  })

  it('shows balance hint when balance is zero', async () => {
    store._state.token = 'tok'
    store._state.balance = 0
    api.get.mockResolvedValue({ balance: 0, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.balance-card__hint')).not.toBeNull()
    cleanup()
  })

  it('does not show balance hint when balance is positive', async () => {
    store._state.token = 'tok'
    store._state.balance = 10_000_000_000
    api.get.mockResolvedValue({ balance: 10_000_000_000, items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.balance-card__hint')).toBeNull()
    cleanup()
  })
})
