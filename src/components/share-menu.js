import { html, escapeHtml } from '../utils/dom.js'
import { localize, t } from '../i18n.js'
import { showToast } from './toast.js'
import { BASE_URL } from '../constants.js'
import { formatPoolCompact } from '../utils/format.js'

/**
 * Build share text from a bet object.
 * Reads like a conviction flex — provocative enough to make people pick a side.
 */
function buildShareText(bet) {
  const title = localize(bet.title)
  const outcomes = bet.outcomes || []
  const totalPool = bet.total_pool || 0
  const yes = outcomes[0]
  const no = outcomes[1]
  const yesPct = totalPool > 0 && yes ? Math.round((yes.pool / totalPool) * 100) : 50
  const noPct = 100 - yesPct
  const yesLabel = (yes && localize(yes.label)) || 'YES'
  const noLabel = (no && localize(no.label)) || 'NO'

  const pool = formatPoolCompact(totalPool)

  const countdown = fmtCountdown(bet.resolution_date)
  const timeStr = countdown ? ` · ${countdown} left` : ''

  return `${title}\n\n${yesLabel} ${yesPct}% · ${noLabel} ${noPct}%\n${pool} pool${timeStr}`
}

function fmtCountdown(dateStr) {
  if (!dateStr) return ''
  const diff = new Date(dateStr) - Date.now()
  if (diff <= 0) return ''
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h`
  return `${Math.floor(diff / 60_000)}m`
}

function betUrl(bet) {
  return `${BASE_URL}/bet/${bet.id}`
}

const PLATFORMS = [
  {
    id: 'x',
    label: 'X',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    url: (text, url) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
    url: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    url: (_text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0zm6.066 13.756c.066.282.1.57.1.862 0 2.994-3.1 5.423-6.92 5.423-3.82 0-6.92-2.43-6.92-5.423 0-.292.034-.58.1-.862a1.613 1.613 0 0 1-.668-1.313c0-.892.723-1.615 1.615-1.615.427 0 .815.167 1.103.44a8.957 8.957 0 0 1 4.02-1.252l.903-4.243a.34.34 0 0 1 .407-.264l2.998.638a1.158 1.158 0 1 1-.124.568l-2.694-.574-.8 3.77a8.916 8.916 0 0 1 3.93 1.244 1.6 1.6 0 0 1 1.082-.431c.892 0 1.616.723 1.616 1.615 0 .534-.26 1.006-.668 1.3zM9.074 13.4c0 .65.527 1.178 1.178 1.178.65 0 1.178-.527 1.178-1.178 0-.65-.527-1.178-1.178-1.178-.65 0-1.178.527-1.178 1.178zm5.582 2.865c-.054 0-.106-.02-.147-.06-.56-.56-1.42-.82-2.48-.82h-.06c-1.065 0-1.924.26-2.48.82a.207.207 0 0 1-.294-.294c.65-.65 1.625-.968 2.77-.968h.07c1.15 0 2.12.318 2.77.968a.207.207 0 0 1-.15.354zm-.348-1.687c-.65 0-1.178-.527-1.178-1.178 0-.65.527-1.178 1.178-1.178.65 0 1.178.527 1.178 1.178 0 .65-.527 1.178-1.178 1.178z"/></svg>`,
    url: (text, url) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text.split('\n')[0])}`,
  },
]

// Track rAF ID so closeShareMenu can cancel a pending listener setup
let pendingRaf = 0

/**
 * Open the share menu anchored to a trigger element.
 */
export function openShareMenu(trigger, bet) {
  closeShareMenu()

  const text = buildShareText(bet)
  const url = betUrl(bet)

  const menu = html`
    <div class="share-menu" role="menu" aria-label="${escapeHtml(t('share'))}">
      ${PLATFORMS.map(p => `
        <a
          class="share-menu__item share-menu__item--${p.id}"
          href="${escapeHtml(p.url(text, url))}"
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
          aria-label="${escapeHtml(t('share'))} ${escapeHtml(p.label)}"
        >
          <span class="share-menu__icon">${p.icon}</span>
        </a>
      `).join('')}
      <button class="share-menu__item share-menu__item--copy" role="menuitem" aria-label="${escapeHtml(t('copyLink'))}">
        <span class="share-menu__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </span>
      </button>
    </div>
  `

  menu.querySelector('.share-menu__item--copy').addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: t('copied'), type: 'success' })
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      showToast({ message: t('copied'), type: 'success' })
    }
    closeShareMenu()
  })

  menu.addEventListener('click', (e) => e.stopPropagation())

  positionMenu(menu, trigger)
  document.body.appendChild(menu)

  // Defer listener setup to next frame; store ID so close can cancel
  pendingRaf = requestAnimationFrame(() => {
    pendingRaf = 0
    document.addEventListener('click', onOutsideClick)
    document.addEventListener('keydown', onEscapeKey)
  })

  requestAnimationFrame(() => menu.classList.add('share-menu--open'))
}

function positionMenu(menu, trigger) {
  const rect = trigger.getBoundingClientRect()
  menu.style.position = 'fixed'
  menu.style.zIndex = '1000'

  const menuWidth = 220
  let left = rect.left + rect.width / 2 - menuWidth / 2
  let top = rect.top - 8

  // Clamp horizontal
  if (left < 8) left = 8
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8

  // If not enough space above, position below
  if (top < 60) {
    menu.style.left = `${left}px`
    menu.style.top = `${rect.bottom + 8}px`
    menu.style.transform = 'none'
  } else {
    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
    menu.style.transform = 'translateY(-100%)'
  }
}

function onOutsideClick(e) {
  if (!e.target.closest('.share-menu')) {
    closeShareMenu()
  }
}

function onEscapeKey(e) {
  if (e.key === 'Escape') {
    closeShareMenu()
  }
}

/**
 * Close any open share menu.
 */
export function closeShareMenu() {
  if (pendingRaf) {
    cancelAnimationFrame(pendingRaf)
    pendingRaf = 0
  }
  document.removeEventListener('click', onOutsideClick)
  document.removeEventListener('keydown', onEscapeKey)
  const existing = document.querySelector('.share-menu')
  if (existing) existing.remove()
}

/**
 * Try Web Share API first, fall back to the popover menu.
 */
export async function shareBet(trigger, bet) {
  const title = localize(bet.title)
  const url = betUrl(bet)

  if (navigator.share) {
    try {
      await navigator.share({ title, text: buildShareText(bet), url })
      return
    } catch { /* cancelled */ }
  }

  openShareMenu(trigger, bet)
}

/**
 * Shared click handler for share buttons on bet cards.
 * Use as a capture-phase listener on the bet list container.
 */
export function handleShareClick(e) {
  const shareBtn = e.target.closest('.bet-card__share')
  if (!shareBtn) return
  e.preventDefault()
  e.stopPropagation()
  const card = shareBtn.closest('.bet-card[data-bet-id]')
  if (card && card._bet) {
    shareBet(shareBtn, card._bet)
  }
}
