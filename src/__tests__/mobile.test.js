import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../constants.js', () => ({
  TMA_URL: 'https://t.me/HopiumBot/app',
  BOT_USERNAME: 'HopiumBot',
}))

vi.mock('../i18n.js', () => ({
  t: (key) => key,
}))

import { isMobile, getTMALink, redirectMobile } from '../utils/mobile.js'

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

describe('redirectMobile', () => {
  const originalUA = navigator.userAgent

  function setViewport(width) {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  }

  function setUserAgent(ua) {
    Object.defineProperty(navigator, 'userAgent', { value: ua, writable: true, configurable: true })
  }

  function setPath(pathname) {
    Object.defineProperty(window, 'location', {
      value: { pathname, search: '', href: `http://localhost${pathname}` },
      writable: true,
      configurable: true,
    })
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
    setViewport(1024)
    setUserAgent(originalUA)
    document.body.innerHTML = ''
  })

  it('returns false on desktop', () => {
    setViewport(1440)
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)')
    setPath('/')
    expect(redirectMobile()).toBe(false)
  })

  it('returns true and renders interstitial on mobile', () => {
    setViewport(375)
    setUserAgent('Mozilla/5.0 (iPhone)')
    setPath('/')
    expect(redirectMobile()).toBe(true)

    const app = document.getElementById('app')
    expect(app.innerHTML).toContain('mobile-redirect')
    expect(app.innerHTML).toContain('openInTelegram')
  })

  it('builds bet context from /bet/:id path', () => {
    setViewport(375)
    setUserAgent('Mozilla/5.0 (iPhone)')
    setPath('/bet/abc123')
    redirectMobile()

    const app = document.getElementById('app')
    expect(app.innerHTML).toContain('startapp=bet_abc123')
    expect(app.innerHTML).toContain('mobileBetShared')
  })

  it('builds share context from /share/:id path', () => {
    setViewport(375)
    setUserAgent('Mozilla/5.0 (iPhone)')
    setPath('/share/xyz789')
    redirectMobile()

    const app = document.getElementById('app')
    expect(app.innerHTML).toContain('startapp=share_xyz789')
    expect(app.innerHTML).toContain('mobileBetShared')
  })

  it('renders without context text for non-bet paths', () => {
    setViewport(375)
    setUserAgent('Mozilla/5.0 (iPhone)')
    setPath('/leaderboard')
    redirectMobile()

    const app = document.getElementById('app')
    expect(app.innerHTML).toContain('mobile-redirect')
    expect(app.innerHTML).not.toContain('mobileBetShared')
  })

  it('handles missing #app element gracefully', () => {
    document.body.innerHTML = ''
    setViewport(375)
    setUserAgent('Mozilla/5.0 (iPhone)')
    setPath('/')
    expect(redirectMobile()).toBe(true)
  })
})
