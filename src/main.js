import './styles/tokens.css'
import './styles/reset.css'
import './styles/typography.css'
import './styles/a11y.css'
import './styles/layout.css'
import './styles/sidebar.css'
import './styles/page.css'
import './styles/buttons.css'
import './styles/load-more.css'
import './styles/animations.css'
import './styles/home-hero.css'
import './styles/filter-bar.css'
import './styles/bet-card.css'
import './styles/bet-detail.css'
import './styles/odds-bar.css'
import './styles/skeleton.css'
import './styles/toast.css'
import './styles/share-menu.css'
import './styles/share.css'
import './styles/profile.css'
import './styles/leaderboard.css'
import './styles/segmented-control.css'
import './styles/pnl-card.css'
import './styles/login.css'
import './styles/notifications.css'
import './styles/shortcuts.css'
import './styles/responsive.css'
import { isMobile, getTMALink } from './utils/mobile.js'
import { router } from './router.js'
import { store } from './store.js'
import { $ } from './utils/dom.js'
import { setLang, getLang, t } from './i18n.js'
import { createSidebar } from './components/sidebar.js'
import { initToasts, showToast } from './components/toast.js'
import { initKeyboardShortcuts } from './components/keyboard-shortcuts.js'
import { homePage } from './pages/home.js'
import { betPage } from './pages/bet.js'
import { myBetsPage } from './pages/my-bets.js'
import { leaderboardPage } from './pages/leaderboard.js'
import { profilePage } from './pages/profile.js'
import { sharePage } from './pages/share.js'
import { loginPage } from './pages/login.js'
import { notificationsPage } from './pages/notifications.js'
import { api } from './api.js'
import { updateRouteMeta } from './utils/seo.js'
import { trackPageView } from './utils/analytics.js'
import { initPerfMonitoring } from './utils/perf.js'

init()

