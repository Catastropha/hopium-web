import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../i18n.js', () => ({
  t: (key) => key,
}))

import { createOnramperWidget } from '../components/onramper-widget.js'

const mockConfig = {
  apiKey: 'test-key',
  defaultAmount: 100,
  defaultCrypto: 'USDT',
  onlyCryptos: 'USDT',
  onlyNetworks: 'tron',
  walletAddress: '0xabc',
  partnerContext: 'user-123',
  isAmountEditable: false,
}

describe('onramper-widget', () => {
  afterEach(() => {
    document.querySelectorAll('.onramper-overlay').forEach(el => el.remove())
    document.body.style.overflow = ''
  })

  it('creates a modal element', () => {
    const modal = createOnramperWidget(mockConfig)
    expect(modal).toBeInstanceOf(HTMLElement)
    expect(modal.classList.contains('onramper-overlay')).toBe(true)
  })

  it('contains an iframe with correct URL', () => {
    const modal = createOnramperWidget(mockConfig)
    const iframe = modal.querySelector('.onramper-iframe')
    expect(iframe).not.toBeNull()
    expect(iframe.src).toContain('buy.onramper.com')
    expect(iframe.src).toContain('apiKey=test-key')
  })

  it('close button removes modal', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)
    expect(document.querySelector('.onramper-overlay')).not.toBeNull()

    modal.querySelector('.onramper-modal__close').click()
    expect(document.querySelector('.onramper-overlay')).toBeNull()
  })

  it('has dark theme param', () => {
    const modal = createOnramperWidget(mockConfig)
    const iframe = modal.querySelector('.onramper-iframe')
    expect(iframe.src).toContain('themeName=dark')
  })

  it('has role=dialog and aria-modal', () => {
    const modal = createOnramperWidget(mockConfig)
    expect(modal.getAttribute('role')).toBe('dialog')
    expect(modal.getAttribute('aria-modal')).toBe('true')
  })

  it('locks body scroll on creation', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll on close', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)
    expect(document.body.style.overflow).toBe('hidden')

    modal.querySelector('.onramper-modal__close').click()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes on Escape key', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(document.querySelector('.onramper-overlay')).toBeNull()
  })

  it('closes on overlay backdrop click', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    // Click the overlay itself (not the inner modal)
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.querySelector('.onramper-overlay')).toBeNull()
  })

  it('does not close when clicking inside modal', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    // Click the inner modal content
    modal.querySelector('.onramper-modal').click()
    expect(document.querySelector('.onramper-overlay')).not.toBeNull()
  })

  it('traps focus on Tab key', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    const closeBtn = modal.querySelector('.onramper-modal__close')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))

    // Close button should retain focus (Tab prevented from leaving modal)
    expect(document.activeElement).toBe(closeBtn)
  })

  it('closes on postMessage success event', () => {
    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'onramper-success' },
    }))

    expect(document.querySelector('.onramper-overlay')).toBeNull()
  })

  it('restores focus to previous element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const modal = createOnramperWidget(mockConfig)
    document.body.appendChild(modal)

    modal.querySelector('.onramper-modal__close').click()
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
  })
})
