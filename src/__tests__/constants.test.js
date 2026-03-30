import { describe, it, expect } from 'vitest'
import { CATEGORIES, MIN_BET, MIN_DEPOSIT, MIN_WITHDRAWAL, NANOTON, PLATFORM_FEE, TMA_URL } from '../constants.js'

describe('constants', () => {
  it('has all expected categories', () => {
    expect(CATEGORIES).toEqual(['Sports', 'Politics', 'Crypto', 'Culture', 'Tech'])
  })

  it('NANOTON is 1 billion', () => {
    expect(NANOTON).toBe(1_000_000_000)
  })

  it('MIN_BET is 1 TON', () => {
    expect(MIN_BET).toBe(1_000_000_000)
  })

  it('MIN_DEPOSIT is 1 TON', () => {
    expect(MIN_DEPOSIT).toBe(1_000_000_000)
  })

  it('MIN_WITHDRAWAL is 5 TON', () => {
    expect(MIN_WITHDRAWAL).toBe(5_000_000_000)
  })

  it('PLATFORM_FEE is 5%', () => {
    expect(PLATFORM_FEE).toBe(0.05)
  })

  it('TMA_URL includes bot username', () => {
    expect(TMA_URL).toContain('t.me/')
    expect(TMA_URL).toContain('/app')
  })
})
