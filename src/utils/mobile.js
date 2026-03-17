import { TMA_URL, BOT_USERNAME } from '../constants.js'
import { t } from '../i18n.js'

/**
 * Detect if the user is on a mobile device.
 * Uses screen width + user agent heuristic.
 */
export function isMobile() {
  if (window.innerWidth < 768) return true
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Build a TMA deep link, optionally with a startapp param to preserve context.
 * Example: https://t.me/HopiumBot/app?startapp=bet_abc123
 */
export function getTMALink(context) {
  if (!context) return TMA_URL
  return `${TMA_URL}?startapp=${encodeURIComponent(context)}`
}

/**
 * Redirect mobile users to TMA.
 * Shows a branded interstitial — user taps to open Telegram.
 * Returns true if on mobile (caller should stop rendering).
 */
export function redirectMobile() {
  if (!isMobile()) return false

  // Build context from current path
  const path = window.location.pathname
  let context = ''
  let isBetLink = false

  const betMatch = path.match(/^\/bet\/([^/]+)$/)
  const shareMatch = path.match(/^\/share\/([^/]+)$/)

  if (betMatch) { context = `bet_${betMatch[1]}`; isBetLink = true }
  else if (shareMatch) { context = `share_${shareMatch[1]}`; isBetLink = true }

  const tmaLink = getTMALink(context)

  // Render interstitial
  const app = document.getElementById('app')
  if (app) {
    app.innerHTML = `
      <div class="mobile-redirect">
        <div class="mobile-redirect__content">
          <div class="mobile-redirect__header">
            <span class="mobile-redirect__mark" aria-hidden="true">H</span>
            <span class="mobile-redirect__wordmark">HOPIUM</span>
          </div>

          <div class="mobile-redirect__pitch">
            <h1 class="mobile-redirect__headline">${t('mobileHeadline')}</h1>
            <p class="mobile-redirect__sub">${t('mobileSub')}</p>
          </div>

          <div class="mobile-redirect__bars" aria-hidden="true">
            <div class="mobile-redirect__bar" style="--yes-w: 72%; --no-w: 28%"></div>
            <div class="mobile-redirect__bar" style="--yes-w: 45%; --no-w: 55%"></div>
            <div class="mobile-redirect__bar" style="--yes-w: 89%; --no-w: 11%"></div>
          </div>

          ${isBetLink ? `<p class="mobile-redirect__context">${t('mobileBetShared')}</p>` : ''}

          <a href="${tmaLink}" class="mobile-redirect__cta">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.22l-1.89 8.93c-.14.64-.52.8-1.05.5l-2.9-2.14-1.4 1.35c-.15.15-.28.28-.58.28l.21-2.97 5.39-4.87c.23-.21-.05-.33-.36-.13L8.69 13.6l-2.84-.89c-.62-.19-.63-.62.13-.92l11.08-4.27c.51-.19.96.13.79.92z"/></svg>
            ${t('openInTelegram')}
          </a>

          <div class="mobile-redirect__footer">
            <p class="mobile-redirect__alt">${t('mobileFooter')}</p>
            <p class="mobile-redirect__fallback">${t('mobileNoTelegram')} <a href="https://telegram.org/dl" class="mobile-redirect__link">${t('mobileGetTelegram')}</a></p>
          </div>
        </div>
      </div>
    `
  }

  return true
}
