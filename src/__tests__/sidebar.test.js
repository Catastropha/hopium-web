import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
  getLang: () => 'en',
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

import { createSidebar } from '../components/sidebar.js'
import { store } from '../store.js'

describe('sidebar', () => {
  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    // Reset location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '', href: 'http://localhost/' },
      writable: true,
      configurable: true,
    })
  })

  it('creates a nav element', () => {
    const el = createSidebar()
    expect(el.tagName).toBe('NAV')
    expect(el.getAttribute('role')).toBe('navigation')
  })

  it('renders 5 nav items', () => {
    const el = createSidebar()
    const items = el.querySelectorAll('.sidebar__item')
    expect(items.length).toBe(5)
  })

  it('sets home as active by default on / path', () => {
    const el = createSidebar()
    const items = el.querySelectorAll('.sidebar__item')
    expect(items[0].classList.contains('sidebar__item--active')).toBe(true)
    expect(items[1].classList.contains('sidebar__item--active')).toBe(false)
  })

  it('shows login button when not authenticated', () => {
    const el = createSidebar()
    expect(el.querySelector('.sidebar__login')).not.toBeNull()
    expect(el.querySelector('.sidebar__avatar')).toBeNull()
  })

  it('shows avatar when authenticated', () => {
    store._state.token = 'tok'
    store._state.username = 'Alice'
    const el = createSidebar()
    expect(el.querySelector('.sidebar__avatar')).not.toBeNull()
    expect(el.querySelector('.sidebar__avatar').textContent).toBe('A')
  })

  it('shows balance when authenticated with balance', () => {
    store._state.token = 'tok'
    store._state.username = 'Bob'
    store._state.balance = 1500
    const el = createSidebar()
    const balance = el.querySelector('.sidebar__balance')
    expect(balance).not.toBeNull()
    expect(balance.textContent).toContain('$')
  })

  it('renders logo image', () => {
    const el = createSidebar()
    const logo = el.querySelector('.sidebar__logo-img')
    expect(logo).not.toBeNull()
    expect(logo.getAttribute('src')).toBe('/logo-letter.svg')
  })

  it('nav items have data-link attribute for router', () => {
    const el = createSidebar()
    const items = el.querySelectorAll('.sidebar__item')
    items.forEach(item => {
      expect(item.hasAttribute('data-link')).toBe(true)
    })
  })

  it('nav items have correct hrefs', () => {
    const el = createSidebar()
    const items = el.querySelectorAll('.sidebar__item')
    expect(items[0].getAttribute('href')).toBe('/')
    expect(items[1].getAttribute('href')).toBe('/my-bets')
    expect(items[2].getAttribute('href')).toBe('/leaders')
    expect(items[3].getAttribute('href')).toBe('/notifications')
    expect(items[4].getAttribute('href')).toBe('/profile')
  })
})
