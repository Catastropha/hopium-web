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

import { leaderboardPage } from '../pages/leaderboard.js'
import { api } from '../api.js'
import { store } from '../store.js'

function makeEntries(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({
    user_id: `user-${i + 1}`,
    username: `Player${i + 1}`,
    rank: i + 1,
    total_profit: 1000 - i * 100,
    win_rate: 0.65 - i * 0.05,
    current_streak: Math.max(0, 5 - i),
    ...overrides,
  }))
}

describe('leaderboardPage', () => {
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
    return leaderboardPage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel: null,
      ...opts,
    })
  }

  it('renders page with title', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page--leaderboard')).not.toBeNull()
    expect(mockContainer.container.querySelector('.page-title').textContent).toBe('leaderboard')
    cleanup()
  })

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    leaderboardPage({
      params: {},
      query: {},
      container: mockContainer.container,
      detailPanel: null,
    })
    expect(mockContainer.container.querySelector('.podium--skeleton')).not.toBeNull()
  })

  it('renders podium for top 3', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.podium')).not.toBeNull()
    const podiumItems = mockContainer.container.querySelectorAll('.podium__item')
    expect(podiumItems.length).toBe(3)
    cleanup()
  })

  it('renders podium in 2nd-1st-3rd order', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    const items = mockContainer.container.querySelectorAll('.podium__item')
    expect(items[0].classList.contains('podium__item--second')).toBe(true)
    expect(items[1].classList.contains('podium__item--first')).toBe(true)
    expect(items[2].classList.contains('podium__item--third')).toBe(true)
    cleanup()
  })

  it('renders leaderboard table for entries beyond top 3', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.leaderboard-table')).not.toBeNull()
    const rows = mockContainer.container.querySelectorAll('.leaderboard-row')
    expect(rows.length).toBe(2) // entries 4 and 5
    cleanup()
  })

  it('skips podium when fewer than 3 entries', async () => {
    api.get.mockResolvedValue({ items: makeEntries(2), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.podium')).toBeNull()
    // Should still render as table
    const rows = mockContainer.container.querySelectorAll('.leaderboard-row')
    expect(rows.length).toBe(2)
    cleanup()
  })

  it('shows empty state when no entries', async () => {
    api.get.mockResolvedValue({ items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('renders time window tabs', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage()
    const tabs = mockContainer.container.querySelectorAll('[data-time-window]')
    expect(tabs.length).toBe(3)
    cleanup()
  })

  it('defaults to "all" time window tab', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage()
    const allTab = mockContainer.container.querySelector('[data-time-window="all"]')
    expect(allTab.getAttribute('aria-selected')).toBe('true')
    cleanup()
  })

  it('clicking time window tab refetches data', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    vi.clearAllMocks()

    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const tab7d = mockContainer.container.querySelector('[data-time-window="7d"]')
    tab7d.click()

    expect(api.get).toHaveBeenCalledWith('/v1/leaderboard/', expect.objectContaining({ time_window: '7d' }))
    cleanup()
  })

  it('renders category filter chips', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage()
    const chips = mockContainer.container.querySelectorAll('.filter-chip')
    // "All" + 5 categories
    expect(chips.length).toBe(6)
    cleanup()
  })

  it('clicking category chip refetches data', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    vi.clearAllMocks()

    api.get.mockResolvedValue({ items: makeEntries(2), prev: null })
    const cryptoChip = mockContainer.container.querySelector('.filter-chip[data-category="Crypto"]')
    cryptoChip.click()

    expect(api.get).toHaveBeenCalledWith('/v1/leaderboard/', expect.objectContaining({ category: 'Crypto' }))
    cleanup()
  })

  it('shows load more when cursor present', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: 'cursor-next' })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).not.toBeNull()
    cleanup()
  })

  it('hides load more when no cursor', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).toBeNull()
    cleanup()
  })

  it('shows error state with retry button on failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'))
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    expect(mockContainer.container.querySelector('.leaderboard-retry-btn')).not.toBeNull()
    cleanup()
  })

  it('retry button refetches leaderboard', async () => {
    api.get.mockRejectedValue(new Error('fail'))
    const cleanup = await renderPage()
    vi.clearAllMocks()

    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const retryBtn = mockContainer.container.querySelector('.leaderboard-retry-btn')
    retryBtn.click()

    expect(api.get).toHaveBeenCalledWith('/v1/leaderboard/', expect.objectContaining({ time_window: 'all' }))
    cleanup()
  })

  it('highlights current user row', async () => {
    store._state.userId = 'user-5'
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.leaderboard-row--highlight')).not.toBeNull()
    cleanup()
  })

  it('table shows win rate and streak columns', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    const headers = mockContainer.container.querySelectorAll('.leaderboard-th')
    const headerTexts = [...headers].map(h => h.textContent)
    expect(headerTexts).toContain('winRate')
    expect(headerTexts).toContain('streak')
    cleanup()
  })

  it('uses query params for initial time_window', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage({ query: { time_window: '30d' } })
    expect(api.get).toHaveBeenCalledWith('/v1/leaderboard/', expect.objectContaining({ time_window: '30d' }))
    cleanup()
  })

  it('uses query params for initial category', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage({ query: { category: 'Sports' } })
    expect(api.get).toHaveBeenCalledWith('/v1/leaderboard/', expect.objectContaining({ category: 'Sports' }))
    cleanup()
  })

  it('cleanup removes event listeners without error', async () => {
    api.get.mockResolvedValue({ items: makeEntries(3), prev: null })
    const cleanup = await renderPage()
    expect(() => cleanup()).not.toThrow()
  })

  it('podium shows usernames and initials', async () => {
    api.get.mockResolvedValue({ items: makeEntries(5), prev: null })
    const cleanup = await renderPage()
    const names = mockContainer.container.querySelectorAll('.podium__name')
    expect(names.length).toBe(3)
    expect(names[0].textContent).toBe('Player2') // 2nd place shown first
    const avatars = mockContainer.container.querySelectorAll('.podium__avatar')
    expect(avatars[0].textContent).toBe('P')
    cleanup()
  })
})
