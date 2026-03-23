import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
}))

vi.mock('../store.js', () => {
  const _state = {}
  const store = {
    _state,
    get: vi.fn((key) => store._state[key] ?? null),
    set: vi.fn((updates) => Object.assign(store._state, updates)),
    get isAuthenticated() {
      return !!store._state.token
    },
  }
  return { store }
})

vi.mock('../router.js', () => ({
  router: {
    navigate: vi.fn(),
  },
}))

import { initKeyboardShortcuts, showShortcutsOverlay } from '../components/keyboard-shortcuts.js'
import { store } from '../store.js'
import { router } from '../router.js'

// initKeyboardShortcuts registers a global listener once — call it at test suite level
let initialized = false

describe('keyboard-shortcuts', () => {
  beforeEach(() => {
    for (const key of Object.keys(store._state)) delete store._state[key]
    vi.clearAllMocks()
    document.querySelectorAll('.shortcuts-overlay').forEach(el => el.remove())
    if (!initialized) {
      initKeyboardShortcuts()
      initialized = true
    }
  })

  afterEach(() => {
    // Close any open overlay
    document.querySelectorAll('.shortcuts-overlay').forEach(el => el.remove())
  })

  function press(key, opts = {}) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
  }

  it('ignores shortcuts with modifier keys', () => {
    press('1', { ctrlKey: true })
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('number keys navigate to routes', () => {
    press('1')
    expect(router.navigate).toHaveBeenCalledWith('/')

    press('2')
    expect(router.navigate).toHaveBeenCalledWith('/my-bets')

    press('3')
    expect(router.navigate).toHaveBeenCalledWith('/leaders')

    press('4')
    expect(router.navigate).toHaveBeenCalledWith('/profile')
  })

  it('? key shows shortcuts overlay', () => {
    press('?')
    const overlay = document.querySelector('.shortcuts-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay.getAttribute('role')).toBe('dialog')
    expect(overlay.getAttribute('aria-modal')).toBe('true')
    // Clean up — press Escape via the handler
    press('Escape')
  })

  it('Escape closes shortcuts overlay', () => {
    press('?')
    expect(document.querySelector('.shortcuts-overlay')).not.toBeNull()
    press('Escape')
    expect(document.querySelector('.shortcuts-overlay')).toBeNull()
  })

  it('Escape dispatches detail-close when no overlay open', () => {
    const handler = vi.fn()
    window.addEventListener('hopium:detail-close', handler)
    press('Escape')
    expect(handler).toHaveBeenCalled()
    window.removeEventListener('hopium:detail-close', handler)
  })

  it('showShortcutsOverlay renders all shortcut rows', () => {
    showShortcutsOverlay()
    const rows = document.querySelectorAll('.shortcuts__row')
    expect(rows.length).toBe(12)
    // Clean up
    press('Escape')
  })

  it('showShortcutsOverlay close button works', () => {
    showShortcutsOverlay()
    const closeBtn = document.querySelector('.shortcuts-overlay__close')
    expect(closeBtn).not.toBeNull()
    closeBtn.click()
    expect(document.querySelector('.shortcuts-overlay')).toBeNull()
  })

  it('showShortcutsOverlay backdrop click closes', () => {
    showShortcutsOverlay()
    document.querySelector('.shortcuts-overlay__backdrop').click()
    expect(document.querySelector('.shortcuts-overlay')).toBeNull()
  })

  it('restores focus to previous element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    showShortcutsOverlay()
    document.querySelector('.shortcuts-overlay__close').click()

    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
