import { html, $ } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { formatDollarsCompact } from '../utils/format.js'

const ICON_HOME = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
const ICON_CHART = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>`
const ICON_TROPHY = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><path d="M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M12 16v2"/><path d="M8 22h8"/><path d="M8 22a2 2 0 0 1 0-4h8a2 2 0 0 1 0 4"/></svg>`
const ICON_BELL = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
const ICON_USER = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`

const NAV_ITEMS = [
  { path: '/', icon: ICON_HOME, labelKey: 'home' },
  { path: '/my-bets', icon: ICON_CHART, labelKey: 'myBets' },
  { path: '/leaders', icon: ICON_TROPHY, labelKey: 'leaderboard' },
  { path: '/notifications', icon: ICON_BELL, labelKey: 'notificationsTitle', hasBadge: true },
  { path: '/profile', icon: ICON_USER, labelKey: 'profile' },
]

/**
 * Create the sidebar navigation.
 * Desktop: vertical left sidebar (60px wide).
 * Tablet: horizontal top bar (56px height) via CSS media queries.
 */
export function createSidebar() {
  const currentPath = window.location.pathname

  const unread = store.get('unreadNotifications') || 0

  const navItemsHtml = NAV_ITEMS.map((item, i) => {
    const isActive = item.path === '/'
      ? currentPath === '/'
      : currentPath.startsWith(item.path)
    const badgeHtml = item.hasBadge && unread > 0
      ? `<span class="sidebar__badge" aria-label="${unread} unread">${unread > 9 ? '9+' : unread}</span>`
      : ''

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
        ${badgeHtml}
      </a>
    `
  }).join('')

  const username = store.get('username')
  const initial = username ? username.charAt(0).toUpperCase() : null

  const balance = store.get('balance')
  const balanceDisplay = balance != null ? `<span class="sidebar__balance" aria-live="polite">${formatDollarsCompact(balance)}</span>` : ''

  const bottomHtml = store.isAuthenticated
    ? `<div class="sidebar__user-section">
        ${balanceDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${username || t('profile')}">${initial}</a>
      </div>`
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
    const balDisplay = bal != null ? `<span class="sidebar__balance" aria-live="polite">${formatDollarsCompact(bal)}</span>` : ''
    if (store.isAuthenticated) {
      bottom.innerHTML = `<div class="sidebar__user-section">
        ${balDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${un || t('profile')}">${ini}</a>
      </div>`
    } else {
      bottom.innerHTML = `<a href="/login" data-link class="sidebar__login" aria-label="${t('login')}" data-tooltip="${t('login')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </a>`
    }
  })

  // Update notification badge when unread count changes
  store.on('unreadNotifications', () => {
    const navItems = el.querySelectorAll('.sidebar__item')
    navItems.forEach(item => {
      if (item.getAttribute('href') === '/notifications') {
        const existing = item.querySelector('.sidebar__badge')
        const count = store.get('unreadNotifications') || 0
        if (count > 0) {
          const label = count > 9 ? '9+' : String(count)
          if (existing) {
            existing.textContent = label
            existing.setAttribute('aria-label', `${count} unread`)
          } else {
            const badge = document.createElement('span')
            badge.className = 'sidebar__badge'
            badge.textContent = label
            badge.setAttribute('aria-label', `${count} unread`)
            item.appendChild(badge)
          }
        } else if (existing) {
          existing.remove()
        }
      }
    })
  })

  store.on('balance', () => {
    const bottom = $('.sidebar__bottom', el)
    // Re-render bottom section
    const un = store.get('username')
    const ini = un ? un.charAt(0).toUpperCase() : null
    const bal = store.get('balance')
    const balDisplay = bal != null ? `<span class="sidebar__balance" aria-live="polite">${formatDollarsCompact(bal)}</span>` : ''
    if (store.isAuthenticated) {
      bottom.innerHTML = `<div class="sidebar__user-section">
        ${balDisplay}
        <a href="/profile" data-link class="sidebar__avatar" aria-label="${t('profile')}" data-tooltip="${un || t('profile')}">${ini}</a>
      </div>`
    }
  })

  return el
}
