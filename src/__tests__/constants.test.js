import { describe, it, expect } from 'vitest'
import { CATEGORIES, MIN_BET, PLATFORM_FEE, TMA_URL } from '../constants.js'

describe('constants', () => {
  it('has all expected categories', () => {
    expect(CATEGORIES).toEqual(['Sports', 'Politics', 'Crypto', 'Culture', 'Tech'])
  })

  it('MIN_BET is 10', () => {
    expect(MIN_BET).toBe(10)
  })

  it('PLATFORM_FEE is 5%', () => {
    expect(PLATFORM_FEE).toBe(0.05)
  })

  it('TMA_URL includes bot username', () => {
    expect(TMA_URL).toContain('t.me/')
    expect(TMA_URL).toContain('/app')
  })
})
