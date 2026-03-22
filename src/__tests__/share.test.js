import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockContainer, flushPromises } from './helpers.js'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
  localize: (dict) => dict?.en || '',
}))

vi.mock('../utils/dom.js', async () => {
  const actual = await vi.importActual('../utils/dom.js')
  return actual
})

vi.mock('../utils/format.js', () => ({
  formatStars: (n) => `⭐ ${n}`,
  formatDate: (d) => 'Mar 10, 2026',
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
  router: {
    navigate: vi.fn(),
  },
}))

import { sharePage } from '../pages/share.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'

describe('share page', () => {
  let mockContainer

  beforeEach(() => {
    vi.clearAllMocks()
    mockContainer = createMockContainer()
  })

  afterEach(() => {
    mockContainer.cleanup()
  })

  it('redirects to bet page for bet type shares', async () => {
    api.get.mockResolvedValue({
      type: 'bet',
      reference_id: 'bet-123',
      created_at: '2026-03-10T00:00:00Z',
      click_count: 5,
    })

    await sharePage({
      params: { id: 'share-1' },
      query: {},
      container: mockContainer.container,
    })

    expect(router.navigate).toHaveBeenCalledWith('/bet/bet-123')
  })

  it('renders win card for win type shares', async () => {
    api.get.mockResolvedValue({
      type: 'win',
      reference_id: 'bet-456',
      created_at: '2026-03-10T00:00:00Z',
      click_count: 10,
    })

    await sharePage({
      params: { id: 'share-2' },
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.querySelector('.share-card--win')).not.toBeNull()
  })

  it('renders streak card for streak type shares', async () => {
    api.get.mockResolvedValue({
      type: 'streak',
      reference_id: 'user-789',
      created_at: '2026-03-10T00:00:00Z',
      click_count: 3,
    })

    await sharePage({
      params: { id: 'share-3' },
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.querySelector('.share-card--streak')).not.toBeNull()
  })

  it('renders generic card for unknown share types', async () => {
    api.get.mockResolvedValue({
      type: 'unknown',
      reference_id: 'x',
      created_at: '2026-03-10T00:00:00Z',
      click_count: 0,
    })

    await sharePage({
      params: { id: 'share-4' },
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.querySelector('.share-card')).not.toBeNull()
  })

  it('shows not found for 404 errors', async () => {
    api.get.mockRejectedValue(new ApiError(404, 'not-found', 'Not found'))

    await sharePage({
      params: { id: 'share-missing' },
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.textContent).toContain('linkNotFound')
  })

  it('shows error message for other errors', async () => {
    api.get.mockRejectedValue(new ApiError(500, 'server-error', 'Server error'))

    await sharePage({
      params: { id: 'share-err' },
      query: {},
      container: mockContainer.container,
    })

    expect(mockContainer.container.textContent).toContain('error')
  })

  it('returns cleanup function', async () => {
    api.get.mockResolvedValue({
      type: 'win',
      reference_id: 'bet-1',
      created_at: '2026-03-10T00:00:00Z',
      click_count: 0,
    })

    const cleanup = await sharePage({
      params: { id: 'share-5' },
      query: {},
      container: mockContainer.container,
    })

    expect(typeof cleanup).toBe('function')
  })
})
