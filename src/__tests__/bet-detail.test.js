import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockBet, createMockContainer, flushPromises } from './helpers.js'

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
  const store = {
    _state,
    get: vi.fn((key) => store._state[key] ?? null),
    set: vi.fn((updates) => Object.assign(store._state, updates)),
    login: vi.fn((res) => {
      Object.assign(store._state, {
        token: res.token,
        tokenExp: res.token_exp,
        refreshToken: res.refresh_token,
        refreshTokenExp: res.refresh_token_exp,
        userId: res.user_id,
      })
    }),
    on: vi.fn(() => () => {}),
    get isAuthenticated() {
      return !!store._state.token
    },
  }
  return { store }
})

vi.mock('../constants.js', () => ({
  API_BASE: 'https://api.test.com',
  CATEGORIES: ['Sports', 'Politics', 'Crypto', 'Culture', 'Tech'],
  CATEGORY_COLORS: { Crypto: '#F59E0B' },
  MIN_BET: 100,
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

vi.mock('../utils/seo.js', () => ({
  setBetMeta: vi.fn(),
}))

vi.mock('../components/toast.js', () => ({
  showToast: vi.fn(),
}))

vi.mock('../components/odds-bar.js', () => ({
  createOddsBar: vi.fn(() => {
    const el = document.createElement('div')
    el.className = 'odds-bar'
    return el
  }),
  updateOddsBar: vi.fn(),
}))

vi.mock('../components/skeleton.js', () => ({
  createDetailSkeleton: vi.fn(() => {
    const el = document.createElement('div')
    el.className = 'bet-detail--skeleton'
    return el
  }),
}))

import { createBetDetail } from '../components/bet-detail.js'
import { api } from '../api.js'
import { store } from '../store.js'

describe('bet-detail', () => {
  let mockContainer

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  it('returns an HTMLElement immediately', () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    expect(el).toBeInstanceOf(HTMLElement)
  })

  it('shows skeleton while loading', () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    expect(el.querySelector('.bet-detail--skeleton')).not.toBeNull()
  })

  it('renders bet title after load', async () => {
    const bet = createMockBet({ title: { en: 'Test Bet Title' } })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()
    expect(el.querySelector('.bet-detail__title').textContent).toBe('Test Bet Title')
  })

  it('renders category', async () => {
    const bet = createMockBet({ category: 'Sports' })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()
    expect(el.querySelector('.bet-detail__category').textContent).toBe('Sports')
  })

  it('renders two outcome buttons', async () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()
    const outcomes = el.querySelectorAll('.bet-detail__outcome')
    expect(outcomes.length).toBe(2)
  })

  it('renders close button', async () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()
    expect(el.querySelector('.bet-detail__close')).not.toBeNull()
  })

  it('shows login prompt when unauthenticated user clicks outcome', async () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const outcomeBtn = el.querySelector('.bet-detail__outcome')
    outcomeBtn.click()

    expect(el.querySelector('.bet-detail__login-prompt').hidden).toBe(false)
  })

  it('shows stake section when authenticated user clicks outcome', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const outcomeBtn = el.querySelector('.bet-detail__outcome')
    outcomeBtn.click()

    expect(el.querySelector('.bet-detail__stake').hidden).toBe(false)
  })

  it('toggles outcome selection on second click', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const outcomeBtn = el.querySelector('.bet-detail__outcome')
    outcomeBtn.click() // select
    outcomeBtn.click() // deselect

    expect(el.querySelector('.bet-detail__stake').hidden).toBe(true)
  })

  it('quick amount buttons set input value in dollars', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    // Select an outcome first
    el.querySelector('.bet-detail__outcome').click()

    const quickBtn = el.querySelector('.bet-detail__quick[data-amount="1000"]')
    quickBtn.click()

    const input = el.querySelector('.bet-detail__stake-input')
    expect(input.value).toBe('10.00')
  })

  it('MAX button sets input to balance in dollars', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()
    el.querySelector('.bet-detail__stake-max').click()

    expect(el.querySelector('.bet-detail__stake-input').value).toBe('500.00')
  })

  it('place bet button is disabled initially', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__place-btn').disabled).toBe(true)
  })

  it('renders resolved bet with winner badge', async () => {
    const bet = createMockBet({
      outcomes: [
        { id: 'out-yes', label: { en: 'Yes' }, pool: 300000, odds: 1.67, is_winner: true },
        { id: 'out-no', label: { en: 'No' }, pool: 200000, odds: 2.5, is_winner: false },
      ],
    })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__resolved-badge')).not.toBeNull()
  })

  it('disables outcome buttons for resolved bets', async () => {
    const bet = createMockBet({
      outcomes: [
        { id: 'out-yes', label: { en: 'Yes' }, pool: 300000, odds: 1.67, is_winner: true },
        { id: 'out-no', label: { en: 'No' }, pool: 200000, odds: 2.5, is_winner: false },
      ],
    })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const outcomes = el.querySelectorAll('.bet-detail__outcome')
    outcomes.forEach(btn => {
      expect(btn.disabled).toBe(true)
    })
  })

  it('shows error state with retry button on API failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'))
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__error')).not.toBeNull()
    expect(el.querySelector('.bet-detail__retry')).not.toBeNull()
  })

  it('shows description when present', async () => {
    const bet = createMockBet({ description: { en: 'A test description' } })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__description').textContent).toBe('A test description')
  })

  it('shows resolution criteria when present', async () => {
    const bet = createMockBet({ resolution_criteria: { en: 'Based on CoinGecko' } })
    api.get.mockResolvedValue(bet)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__resolution-box').textContent).toBe('Based on CoinGecko')
  })

  it('shows share button', async () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__share')).not.toBeNull()
  })

  it('has pay with card button', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__card-btn')).not.toBeNull()
  })

  it('shows dollar symbol for stake input', async () => {
    store._state.token = 'tok'
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    expect(el.querySelector('.bet-detail__stake-dollar').textContent).toBe('$')
  })

  // Inline auth flow
  it('shows inline email input when unauthenticated user clicks outcome', async () => {
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()

    const emailInput = el.querySelector('.bet-detail__auth-email')
    expect(emailInput).not.toBeNull()
    expect(emailInput.type).toBe('email')
  })

  it('shows OTP inputs after sending email code', async () => {
    api.get.mockResolvedValue(createMockBet())
    api.request.mockResolvedValue(null)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()

    const emailInput = el.querySelector('.bet-detail__auth-email')
    emailInput.value = 'test@example.com'
    el.querySelector('.bet-detail__auth-send').click()
    await flushPromises()

    const otpDigits = el.querySelectorAll('.login-otp-digit')
    expect(otpDigits.length).toBe(6)
  })

  it('shows stake section after successful inline auth', async () => {
    store._state.balance = 50000
    api.get.mockResolvedValue(createMockBet())
    api.request
      .mockResolvedValueOnce(null) // send email
      .mockResolvedValueOnce({     // validate OTP
        token: 'new-tok',
        token_exp: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'ref',
        refresh_token_exp: Math.floor(Date.now() / 1000) + 86400,
        user_id: 'u-1',
      })
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    // Select outcome
    el.querySelector('.bet-detail__outcome').click()

    // Enter email and send
    el.querySelector('.bet-detail__auth-email').value = 'test@example.com'
    el.querySelector('.bet-detail__auth-send').click()
    await flushPromises()

    // Enter OTP digits
    const digits = el.querySelectorAll('.login-otp-digit')
    '123456'.split('').forEach((ch, i) => {
      digits[i].value = ch
      digits[i].dispatchEvent(new Event('input'))
    })
    await flushPromises()

    // Stake section should now be visible
    expect(el.querySelector('.bet-detail__stake').hidden).toBe(false)
  })

  it('shows back button in OTP step', async () => {
    api.get.mockResolvedValue(createMockBet())
    api.request.mockResolvedValue(null)
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()
    el.querySelector('.bet-detail__auth-email').value = 'test@example.com'
    el.querySelector('.bet-detail__auth-send').click()
    await flushPromises()

    const backBtn = el.querySelector('.login-back-btn')
    expect(backBtn).not.toBeNull()

    // Clicking back returns to email input
    backBtn.click()
    expect(el.querySelector('.bet-detail__auth-email')).not.toBeNull()
  })

  // Win celebration
  it('shows win celebration for resolved bets with winning position', async () => {
    const bet = createMockBet({
      outcomes: [
        { id: 'out-yes', label: { en: 'Yes' }, pool: 300000, odds: 1.67, is_winner: true },
        { id: 'out-no', label: { en: 'No' }, pool: 200000, odds: 2.5, is_winner: false },
      ],
      user_positions: [
        { outcome_id: 'out-yes', amount: 1000, payout: 1670 },
      ],
    })
    api.get.mockResolvedValue(bet)
    store._state.token = 'tok'
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const payout = el.querySelector('.bet-detail__user-payout')
    expect(payout).not.toBeNull()
    expect(payout.classList.contains('bet-detail__user-payout--win')).toBe(true)
  })

  it('does not show win celebration for losing positions', async () => {
    const bet = createMockBet({
      outcomes: [
        { id: 'out-yes', label: { en: 'Yes' }, pool: 300000, odds: 1.67, is_winner: true },
        { id: 'out-no', label: { en: 'No' }, pool: 200000, odds: 2.5, is_winner: false },
      ],
      user_positions: [
        { outcome_id: 'out-no', amount: 500, payout: 0 },
      ],
    })
    api.get.mockResolvedValue(bet)
    store._state.token = 'tok'
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    const payout = el.querySelector('.bet-detail__user-payout')
    expect(payout).not.toBeNull()
    expect(payout.classList.contains('bet-detail__user-payout--win')).toBe(false)
  })

  // Balance display
  it('shows balance in stake section when authenticated', async () => {
    store._state.token = 'tok'
    store._state.balance = 12300
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()

    const balanceRow = el.querySelector('.bet-detail__balance-row')
    expect(balanceRow).not.toBeNull()
    expect(balanceRow.textContent).toContain('$')
  })

  // Pay with card shows amount
  it('pay with card button shows dollar amount when balance insufficient', async () => {
    store._state.token = 'tok'
    store._state.balance = 100 // $1 balance
    api.get.mockResolvedValue(createMockBet())
    const el = createBetDetail('bet-1')
    mockContainer.container.appendChild(el)
    await flushPromises()

    el.querySelector('.bet-detail__outcome').click()

    // Set stake to $10 (1000 cents) which exceeds $1 balance
    const input = el.querySelector('.bet-detail__stake-input')
    input.value = '10'
    input.dispatchEvent(new Event('input'))

    const cardBtn = el.querySelector('.bet-detail__card-btn')
    expect(cardBtn.hidden).toBe(false)
    expect(cardBtn.textContent).toContain('$10.00')
  })
})
