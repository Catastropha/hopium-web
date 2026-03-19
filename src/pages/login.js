import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'
import { BOT_USERNAME } from '../constants.js'
import { isMobile, getTMALink } from '../utils/mobile.js'

/**
 * Mount the Telegram Login Widget into a container element.
 * The widget script is loaded dynamically and calls onTelegramAuth on success.
 */
function mountTelegramWidget(widgetContainer, onAuth) {
  // Expose the global callback that the Telegram widget will call
  window.__hopiumTelegramAuth = (user) => {
    onAuth(user)
  }

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', BOT_USERNAME)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', '__hopiumTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')

  widgetContainer.appendChild(script)

  // Return cleanup function
  return () => {
    delete window.__hopiumTelegramAuth
    if (script.parentNode) {
      script.parentNode.removeChild(script)
    }
  }
}

/**
 * Login page with Telegram Login Widget.
 */
export async function loginPage({ params, query, container }) {
  const cleanups = []
  const redirect = query.redirect || '/'

  // If already authenticated, redirect immediately
  if (store.isAuthenticated) {
    router.navigate(redirect)
    return () => {}
  }

  // On mobile, redirect to Telegram Mini App instead of showing widget
  if (isMobile()) {
    window.location.href = getTMALink()
    return () => {}
  }

  const page = html`
    <div class="page page--login">
      <div class="login-card">
        <div class="login-card__logo"><img src="/logo-letter.svg" alt="Hopium" width="48" height="48" /></div>
        <h1 class="login-card__title">${t('login')} to Hopium</h1>
        <div class="login-card__widget"></div>
        <p class="login-card__subtext text-secondary">${t('browseFreely')}</p>
      </div>
    </div>
  `

  mount(container, page)

  const widgetContainer = $('.login-card__widget', page)

  // Handle Telegram auth callback
  async function onTelegramAuth(user) {
    // Show processing state
    widgetContainer.innerHTML = `<p class="text-secondary">${t('authenticating')}</p>`

    try {
      // Forward all Telegram widget data to our API
      const payload = {
        id: user.id,
        first_name: user.first_name,
        auth_date: user.auth_date,
        hash: user.hash,
      }
      if (user.last_name) payload.last_name = user.last_name
      if (user.username) payload.username = user.username
      if (user.photo_url) payload.photo_url = user.photo_url

      const res = await api.request('POST', '/v1/auth/widget', { body: payload })

      // Store auth data
      store.login(res)

      // Store user profile info
      store.set({
        username: user.username || user.first_name || null,
        photoUrl: user.photo_url || null,
      })

      // Redirect
      router.navigate(redirect)
    } catch (err) {
      widgetContainer.innerHTML = `
        <p class="text-no">${t('authFailed')}</p>
        <div class="login-card__widget-retry"></div>
      `
      // Re-mount widget for retry
      const retryContainer = $('.login-card__widget-retry', page)
      if (retryContainer) {
        const retryCleanup = mountTelegramWidget(retryContainer, onTelegramAuth)
        cleanups.push(retryCleanup)
      }
    }
  }

  // Mount the Telegram widget
  const widgetCleanup = mountTelegramWidget(widgetContainer, onTelegramAuth)
  cleanups.push(widgetCleanup)

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
