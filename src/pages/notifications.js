import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { api } from '../api.js'
import { formatDate } from '../utils/format.js'

const NOTIFICATION_ICONS = {
  milestone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><path d="M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M12 16v2"/><path d="M8 22h8"/></svg>`,
  deposit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  withdrawal: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  resolution: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
}

/**
 * Format relative time for notifications.
 */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

/**
 * Render a single notification item.
 */
function renderNotification(notif) {
  const icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.milestone
  const readClass = notif.is_read ? 'notification--read' : 'notification--unread'
  const dot = notif.is_read ? '&#9675;' : '&#9679;'

  return `
    <div class="notification ${readClass}" data-id="${escapeHtml(notif.id)}">
      <span class="notification__dot">${dot}</span>
      <span class="notification__icon">${icon}</span>
      <div class="notification__content">
        <div class="notification__title">${escapeHtml(notif.title)}</div>
        <div class="notification__body text-secondary">${escapeHtml(notif.body)}</div>
        <div class="notification__time text-secondary">${timeAgo(notif.created_at)}</div>
      </div>
    </div>
  `
}

/**
 * Notifications page — list with pagination and mark-all-read.
 */
export async function notificationsPage({ params, query, container }) {
  const cleanups = []

  // Auth check
  if (!store.isAuthenticated) {
    mount(container, `
      <div class="page-empty page-empty--login">
        <h2>${t('loginRequired')}</h2>
        <p class="text-secondary">${t('browseFreely')}</p>
        <a href="/login?redirect=/notifications" data-link class="btn btn-primary">${t('login')}</a>
      </div>
    `)
    return () => {}
  }

  let notifications = []
  let cursor = null
  let loading = false

  const page = html`
    <div class="page page--notifications">
      <div class="notifications-header">
        <h1 class="page-title">${t('notificationsTitle')}</h1>
        <button class="btn btn-secondary notifications-clear-btn">${t('notificationsClear')}</button>
      </div>
      <div class="notifications-list" role="list" aria-live="polite"></div>
      <div class="notifications-footer"></div>
    </div>
  `

  mount(container, page)

  const listEl = $('.notifications-list', page)
  const footerEl = $('.notifications-footer', page)
  const clearBtn = $('.notifications-clear-btn', page)

  async function fetchNotifications(append = false) {
    if (loading) return
    loading = true

    if (!append) {
      listEl.innerHTML = `
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text"></div>
      `
      cursor = null
      notifications = []
    } else {
      footerEl.innerHTML = '<div class="load-more-spinner"></div>'
    }

    try {
      const fetchParams = { size: 20 }
      if (cursor) fetchParams.prev = cursor

      const res = await api.get('/v1/notification/', fetchParams)
      const newItems = res.items || []
      cursor = res.prev || null

      if (!append) {
        notifications = newItems
      } else {
        notifications = [...notifications, ...newItems]
      }

      renderList()
    } catch {
      if (!append) {
        listEl.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('error')}</p></div>`
      }
    } finally {
      loading = false
    }
  }

  function renderList() {
    if (notifications.length === 0) {
      listEl.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('notificationsEmpty')}</p><a href="/" data-link class="btn btn-primary">${t('browseMarkets')}</a></div>`
      footerEl.innerHTML = ''
      return
    }

    listEl.innerHTML = notifications.map(renderNotification).join('')

    if (cursor) {
      footerEl.innerHTML = `<button class="btn btn-secondary load-more-btn">${t('loadMore')}</button>`
    } else {
      footerEl.innerHTML = ''
    }
  }

  // Mark all read
  async function onClearClick() {
    try {
      await api.post('/v1/notification/read')
      notifications.forEach(n => { n.is_read = true })
      renderList()
      store.set({ unreadNotifications: 0 })
    } catch {
      // Non-critical — badge state will correct on next page load
    }
  }
  clearBtn.addEventListener('click', onClearClick)
  cleanups.push(() => clearBtn.removeEventListener('click', onClearClick))

  // Load more
  function onFooterClick(e) {
    if (e.target.closest('.load-more-btn')) {
      fetchNotifications(true)
    }
  }
  footerEl.addEventListener('click', onFooterClick)
  cleanups.push(() => footerEl.removeEventListener('click', onFooterClick))

  await fetchNotifications(false)

  // Count unread and update store
  const unread = notifications.filter(n => !n.is_read).length
  store.set({ unreadNotifications: unread })

  return () => {
    cleanups.forEach(fn => fn())
  }
}