function init() {
  const app = document.getElementById('app')

  // Set html lang
  document.documentElement.lang = getLang()

  // Error tracking — queue for any provider to consume
  window.__hopium_errors = []

  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault()
    window.__hopium_errors.push({ type: 'rejection', message: e.reason?.message || String(e.reason), stack: e.reason?.stack, ts: Date.now(), url: location.href })
    console.error('Unhandled rejection:', e.reason)
  })

  window.addEventListener('error', (e) => {
    window.__hopium_errors.push({ type: 'error', message: e.message, filename: e.filename, lineno: e.lineno, ts: Date.now(), url: location.href })
  })

  // Build app shell
  app.innerHTML = `
    <a href="#main-content" class="skip-link">${t('skipToMain')}</a>
    <div class="app-layout" id="app-layout">
      <nav class="sidebar" id="sidebar" aria-label="${t('mainNav')}"></nav>
      <main class="main-content" id="main-content" tabindex="-1">
        <div class="main-inner" id="main-inner"></div>
      </main>
      <aside class="detail-panel" id="detail-panel" role="complementary" aria-label="${t('betDetails')}" hidden>
        <div class="detail-panel-inner" id="detail-panel-inner"></div>
      </aside>
    </div>
    <div id="route-announcer" class="sr-only" aria-live="assertive" aria-atomic="true"></div>
  `

  const sidebar = $('#sidebar')
  const mainInner = $('#main-inner')
  const detailPanel = $('#detail-panel')
  const detailPanelInner = $('#detail-panel-inner')
  const appLayout = $('#app-layout')

  // Mount sidebar
  const sidebarEl = createSidebar()
  sidebar.appendChild(sidebarEl)

  // Telegram CTA banner for mobile visitors (dismissable, persisted per session)
  if (isMobile() && !sessionStorage.getItem('hopium_tg_dismissed')) {
    // Build context from current path so the banner deep-links to the right bet
    const path = window.location.pathname
    const betMatch = path.match(/^\/bet\/([^/]+)$/)
    const shareMatch = path.match(/^\/share\/([^/]+)$/)
    let context = ''
    if (betMatch) context = `bet_${betMatch[1]}`
    else if (shareMatch) context = `share_${shareMatch[1]}`
    const tmaLink = getTMALink(context)

    const banner = document.createElement('div')
    banner.className = 'tg-banner'
    banner.setAttribute('role', 'complementary')
    banner.setAttribute('aria-label', 'Telegram app')
    banner.innerHTML = `
      <a href="${tmaLink}" class="tg-banner__link">
        <svg class="tg-banner__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.22l-1.89 8.93c-.14.64-.52.8-1.05.5l-2.9-2.14-1.4 1.35c-.15.15-.28.28-.58.28l.21-2.97 5.39-4.87c.23-.21-.05-.33-.36-.13L8.69 13.6l-2.84-.89c-.62-.19-.63-.62.13-.92l11.08-4.27c.51-.19.96.13.79.92z"/></svg>
        <span class="tg-banner__text">${t('openInTelegram')}</span>
      </a>
      <button class="tg-banner__close" aria-label="${t('dismiss')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `
    document.body.appendChild(banner)
    document.body.classList.add('has-tg-banner')
    banner.querySelector('.tg-banner__close').addEventListener('click', () => {
      banner.remove()
      document.body.classList.remove('has-tg-banner')
      sessionStorage.setItem('hopium_tg_dismissed', '1')
    })
  }

  // Init toasts
  initToasts()

  window.addEventListener('offline', () => showToast({ message: t('offline'), type: 'warning', duration: 10000 }))
  window.addEventListener('online', () => showToast({ message: t('backOnline'), type: 'success' }))

  // Init keyboard shortcuts
  initKeyboardShortcuts()

  // Detail panel management
  function openDetailPanel(content) {
    detailPanelInner.innerHTML = ''
    if (typeof content === 'string') {
      detailPanelInner.innerHTML = content
    } else if (content instanceof Node) {
      detailPanelInner.appendChild(content)
    }
    detailPanel.hidden = false
    appLayout.classList.remove('no-panel')
    requestAnimationFrame(() => {
      const firstFocusable = detailPanelInner.querySelector('button, [href], input, [tabindex]')
      if (firstFocusable) firstFocusable.focus()
    })
  }

  function closeDetailPanel() {
    detailPanel.hidden = true
    appLayout.classList.add('no-panel')
    detailPanelInner.innerHTML = ''
    store.set({ selectedBetId: null })
  }

  // Listen for detail panel close events
  document.addEventListener('hopium:detail-close', () => {
    closeDetailPanel()
  })

  // Start with no panel
  appLayout.classList.add('no-panel')

  // Page wrapper — passes container and detailPanel helpers to page handlers
  function wrapPage(handler) {
    return async (ctx) => {
      return handler({
        ...ctx,
        container: mainInner,
        detailPanel: {
          open: openDetailPanel,
          close: closeDetailPanel,
          el: detailPanelInner,
          isOpen: () => !detailPanel.hidden,
        },
      })
    }
  }

  // Register routes
  router.add('/', wrapPage(homePage))
  router.add('/bet/:id', wrapPage(betPage))
  router.add('/my-bets', wrapPage(myBetsPage))
  router.add('/my-bets/:tab', wrapPage(myBetsPage))
  router.add('/leaders', wrapPage(leaderboardPage))
  router.add('/leaders/:period', wrapPage(leaderboardPage))
  router.add('/profile', wrapPage(profilePage))
  router.add('/share/:id', wrapPage(sharePage))
  router.add('/notifications', wrapPage(notificationsPage))
  router.add('/login', wrapPage(loginPage))

  // Set container for router (for 404 fallback)
  router.setContainer(mainInner)

  // SEO, analytics, perf — update on every route change
  const routeAnnouncer = $('#route-announcer')

  window.addEventListener('hopium:route-change', () => {
    const path = window.location.pathname
    updateRouteMeta(path)
    trackPageView(path, document.title)
    if (routeAnnouncer) routeAnnouncer.textContent = document.title
  })

  // Start router
  router.start()

  // Performance monitoring
  initPerfMonitoring()

  // Attempt token refresh on load if we have a refresh token but no valid access token
  if (!store.isAuthenticated && store.get('refreshToken')) {
    api.get('/v1/balance/', { size: 1 }).then(data => {
      store.set({ balance: data.balance })
    }).catch(() => {
      store.logout()
    })
  }

  // Fetch unread notification count on load (if authenticated)
  if (store.isAuthenticated) {
    api.get('/v1/notification/', { size: 1 }).then(res => {
      const unread = (res.items || []).filter(n => !n.is_read).length
      store.set({ unreadNotifications: unread })
    }).catch(() => {})
  }
}
