import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock i18n to return 'en' consistently
vi.mock('../i18n.js', () => ({
  getLang: () => 'en',
}))

import {
  formatNumber,
  formatCompact,
  formatTon,
  formatTonCompact,
  formatOdds,
  formatPercent,
  formatTimeRemaining,
  formatDate,
  formatSignedTon,
  formatPoolCompact,
} from '../utils/format.js'

describe('formatNumber', () => {
  it('formats integers with commas', () => {
    expect(formatNumber(15000)).toBe('15,000')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('truncates decimals', () => {
    expect(formatNumber(1234.567)).toBe('1,235')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-5000)).toBe('-5,000')
  })
})

describe('formatCompact', () => {
  it('formats thousands as K', () => {
    expect(formatCompact(15000)).toBe('15K')
  })

  it('includes one decimal when needed', () => {
    expect(formatCompact(1500)).toBe('1.5K')
  })

  it('formats millions as M', () => {
    expect(formatCompact(2000000)).toBe('2M')
  })

  it('passes through small numbers', () => {
    expect(formatCompact(500)).toBe('500')
  })
})

describe('formatTon', () => {
  it('formats nanotons as TON', () => {
    expect(formatTon(1_500_000_000)).toBe('1.50 TON')
  })

  it('formats zero', () => {
    expect(formatTon(0)).toBe('0.00 TON')
  })

  it('formats 1 TON', () => {
    expect(formatTon(1_000_000_000)).toBe('1.00 TON')
  })

  it('formats fractional TON', () => {
    expect(formatTon(1_990_000_000)).toBe('1.99 TON')
  })
})

describe('formatTonCompact', () => {
  it('formats large amounts compactly', () => {
    const result = formatTonCompact(15_000_000_000_000)
    expect(result).toContain('TON')
    expect(result).toContain('15K')
  })

  it('formats small amounts', () => {
    const result = formatTonCompact(5_000_000_000)
    expect(result).toContain('TON')
    expect(result).toContain('5')
  })
})

describe('formatOdds', () => {
  it('formats with 2 decimal places for odds < 10', () => {
    expect(formatOdds(2.5)).toBe('2.50x')
    expect(formatOdds(1.2)).toBe('1.20x')
  })

  it('formats with 1 decimal place for odds >= 10', () => {
    expect(formatOdds(10)).toBe('10.0x')
    expect(formatOdds(25.67)).toBe('25.7x')
  })
})

describe('formatPercent', () => {
  it('converts decimal to percentage', () => {
    expect(formatPercent(0.65)).toBe('65%')
  })

  it('passes through values > 1 as-is', () => {
    expect(formatPercent(65)).toBe('65%')
  })

  it('rounds to nearest integer', () => {
    expect(formatPercent(0.666)).toBe('67%')
  })

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0%')
  })

  it('handles 100%', () => {
    expect(formatPercent(1)).toBe('100%')
  })
})

describe('formatTimeRemaining', () => {
  it('returns "Ended" for past dates', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(formatTimeRemaining(past)).toBe('Ended')
  })

  it('shows days and hours for multi-day durations', () => {
    const future = new Date(Date.now() + 2.5 * 24 * 3600_000).toISOString()
    const result = formatTimeRemaining(future)
    expect(result).toMatch(/^2d \d+h$/)
  })

  it('shows hours for sub-day durations', () => {
    const future = new Date(Date.now() + 5 * 3600_000).toISOString()
    expect(formatTimeRemaining(future)).toBe('5h')
  })

  it('shows minutes for sub-hour durations', () => {
    const future = new Date(Date.now() + 30 * 60_000).toISOString()
    const result = formatTimeRemaining(future)
    expect(result).toMatch(/^\d+m$/)
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-03-10T00:00:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('10')
    expect(result).toContain('2026')
  })
})

describe('formatSignedTon', () => {
  it('adds + for positive amounts', () => {
    const result = formatSignedTon(1_000_000_000)
    expect(result).toBe('+1.00 TON')
  })

  it('shows negative amounts', () => {
    const result = formatSignedTon(-50_000_000_000)
    expect(result).toBe('-50.00 TON')
  })

  it('adds + for zero', () => {
    expect(formatSignedTon(0)).toBe('+0.00 TON')
  })
})

describe('formatPoolCompact', () => {
  it('formats small pools as rounded TON', () => {
    expect(formatPoolCompact(5_000_000_000)).toBe('5 TON')
  })

  it('formats zero', () => {
    expect(formatPoolCompact(0)).toBe('0.00 TON')
  })

  it('formats thousands with one decimal', () => {
    expect(formatPoolCompact(1_500_000_000_000)).toBe('1.5K TON')
  })

  it('formats large pools as integer K', () => {
    expect(formatPoolCompact(15_000_000_000_000)).toBe('15K TON')
  })

  it('formats fractional TON', () => {
    expect(formatPoolCompact(500_000_000)).toBe('0.50 TON')
  })
})
