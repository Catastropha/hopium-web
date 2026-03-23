import { describe, it, expect } from 'vitest'
import { CATEGORIES, MIN_BET, MIN_DEPOSIT, MIN_WITHDRAWAL, PLATFORM_FEE, TMA_URL } from '../constants.js'

describe('constants', () => {
  it('has all expected categories', () => {
    expect(CATEGORIES).toEqual(['Sports', 'Politics', 'Crypto', 'Culture', 'Tech'])
  })

  it('MIN_BET is 100 cents ($1.00)', () => {
    expect(MIN_BET).toBe(100)
  })

  it('MIN_DEPOSIT is 100 cents ($1.00)', () => {
    expect(MIN_DEPOSIT).toBe(100)
  })

  it('MIN_WITHDRAWAL is 1000 cents ($10.00)', () => {
    expect(MIN_WITHDRAWAL).toBe(1000)
  })

  it('PLATFORM_FEE is 5%', () => {
    expect(PLATFORM_FEE).toBe(0.05)
  })

  it('TMA_URL includes bot username', () => {
    expect(TMA_URL).toContain('t.me/')
    expect(TMA_URL).toContain('/app')
  })
})
