import '../styles/toast.css'
import { html, $ } from '../utils/dom.js'
import { t } from '../i18n.js'

const ICON_SUCCESS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
const ICON_ERROR = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
const ICON_WARNING = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
const ICON_INFO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`

const ICONS = { success: ICON_SUCCESS, error: ICON_ERROR, warning: ICON_WARNING, info: ICON_INFO }

let container = null

/**
 * Initialize the toast notification system.
 * Call once at app startup. Creates the fixed container element.
 */
export function initToasts() {
  if (container) return container

  container = html`<div class="toast-container" aria-live="polite" aria-relevant="additions"></div>`
  document.body.appendChild(container)

  return container
}

/**
 * Show a toast notification.
 *
 * @param {Object} options
 * @param {string} options.message - The message to display.
 * @param {string} [options.type='info'] - Type: success, error, warning, info.
 * @param {number} [options.duration=4000] - Auto-dismiss time in ms.
 */
export function showToast({ message, type = 'info', duration = 4000 }) {
  if (!container) initToasts()

  const icon = ICONS[type] || ICONS.info

  const toast = html`
    <div class="toast toast--${type}" role="status">
      <span class="toast__icon">${icon}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="${t('dismiss')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `

  const closeBtn = toast.querySelector('.toast__close')
  let dismissTimer = null

  function dismiss() {
    if (dismissTimer) clearTimeout(dismissTimer)
    toast.classList.add('toast--exit')
    toast.addEventListener('animationend', () => {
      toast.remove()
    }, { once: true })
    // Fallback removal if animation doesn't fire
    setTimeout(() => toast.remove(), 300)
  }

  closeBtn.addEventListener('click', dismiss)

  container.appendChild(toast)

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--enter')
  })

  // Auto-dismiss
  dismissTimer = setTimeout(dismiss, duration)

  return toast
}
