import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockContainer, flushPromises } from './helpers.js'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
  getLang: () => 'en',
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
    on: vi.fn(() => () => {}),
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
  },
}))

vi.mock('../router.js', () => ({
  router: {
    navigate: vi.fn(),
  },
}))

import { notificationsPage } from '../pages/notifications.js'
import { api } from '../api.js'
import { store } from '../store.js'

function makeNotifications(count, unread = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `notif-${i + 1}`,
    type: i % 2 === 0 ? 'milestone' : 'deposit',
    title: `Notification ${i + 1}`,
    body: `Body ${i + 1}`,
    is_read: i >= unread,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  }))
}

describe('notificationsPage', () => {
  let mockContainer

  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  function renderPage() {
    return notificationsPage({
      params: {},
      query: {},
      container: mockContainer.container,
    })
  }

  it('shows login prompt when not authenticated', async () => {
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty--login')).not.toBeNull()
    cleanup()
  })

  it('renders notification list when authenticated', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeNotifications(3, 1), prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page--notifications')).not.toBeNull()
    const items = mockContainer.container.querySelectorAll('.notification')
    expect(items.length).toBe(3)
    cleanup()
  })

  it('shows empty state with no notifications', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: [], prev: null })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.page-empty')).not.toBeNull()
    cleanup()
  })

  it('empty state has CTA link to browse markets', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: [], prev: null })
    const cleanup = await renderPage()
    const link = mockContainer.container.querySelector('.page-empty a[href="/"]')
    expect(link).not.toBeNull()
    cleanup()
  })

  it('shows load more when cursor present', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeNotifications(5), prev: 'cursor-1' })
    const cleanup = await renderPage()
    expect(mockContainer.container.querySelector('.load-more-btn')).not.toBeNull()
    cleanup()
  })

  it('marks unread notifications visually', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeNotifications(3, 2), prev: null })
    const cleanup = await renderPage()
    const unread = mockContainer.container.querySelectorAll('.notification--unread')
    expect(unread.length).toBe(2)
    cleanup()
  })

  it('mark all read button calls API', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeNotifications(3, 2), prev: null })
    api.post.mockResolvedValue(null)
    const cleanup = await renderPage()

    mockContainer.container.querySelector('.notifications-clear-btn').click()
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/v1/notification/read')
    cleanup()
  })

  it('updates store unread count', async () => {
    store._state.token = 'tok'
    api.get.mockResolvedValue({ items: makeNotifications(5, 3), prev: null })
    const cleanup = await renderPage()
    expect(store.set).toHaveBeenCalledWith({ unreadNotifications: 3 })
    cleanup()
  })
})
