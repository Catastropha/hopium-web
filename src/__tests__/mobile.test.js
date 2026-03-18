import { describe, it, expect, afterEach } from 'vitest'

import { isMobile, getTMALink } from '../utils/mobile.js'

describe('isMobile', () => {
  const originalUA = navigator.userAgent

  function setViewport(width) {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  }

  function setUserAgent(ua) {
    Object.defineProperty(navigator, 'userAgent', { value: ua, writable: true, configurable: true })
  }

  afterEach(() => {
    setViewport(1024)
    setUserAgent(originalUA)
  })

  it('returns true for narrow viewports', () => {
    setViewport(375)
    setUserAgent('Mozilla/5.0 (Macintosh)')
    expect(isMobile()).toBe(true)
  })

  it('returns true for mobile user agents', () => {
    setViewport(1024)
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS)')
    expect(isMobile()).toBe(true)
  })

  it('returns true for Android user agents', () => {
    setViewport(1024)
    setUserAgent('Mozilla/5.0 (Linux; Android 12)')
    expect(isMobile()).toBe(true)
  })

  it('returns false for wide desktop viewports', () => {
    setViewport(1440)
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)')
    expect(isMobile()).toBe(false)
  })
})

describe('getTMALink', () => {
  it('returns base TMA URL when no context', () => {
    expect(getTMALink()).toBe('https://t.me/HopiumBot/app')
    expect(getTMALink('')).toBe('https://t.me/HopiumBot/app')
  })

  it('appends startapp param with context', () => {
    expect(getTMALink('bet_abc123')).toBe(
      'https://t.me/HopiumBot/app?startapp=bet_abc123'
    )
  })

  it('encodes special characters in context', () => {
    const link = getTMALink('bet_a b&c')
    expect(link).toContain('startapp=bet_a%20b%26c')
  })
})
