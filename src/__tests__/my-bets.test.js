import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockBet, createMockContainer, createMockDetailPanel, flushPromises } from './helpers.js'

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
  MIN_BET: 10,
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

vi.mock('../router.js', () => ({
  router: { navigate: vi.fn() },
}))

vi.mock('../components/odds-bar.js', () => ({
  createOddsBar: vi.fn(() => {
    const el = document.createElement('div')
    el.className = 'odds-bar'
    return el
  }),
}))

vi.mock('../components/bet-detail.js', () => ({
  createBetDetail: vi.fn((id) => {
    const el = document.createElement('div')
    el.className = 'bet-detail'
    el.dataset.betId = id
    return el
  }),
}))

import { myBetsPage } from '../pages/my-bets.js'
import { api } from '../api.js'
import { store } from '../store.js'

function makeUserBets(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockBet({
      id: `bet-${i + 1}`,
      title: { en: `User Bet ${i + 1}` },
      user_position_total: 100,
      ...overrides,
    })
  )
}

describe('myBetsPage', () => {
  let mockContainer
  let detailPanel

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
    detailPanel = createMockDetailPanel()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  function renderPage(opts = {}) {
    return myBetsPage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel,
      ...opts,
    })
  }

  it('shows login prompt when not authenticated', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty--login')).not.toBeNull()
    expect(mockContainer.container.querySelector('.page--my-bets')).toBeNull()
    cleanup()
  })

  it('shows login prompt with link to /login', async () => {
    const cleanup = await renderPage()
    const link = mockContainer.container.querySelector('a[href*="/login"]')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toContain('redirect=/my-bets')
    cleanup()
  })

  it('renders page shell when authenticated', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page--my-bets')).not.toBeNull()
    cleanup()
  })

  it('shows skeleton cards while loading', () => {
    store._state.token = 'tok'
    api.get.mockReturnValue(new Promise(() => {}))
    myBetsPage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel,
    })
    const skeletons = mockContainer.container.querySelectorAll('.bet-card--skeleton')
    expect(skeletons.length).toBe(3)
  })

  it('renders P&L card after fetch', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.pnl-card')).not.toBeNull()
    cleanup()
  })

  it('renders P&L breakdown with staked, returned, pending', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()
    const items = mockContainer.container.querySelectorAll('.pnl-card__item')
    expect(items.length).toBe(3)
    cleanup()
  })

  it('renders segmented control with Active and Resolved tabs', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()
    const tabs = mockContainer.container.querySelectorAll('[data-tab]')
    expect(tabs.length).toBe(2)
    expect(tabs[0].dataset.tab).toBe('active')
    expect(tabs[1].dataset.tab).toBe('resolved')
    cleanup()
  })

  it('defaults to active tab', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()
    const activeTab = mockContainer.container.querySelector('[data-tab="active"]')
    expect(activeTab.getAttribute('aria-selected')).toBe('true')
    cleanup()
  })

  it('renders bet cards for active bets', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(3), prev: null })
    const cleanup = await renderPage()
    const cards = mockContainer.container.querySelectorAll('.bet-card[data-bet-id]')
    expect(cards.length).toBe(3)
    cleanup()
  })

  it('switching to resolved tab shows resolved bets', async () => {
    store._state.token = 'tok'
    const bets = [
      ...makeUserBets(2, { status: 'active' }),
      ...makeUserBets(1, { id: 'resolved-1', status: 'resolved' }),
    ]
    api.get.mockResolvedValue({ items: bets, prev: null })
    const cleanup = await renderPage()

    // Click resolved tab
    const resolvedTab = mockContainer.container.querySelector('[data-tab="resolved"]')
    resolvedTab.click()

    const cards = mockContainer.container.querySelectorAll('.bet-card[data-bet-id]')
    expect(cards.length).toBe(1)
    cleanup()
  })

  it('shows empty state when no bets with positions', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: [createMockBet({ user_position_total: 0 })], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('empty state has link to home', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: [], prev: null })
    const cleanup = await renderPage()
    const link = mockContainer.container.querySelector('a[href="/"]')
    expect(link).not.toBeNull()
    cleanup()
  })

  it('shows load more button when cursor present', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(3), prev: 'cursor-abc' })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).not.toBeNull()
    cleanup()
  })

  it('hides load more button when no cursor', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(3), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).toBeNull()
    cleanup()
  })

  it('clicking a bet card opens detail panel', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-1"]')
    card.click()

    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-1' })
    expect(detailPanel.open).toHaveBeenCalled()
    cleanup()
  })

  it('Enter key on bet card selects it', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(2), prev: null })
    const cleanup = await renderPage()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-2' })
    cleanup()
  })

  it('shows error state on API failure', async () => {
    store._state.token = 'tok'
    api.get.mockRejectedValue(new Error('fail'))
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('tab counts reflect active vs resolved', async () => {
    store._state.token = 'tok'
    const bets = [
      ...makeUserBets(2, { status: 'active' }),
      createMockBet({ id: 'r1', status: 'resolved', user_position_total: 50 }),
    ]
    api.get.mockResolvedValue({ items: bets, prev: null })
    const cleanup = await renderPage()

    const activeTab = mockContainer.container.querySelector('[data-tab="active"]')
    const resolvedTab = mockContainer.container.querySelector('[data-tab="resolved"]')
    expect(activeTab.textContent).toContain('2')
    expect(resolvedTab.textContent).toContain('1')
    cleanup()
  })

  it('cleanup removes event listeners without error', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeUserBets(1), prev: null })
    const cleanup = await renderPage()
    expect(() => cleanup()).not.toThrow()
  })

  it('filters out bets with no user position', async () => {
    store._state.token = 'tok'
    const bets = [
      createMockBet({ id: 'has-pos', user_position_total: 200 }),
      createMockBet({ id: 'no-pos', user_position_total: 0 }),
      createMockBet({ id: 'null-pos', user_position_total: null }),
    ]
    api.get.mockResolvedValue({ items: bets, prev: null })
    const cleanup = await renderPage()

    const cards = mockContainer.container.querySelectorAll('.bet-card[data-bet-id]')
    expect(cards.length).toBe(1)
    expect(cards[0].dataset.betId).toBe('has-pos')
    cleanup()
  })
})
