import { describe, it, expect } from 'vitest'
import { createCardSkeleton, createDetailSkeleton, createTableSkeleton } from '../components/skeleton.js'

describe('skeleton', () => {
  describe('createCardSkeleton', () => {
    it('returns an HTMLElement', () => {
      const el = createCardSkeleton()
      expect(el).toBeInstanceOf(HTMLElement)
    })

    it('has aria-hidden true', () => {
      const el = createCardSkeleton()
      expect(el.getAttribute('aria-hidden')).toBe('true')
    })

    it('has bet-card--skeleton class', () => {
      const el = createCardSkeleton()
      expect(el.classList.contains('bet-card--skeleton')).toBe(true)
    })
  })

  describe('createDetailSkeleton', () => {
    it('returns an HTMLElement', () => {
      const el = createDetailSkeleton()
      expect(el).toBeInstanceOf(HTMLElement)
    })

    it('has aria-hidden true', () => {
      const el = createDetailSkeleton()
      expect(el.getAttribute('aria-hidden')).toBe('true')
    })

    it('has bet-detail--skeleton class', () => {
      const el = createDetailSkeleton()
      expect(el.classList.contains('bet-detail--skeleton')).toBe(true)
    })

    it('contains skeleton elements', () => {
      const el = createDetailSkeleton()
      expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    })
  })

  describe('createTableSkeleton', () => {
    it('returns a tbody element', () => {
      const el = createTableSkeleton()
      expect(el.tagName).toBe('TBODY')
    })

    it('renders default 5 rows', () => {
      const el = createTableSkeleton()
      expect(el.querySelectorAll('tr').length).toBe(5)
    })

    it('renders custom number of rows', () => {
      const el = createTableSkeleton(3)
      expect(el.querySelectorAll('tr').length).toBe(3)
    })

    it('rows have aria-hidden', () => {
      const el = createTableSkeleton(2)
      const rows = el.querySelectorAll('tr')
      rows.forEach(row => {
        expect(row.getAttribute('aria-hidden')).toBe('true')
      })
    })
  })
})
