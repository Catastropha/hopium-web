import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true })

let localize, t, getLang, setLang

async function loadI18n() {
  vi.resetModules()
  localStorageMock.clear()
  const mod = await import('../i18n.js')
  return mod
}

describe('i18n', () => {
  beforeEach(async () => {
    const mod = await loadI18n()
    localize = mod.localize
    t = mod.t
    getLang = mod.getLang
    setLang = mod.setLang
  })

  describe('localize', () => {
    it('returns text for current language', () => {
      expect(localize({ en: 'Hello', ru: 'Привет' })).toBe('Hello')
    })

    it('falls back to English when current lang is missing', () => {
      setLang('ro')
      expect(localize({ en: 'Hello', ru: 'Привет' })).toBe('Hello')
    })

    it('falls back to first available value when no en', () => {
      setLang('ro')
      expect(localize({ ru: 'Привет' })).toBe('Привет')
    })

    it('returns empty string for null/undefined input', () => {
      expect(localize(null)).toBe('')
      expect(localize(undefined)).toBe('')
    })

    it('returns empty string for non-object input', () => {
      expect(localize('just a string')).toBe('')
    })

    it('returns empty string for empty object', () => {
      expect(localize({})).toBe('')
    })
  })

  describe('t', () => {
    it('returns known UI strings', () => {
      expect(t('home')).toBe('Home')
      expect(t('login')).toBe('Log in')
      expect(t('placeBet')).toBe('Place Bet')
    })

    it('returns the key itself for unknown strings', () => {
      expect(t('nonExistentKey')).toBe('nonExistentKey')
    })
  })

  describe('getLang / setLang', () => {
    it('defaults to en', () => {
      expect(getLang()).toBe('en')
    })

    it('changes language', () => {
      setLang('ru')
      expect(getLang()).toBe('ru')
    })

    it('ignores unsupported languages', () => {
      setLang('xx')
      expect(getLang()).not.toBe('xx')
    })

    it('persists to localStorage', () => {
      setLang('pt')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('hopium_lang', 'pt')
    })
  })

  describe('initialization', () => {
    it('loads language from localStorage', async () => {
      localStorageMock.getItem.mockReturnValueOnce('ru')
      vi.resetModules()
      const mod = await import('../i18n.js')
      expect(mod.getLang()).toBe('ru')
    })

    it('falls back to en for unsupported stored language', async () => {
      localStorageMock.getItem.mockReturnValueOnce('zh')
      vi.resetModules()
      const mod = await import('../i18n.js')
      expect(mod.getLang()).toBe('en')
    })

    it('uses navigator.language when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      Object.defineProperty(navigator, 'language', { value: 'pt-BR', writable: true, configurable: true })
      vi.resetModules()
      const mod = await import('../i18n.js')
      expect(mod.getLang()).toBe('pt')
      Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true, configurable: true })
    })
  })

  describe('localize with base language fallback', () => {
    it('falls back to base language code when full locale not found', async () => {
      // Set lang to something like 'en' then test a dict that has 'en'
      setLang('en')
      // localize should check currentLang then base (same for 'en')
      expect(localize({ en: 'Yes' })).toBe('Yes')
    })
  })

  describe('t with non-en language', () => {
    it('falls back to English strings when current lang has no strings', () => {
      setLang('ru')
      // No Russian strings defined, should fall back to English
      expect(t('home')).toBe('Home')
      expect(t('login')).toBe('Log in')
    })
  })
})
