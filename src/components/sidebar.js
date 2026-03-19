import { html, $ } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { isMobile, getTMALink } from '../utils/mobile.js'

const ICON_HOME = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
const ICON_CHART = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>`
const ICON_TROPHY = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><path d="M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M12 16v2"/><path d="M8 22h8"/><path d="M8 22a2 2 0 0 1 0-4h8a2 2 0 0 1 0 4"/></svg>`
const ICON_USER = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`

const NAV_ITEMS = [
  { path: '/', icon: ICON_HOME, labelKey: 'home' },
  { path: '/my-bets', icon: ICON_CHART, labelKey: 'myBets' },
  { path: '/leaders', icon: ICON_TROPHY, labelKey: 'leaderboard' },
  { path: '/profile', icon: ICON_USER, labelKey: 'profile' },
]

/**
 * Create the sidebar navigation.
 * Desktop: vertical left sidebar (60px wide).
 * Tablet: horizontal top bar (56px height) via CSS media queries.
 */
export function createSidebar() {
  const currentPath = window.location.pathname

  const navItemsHtml = NAV_ITEMS.map((item, i) => {
    const isActive = item.path === '/'
      ? currentPath === '/'
      : currentPath.startsWith(item.path)

    return `
      <a
        href="${item.path}"
        data-link
        class="sidebar__item ${isActive ? 'sidebar__item--active' : ''}"
        aria-label="${t(item.labelKey)}"
        data-tooltip="${t(item.labelKey)}"
        data-shortcut="${i + 1}"
        tabindex="0"
      >
        <span class="sidebar__icon">${item.icon}</span>
      </a>
    `
  }).join('')

  const username = store.get('username')
  const initial = username ? username.charAt(0).toUpperCase() : null

  const balance = store.get('balance')
  const balanceDisplay = balance != null ? `<span class="sidebar__balance">\u2B50 ${balance >= 1000 ? Math.round(balance / 1000) + 'k' : balance}</span>` : ''

  const bottomHtml = store.isAuthenticated
    ? `<div class="sidebar__user-section">
        ${balanceDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${username || t('profile')}">${initial}</a>
      </div>`
    : isMobile()
      ? `<a href="${getTMALink()}" class="sidebar__login" aria-label="${t('openInTelegram')}" data-tooltip="${t('openInTelegram')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        </a>`
      : `<a href="/login" data-link class="sidebar__login" aria-label="${t('login')}" data-tooltip="${t('login')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        </a>`

  const el = html`
    <nav class="sidebar" role="navigation" aria-label="${t('mainNav')}">
      <div class="sidebar__logo" aria-label="Hopium">
        <img class="sidebar__logo-img" src="/logo-letter.svg" alt="Hopium" width="32" height="32" />
      </div>
      <div class="sidebar__nav">
        ${navItemsHtml}
      </div>
      <div class="sidebar__bottom">
        ${bottomHtml}
      </div>
    </nav>
  `

  // Update active state on route changes
  function updateActive() {
    const path = window.location.pathname
    const items = el.querySelectorAll('.sidebar__item')
    items.forEach((item) => {
      const href = item.getAttribute('href')
      const isActive = href === '/'
        ? path === '/'
        : path.startsWith(href)
      item.classList.toggle('sidebar__item--active', isActive)
    })
  }

  window.addEventListener('popstate', updateActive)
  window.addEventListener('hopium:route-change', updateActive)

  // Update bottom section when auth changes
  store.on('username', () => {
    const bottom = $('.sidebar__bottom', el)
    const un = store.get('username')
    const ini = un ? un.charAt(0).toUpperCase() : null
    const bal = store.get('balance')
    const balDisplay = bal != null ? `<span class="sidebar__balance">\u2B50 ${bal >= 1000 ? Math.round(bal / 1000) + 'k' : bal}</span>` : ''
    if (store.isAuthenticated) {
      bottom.innerHTML = `<div class="sidebar__user-section">
        ${balDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${un || t('profile')}">${ini}</a>
      </div>`
    } else {
      bottom.innerHTML = isMobile()
        ? `<a href="${getTMALink()}" class="sidebar__login" aria-label="${t('openInTelegram')}" data-tooltip="${t('openInTelegram')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>`
        : `<a href="/login" data-link class="sidebar__login" aria-label="${t('login')}" data-tooltip="${t('login')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </a>`
    }
  })

  store.on('balance', () => {
    const bottom = $('.sidebar__bottom', el)
    // Re-render bottom section
    const un = store.get('username')
    const ini = un ? un.charAt(0).toUpperCase() : null
    const bal = store.get('balance')
    const balDisplay = bal != null ? `<span class="sidebar__balance">\u2B50 ${bal >= 1000 ? Math.round(bal / 1000) + 'k' : bal}</span>` : ''
    if (store.isAuthenticated) {
      bottom.innerHTML = `<div class="sidebar__user-section">
        ${balDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${un || t('profile')}">${ini}</a>
      </div>`
    }
  })

  return el
}
