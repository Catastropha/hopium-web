import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
}))

describe('toast', () => {
  let initToasts, showToast

  beforeEach(async () => {
    vi.useFakeTimers()
    // Clean up any existing toast containers
    document.querySelectorAll('.toast-container').forEach(el => el.remove())
    // Reset module to clear the singleton `container` variable
    vi.resetModules()
    const mod = await import('../components/toast.js')
    initToasts = mod.initToasts
    showToast = mod.showToast
  })

  afterEach(() => {
    vi.useRealTimers()
    document.querySelectorAll('.toast-container').forEach(el => el.remove())
  })

  describe('initToasts', () => {
    it('creates a container element in the body', () => {
      initToasts()
      const container = document.querySelector('.toast-container')
      expect(container).not.toBeNull()
      expect(container.parentNode).toBe(document.body)
    })

    it('sets aria-live on container', () => {
      initToasts()
      const container = document.querySelector('.toast-container')
      expect(container.getAttribute('aria-live')).toBe('polite')
    })

    it('is idempotent — second call returns same container', () => {
      const c1 = initToasts()
      const c2 = initToasts()
      expect(c1).toBe(c2)
      expect(document.querySelectorAll('.toast-container').length).toBe(1)
    })
  })

  describe('showToast', () => {
    it('creates a toast element with the message', () => {
      initToasts()
      showToast({ message: 'Hello', type: 'info' })
      const toast = document.querySelector('.toast')
      expect(toast).not.toBeNull()
      expect(toast.querySelector('.toast__message').textContent).toBe('Hello')
    })

    it('applies type class', () => {
      initToasts()
      showToast({ message: 'Success!', type: 'success' })
      const toast = document.querySelector('.toast--success')
      expect(toast).not.toBeNull()
    })

    it('applies error type class', () => {
      initToasts()
      showToast({ message: 'Error!', type: 'error' })
      expect(document.querySelector('.toast--error')).not.toBeNull()
    })

    it('has a close button', () => {
      initToasts()
      showToast({ message: 'Test', type: 'info' })
      const closeBtn = document.querySelector('.toast__close')
      expect(closeBtn).not.toBeNull()
    })

    it('initializes container if not already done', () => {
      showToast({ message: 'Auto init', type: 'info' })
      expect(document.querySelector('.toast-container')).not.toBeNull()
    })

    it('returns the toast element', () => {
      initToasts()
      const toast = showToast({ message: 'Test', type: 'info' })
      expect(toast).toBeInstanceOf(HTMLElement)
      expect(toast.classList.contains('toast')).toBe(true)
    })
  })
})
