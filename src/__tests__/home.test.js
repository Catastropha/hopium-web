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
  CATEGORY_COLORS: { Crypto: '#F59E0B', Sports: '#22C55E' },
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

import { homePage } from '../pages/home.js'
import { api } from '../api.js'
import { store } from '../store.js'

function makeBets(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockBet({ id: `bet-${i + 1}`, title: { en: `Bet ${i + 1}` }, ...overrides })
  )
}

describe('homePage', () => {
  let mockContainer
  let detailPanel

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
    detailPanel = createMockDetailPanel()
    // Default: successful bet fetch with results
    api.get.mockResolvedValue({ items: makeBets(3), prev: null })
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  function renderPage(opts = {}) {
    return homePage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel,
      ...opts,
    })
  }

  it('renders page shell with bet-list', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page--home')).not.toBeNull()
    expect(mockContainer.container.querySelector('.bet-list')).not.toBeNull()
    cleanup()
  })

  it('shows skeleton cards before data loads', () => {
    api.get.mockReturnValue(new Promise(() => {})) // never resolves
    homePage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel,
    })
    const skeletons = mockContainer.container.querySelectorAll('.bet-card--skeleton')
    expect(skeletons.length).toBe(4)
  })

  it('renders bet cards after fetch', async () => {
    const cleanup = await renderPage()
    const cards = mockContainer.container.querySelectorAll('.bet-card[data-bet-id]')
    expect(cards.length).toBe(3)
    cleanup()
  })

  it('renders hero section when not authenticated', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.home-hero')).not.toBeNull()
    cleanup()
  })

  it('hides hero section when authenticated', async () => {
    store._state.token = 'tok'
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.home-hero')).toBeNull()
    cleanup()
  })

  it('renders filter bar with category chips', async () => {
    const cleanup = await renderPage()
    const chips = mockContainer.container.querySelectorAll('.filter-chip')
    // "All" + 5 categories
    expect(chips.length).toBe(6)
    cleanup()
  })

  it('shows "All" chip as active by default', async () => {
    const cleanup = await renderPage()
    const allChip = mockContainer.container.querySelector('.filter-chip--active')
    expect(allChip).not.toBeNull()
    expect(allChip.textContent.trim()).toBe('all')
    cleanup()
  })

  it('shows empty state when no bets returned', async () => {
    api.get.mockResolvedValue({ items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('shows load more button when cursor is present', async () => {
    api.get.mockResolvedValue({ items: makeBets(3), prev: 'cursor-123' })
    const cleanup = await renderPage()
    const btn = mockContainer.container.querySelector('.load-more-btn')
    expect(btn).not.toBeNull()
    cleanup()
  })

  it('hides load more button when no cursor', async () => {
    api.get.mockResolvedValue({ items: makeBets(3), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).toBeNull()
    cleanup()
  })

  it('auto-selects first bet when none selected', async () => {
    const cleanup = await renderPage()
    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-1' })
    expect(detailPanel.open).toHaveBeenCalled()
    cleanup()
  })

  it('clicking a bet card selects it', async () => {
    const cleanup = await renderPage()
    vi.clearAllMocks()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card.click()

    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-2' })
    cleanup()
  })

  it('opens detail panel on bet selection', async () => {
    const cleanup = await renderPage()
    vi.clearAllMocks()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card.click()

    expect(detailPanel.open).toHaveBeenCalled()
    cleanup()
  })

  it('applies selected class to chosen bet card', async () => {
    const cleanup = await renderPage()

    const card2 = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card2.click()

    expect(card2.classList.contains('bet-card--selected')).toBe(true)
    cleanup()
  })

  it('fetches with category filter from query', async () => {
    const cleanup = await renderPage({ query: { category: 'Crypto' } })
    expect(api.get).toHaveBeenCalledWith('/v1/bet/', expect.objectContaining({ category: 'Crypto' }))
    cleanup()
  })

  it('fetches with country_code filter from query', async () => {
    const cleanup = await renderPage({ query: { country_code: 'US' } })
    expect(api.get).toHaveBeenCalledWith('/v1/bet/', expect.objectContaining({ country_code: 'US' }))
    cleanup()
  })

  it('shows error state on API failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'))
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('Enter key on bet card selects it', async () => {
    const cleanup = await renderPage()
    vi.clearAllMocks()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-2' })
    cleanup()
  })

  it('Space key on bet card selects it', async () => {
    const cleanup = await renderPage()
    vi.clearAllMocks()

    const card = mockContainer.container.querySelector('.bet-card[data-bet-id="bet-2"]')
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

    expect(store.set).toHaveBeenCalledWith({ selectedBetId: 'bet-2' })
    cleanup()
  })

  it('renders bet card with position badge when user has position', async () => {
    api.get.mockResolvedValue({
      items: [createMockBet({ id: 'bet-pos', user_position_total: 500 })],
      prev: null,
    })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.bet-card__position')).not.toBeNull()
    cleanup()
  })

  it('does not render position badge when user has no position', async () => {
    api.get.mockResolvedValue({
      items: [createMockBet({ id: 'bet-nopos', user_position_total: 0 })],
      prev: null,
    })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.bet-card__position')).toBeNull()
    cleanup()
  })

  it('cleanup removes event listeners without error', async () => {
    const cleanup = await renderPage()
    expect(() => cleanup()).not.toThrow()
  })

  it('fetches countries when not cached', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/v1/country/') return Promise.resolve({ items: [{ code: 'US', name: { en: 'USA' }, flag_emoji: '🇺🇸' }] })
      return Promise.resolve({ items: makeBets(2), prev: null })
    })
    const cleanup = await renderPage()
    await flushPromises()
    expect(api.get).toHaveBeenCalledWith('/v1/country/')
    cleanup()
  })

  it('renders country dropdown', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.filter-bar__country-btn')).not.toBeNull()
    expect(mockContainer.container.querySelector('.filter-bar__dropdown')).not.toBeNull()
    cleanup()
  })

  it('country dropdown is hidden by default', async () => {
    const cleanup = await renderPage()
    const dropdown = mockContainer.container.querySelector('.filter-bar__dropdown')
    expect(dropdown.hidden).toBe(true)
    cleanup()
  })

  it('clicking country button toggles dropdown', async () => {
    const cleanup = await renderPage()
    const btn = mockContainer.container.querySelector('.filter-bar__country-btn')
    btn.click()
    const dropdown = mockContainer.container.querySelector('.filter-bar__dropdown')
    expect(dropdown.hidden).toBe(false)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    cleanup()
  })
})
