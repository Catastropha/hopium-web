import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock i18n before importing router
vi.mock('../i18n.js', () => ({
  t: (key) => key,
  getLang: () => 'en',
}))

// Test the pathToRegex and matchRoute logic by importing the router
// and exercising its add + resolve behavior
import { router } from '../router.js'

// Helper: set window.location.pathname for testing
function setPath(pathname, search = '') {
  Object.defineProperty(window, 'location', {
    value: { pathname, search, href: `http://localhost${pathname}${search}` },
    writable: true,
    configurable: true,
  })
}

describe('router', () => {
  beforeEach(() => {
    // Reset location
    setPath('/')
  })

  describe('route matching', () => {
    it('matches exact paths', async () => {
      const handler = vi.fn()
      router.add('/test-exact', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/test-exact')
      await router.resolve()

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ params: {}, query: {} })
      )
    })

    it('extracts path parameters', async () => {
      const handler = vi.fn()
      router.add('/bet/:id', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/bet/abc123')
      await router.resolve()

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ params: { id: 'abc123' } })
      )
    })

    it('extracts multiple path parameters', async () => {
      const handler = vi.fn()
      router.add('/multi/:a/:b', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/multi/foo/bar')
      await router.resolve()

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ params: { a: 'foo', b: 'bar' } })
      )
    })

    it('parses query parameters', async () => {
      const handler = vi.fn()
      router.add('/with-query', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/with-query', '?category=Sports&page=2')
      await router.resolve()

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { category: 'Sports', page: '2' },
        })
      )
    })

    it('renders 404 for unmatched routes', async () => {
      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/nonexistent-route-xyz')
      await router.resolve()

      expect(container.innerHTML).toContain('notFound')
    })
  })

  describe('cleanup', () => {
    it('calls cleanup from previous route handler', async () => {
      const cleanup = vi.fn()
      const handler1 = vi.fn(() => cleanup)
      const handler2 = vi.fn()

      router.add('/cleanup-a', handler1)
      router.add('/cleanup-b', handler2)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/cleanup-a')
      await router.resolve()
      expect(cleanup).not.toHaveBeenCalled()

      setPath('/cleanup-b')
      await router.resolve()
      expect(cleanup).toHaveBeenCalledTimes(1)
    })
  })

  describe('navigate', () => {
    it('pushes state and resolves', async () => {
      const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
      const handler = vi.fn()
      router.add('/nav-target', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/nav-target')
      router.navigate('/nav-target')

      expect(pushState).toHaveBeenCalledWith(null, '', '/nav-target')
      pushState.mockRestore()
    })
  })

  describe('handler returning Node', () => {
    it('appends DOM node to container', async () => {
      const node = document.createElement('section')
      node.textContent = 'Hello from node'
      const handler = vi.fn(() => node)
      router.add('/returns-node', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/returns-node')
      await router.resolve()

      expect(container.children.length).toBe(1)
      expect(container.textContent).toBe('Hello from node')
    })
  })

  describe('start', () => {
    it('listens for popstate events', async () => {
      const handler = vi.fn()
      router.add('/pop-test', handler)

      const container = document.createElement('div')
      router.setContainer(container)

      setPath('/pop-test')
      router.start()

      // Simulate popstate
      handler.mockClear()
      window.dispatchEvent(new Event('popstate'))

      // Give the async resolve a tick
      await new Promise((r) => setTimeout(r, 0))
      expect(handler).toHaveBeenCalled()
    })

    it('intercepts clicks on data-link anchors', async () => {
      const handler = vi.fn()
      router.add('/link-click', handler)

      const container = document.createElement('div')
      router.setContainer(container)
      document.body.appendChild(container)

      const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})

      router.start()

      // Create a data-link anchor and dispatch a click event (not link.click() which triggers jsdom navigation)
      const link = document.createElement('a')
      link.setAttribute('data-link', '')
      link.setAttribute('href', '/link-click')
      document.body.appendChild(link)

      setPath('/somewhere-else')
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)

      expect(pushState).toHaveBeenCalledWith(null, '', '/link-click')

      pushState.mockRestore()
      link.remove()
      container.remove()
    })

    it('ignores clicks on regular anchors without data-link', async () => {
      const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})

      const container = document.createElement('div')
      router.setContainer(container)
      document.body.appendChild(container)

      router.start()

      const link = document.createElement('a')
      link.setAttribute('href', '/no-intercept')
      document.body.appendChild(link)

      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)

      expect(pushState).not.toHaveBeenCalledWith(null, '', '/no-intercept')

      pushState.mockRestore()
      link.remove()
      container.remove()
    })
  })

  describe('resolve without container', () => {
    it('does nothing when container is not set', async () => {
      router.setContainer(null)
      setPath('/no-container')
      // Should not throw
      await router.resolve()
    })
  })
})
