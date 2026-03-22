import { describe, it, expect } from 'vitest'
import { createOddsBar, updateOddsBar } from '../components/odds-bar.js'

describe('odds-bar', () => {
  describe('createOddsBar', () => {
    it('creates a meter element with correct role', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 70 },
        { id: '2', label: 'No', pool: 30 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('role')).toBe('meter')
    })

    it('sets correct ARIA attributes', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 70 },
        { id: '2', label: 'No', pool: 30 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('aria-valuenow')).toBe('70')
      expect(el.getAttribute('aria-valuemin')).toBe('0')
      expect(el.getAttribute('aria-valuemax')).toBe('100')
    })

    it('calculates correct percentages from pool values', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 3000 },
        { id: '2', label: 'No', pool: 7000 },
      ]
      const el = createOddsBar(outcomes)
      const yesBar = el.querySelector('.odds-bar__yes')
      const noBar = el.querySelector('.odds-bar__no')
      expect(yesBar.style.width).toBe('30%')
      expect(noBar.style.width).toBe('70%')
    })

    it('defaults to 50/50 when outcomes are missing', () => {
      const el = createOddsBar(null)
      expect(el.getAttribute('aria-valuenow')).toBe('50')
      const yesBar = el.querySelector('.odds-bar__yes')
      expect(yesBar.style.width).toBe('50%')
    })

    it('defaults to 50/50 when outcomes have less than 2 items', () => {
      const el = createOddsBar([{ id: '1', label: 'Yes', pool: 100 }])
      expect(el.getAttribute('aria-valuenow')).toBe('50')
    })

    it('handles zero total pool', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 0 },
        { id: '2', label: 'No', pool: 0 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('aria-valuenow')).toBe('50')
    })

    it('handles localized labels (object)', () => {
      const outcomes = [
        { id: '1', label: { en: 'Yes', ru: 'Да' }, pool: 60 },
        { id: '2', label: { en: 'No', ru: 'Нет' }, pool: 40 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('aria-label')).toContain('Yes')
      expect(el.getAttribute('aria-label')).toContain('No')
    })

    it('handles string labels', () => {
      const outcomes = [
        { id: '1', label: 'Oui', pool: 50 },
        { id: '2', label: 'Non', pool: 50 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('aria-label')).toContain('Oui')
      expect(el.getAttribute('aria-label')).toContain('Non')
    })

    it('uses YES/NO fallback when labels are missing', () => {
      const outcomes = [
        { id: '1', pool: 50 },
        { id: '2', pool: 50 },
      ]
      const el = createOddsBar(outcomes)
      expect(el.getAttribute('aria-label')).toContain('YES')
      expect(el.getAttribute('aria-label')).toContain('NO')
    })
  })

  describe('updateOddsBar', () => {
    it('updates width styles', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 50 },
        { id: '2', label: 'No', pool: 50 },
      ]
      const el = createOddsBar(outcomes)

      const newOutcomes = [
        { id: '1', label: 'Yes', pool: 80 },
        { id: '2', label: 'No', pool: 20 },
      ]
      updateOddsBar(el, newOutcomes)

      const yesBar = el.querySelector('.odds-bar__yes')
      const noBar = el.querySelector('.odds-bar__no')
      expect(yesBar.style.width).toBe('80%')
      expect(noBar.style.width).toBe('20%')
    })

    it('updates ARIA attributes', () => {
      const outcomes = [
        { id: '1', label: 'Yes', pool: 50 },
        { id: '2', label: 'No', pool: 50 },
      ]
      const el = createOddsBar(outcomes)

      updateOddsBar(el, [
        { id: '1', label: 'Yes', pool: 90 },
        { id: '2', label: 'No', pool: 10 },
      ])

      expect(el.getAttribute('aria-valuenow')).toBe('90')
      expect(el.getAttribute('aria-label')).toContain('90%')
    })

    it('handles null element gracefully', () => {
      expect(() => updateOddsBar(null, [])).not.toThrow()
    })

    it('handles null outcomes gracefully', () => {
      const el = createOddsBar([
        { id: '1', label: 'Yes', pool: 50 },
        { id: '2', label: 'No', pool: 50 },
      ])
      expect(() => updateOddsBar(el, null)).not.toThrow()
    })

    it('handles outcomes with less than 2 items gracefully', () => {
      const el = createOddsBar([
        { id: '1', label: 'Yes', pool: 50 },
        { id: '2', label: 'No', pool: 50 },
      ])
      expect(() => updateOddsBar(el, [{ id: '1', pool: 50 }])).not.toThrow()
    })
  })
})
