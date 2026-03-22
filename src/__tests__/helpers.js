import { vi } from 'vitest'

/**
 * Create a mock bet object.
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function createMockBet(overrides = {}) {
  return {
    id: 'bet-1',
    title: { en: 'Will BTC hit 100k?' },
    description: { en: 'Bitcoin price prediction' },
    resolution_criteria: { en: 'Based on CoinGecko price' },
    category: 'Crypto',
    image_url: null,
    resolution_date: new Date(Date.now() + 86400000).toISOString(),
    total_pool: 5000,
    status: 'active',
    outcomes: [
      { id: 'out-yes', label: { en: 'Yes' }, pool: 3000, odds: 1.67, is_winner: false },
      { id: 'out-no', label: { en: 'No' }, pool: 2000, odds: 2.5, is_winner: false },
    ],
    user_positions: [],
    user_position_total: 0,
    ...overrides,
  }
}

/**
 * Create a mock container element attached to document.body.
 * Returns the container and a cleanup function.
 */
export function createMockContainer() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return {
    container,
    cleanup: () => container.remove(),
  }
}

/**
 * Flush pending microtasks/promises.
 */
export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create a mock detail panel API matching what main.js provides.
 */
export function createMockDetailPanel() {
  const el = document.createElement('div')
  return {
    open: vi.fn((content) => {
      el.innerHTML = ''
      if (typeof content === 'string') el.innerHTML = content
      else if (content instanceof Node) el.appendChild(content)
    }),
    close: vi.fn(),
    isOpen: vi.fn(() => false),
    el,
  }
}
