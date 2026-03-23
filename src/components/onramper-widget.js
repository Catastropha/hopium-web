import { html } from '../utils/dom.js'
import { t } from '../i18n.js'

/**
 * Create an Onramper widget modal with iframe.
 * @param {import('../types.js').WidgetConfig} widgetConfig
 * @returns {HTMLElement}
 */
export function createOnramperWidget(widgetConfig) {
  const params = new URLSearchParams({
    apiKey: widgetConfig.apiKey,
    defaultAmount: String(widgetConfig.defaultAmount),
    defaultCrypto: widgetConfig.defaultCrypto,
    onlyCryptos: widgetConfig.onlyCryptos,
    onlyNetworks: widgetConfig.onlyNetworks,
    walletAddress: widgetConfig.walletAddress,
    partnerContext: widgetConfig.partnerContext,
    isAmountEditable: String(widgetConfig.isAmountEditable),
    themeName: 'dark',
  })

  const url = `https://buy.onramper.com?${params}`
  const previousFocus = document.activeElement

  const modal = html`
    <div class="onramper-overlay" role="dialog" aria-modal="true" aria-label="${t('depositContinue')}">
      <div class="onramper-modal">
        <div class="onramper-modal__header">
          <span class="onramper-modal__title">${t('depositContinue')}</span>
          <button class="onramper-modal__close" aria-label="${t('close')}">&times;</button>
        </div>
        <iframe src="${url}" class="onramper-iframe" allow="payment" loading="lazy"></iframe>
      </div>
    </div>
  `

  const closeBtn = modal.querySelector('.onramper-modal__close')

  function close() {
    modal.remove()
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('message', messageHandler)
    if (previousFocus && previousFocus.focus) previousFocus.focus()
  }

  closeBtn.addEventListener('click', close)

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  // Escape to close + focus trap
  function onKeydown(e) {
    if (e.key === 'Escape') {
      close()
      return
    }
    // Trap focus within modal
    if (e.key === 'Tab') {
      // Only focusable element is the close button (iframe handles its own focus)
      e.preventDefault()
      closeBtn.focus()
    }
  }
  document.addEventListener('keydown', onKeydown)

  // Listen for postMessage from Onramper iframe
  function messageHandler(event) {
    if (event.data?.type === 'onramper-success') {
      close()
    }
  }
  window.addEventListener('message', messageHandler)

  // Lock body scroll
  document.body.style.overflow = 'hidden'

  // Focus close button
  requestAnimationFrame(() => closeBtn.focus())

  return modal
}
