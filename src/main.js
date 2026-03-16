import './styles/main.css'
import { redirectMobile } from './utils/mobile.js'
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
import { api } from './api.js'

// Mobile redirect — bail early if redirecting
if (redirectMobile()) {
  // Stop here, user is being redirected to TMA
} else {
  init()
}

function init() {
  const app = document.getElementById('app')

  // Set html lang
  document.documentElement.lang = getLang()

  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault()
    console.error('Unhandled rejection:', e.reason)
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
  `

  const sidebar = $('#sidebar')
  const mainInner = $('#main-inner')
  const detailPanel = $('#detail-panel')
  const detailPanelInner = $('#detail-panel-inner')
  const appLayout = $('#app-layout')

  // Mount sidebar
  const sidebarEl = createSidebar()
  sidebar.appendChild(sidebarEl)

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
  router.add('/login', wrapPage(loginPage))

  // Set container for router (for 404 fallback)
  router.setContainer(mainInner)

  // Start router
  router.start()

  // Attempt token refresh on load if we have a refresh token but no valid access token
  if (!store.isAuthenticated && store.get('refreshToken')) {
    api.get('/v1/balance/', { size: 1 }).then(data => {
      store.set({ balance: data.balance })
    }).catch(() => {
      store.logout()
    })
  }
}
