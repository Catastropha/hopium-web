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
 * Shows an interstitial briefly in case redirect fails.
 * Returns true if redirecting (caller should stop rendering).
 */
export function redirectMobile() {
  if (!isMobile()) return false

  // Build context from current path
  const path = window.location.pathname
  let context = ''

  const betMatch = path.match(/^\/bet\/([a-f0-9]+)$/i)
  const shareMatch = path.match(/^\/share\/([a-f0-9]+)$/i)

  if (betMatch) context = `bet_${betMatch[1]}`
  else if (shareMatch) context = `share_${shareMatch[1]}`

  const tmaLink = getTMALink(context)

  // Render interstitial
  const app = document.getElementById('app')
  if (app) {
    app.innerHTML = `
      <div class="mobile-redirect">
        <div class="mobile-redirect-card">
          <div class="mobile-redirect-logo">H</div>
          <h1>${t('mobileTitle')}</h1>
          <p>${t('mobileDescription')}</p>
          <a href="${tmaLink}" class="btn btn-primary btn-lg">${t('openInTelegram')}</a>
          <p class="mobile-redirect-sub">${t('redirecting')}</p>
        </div>
      </div>
    `
  }

  // Auto-redirect after short delay
  setTimeout(() => {
    window.location.href = tmaLink
  }, 1500)

  return true
}
