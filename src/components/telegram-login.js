import '../styles/telegram-login.css'
import { html } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { BOT_USERNAME } from '../constants.js'
import { showToast } from './toast.js'

/**
 * Create the Telegram Login component.
 * Wraps the Telegram Login Widget with a styled button and handles auth flow.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess - Called after successful authentication.
 * @returns {HTMLElement}
 */
export function createTelegramLogin({ onSuccess } = {}) {
  const el = html`
    <div class="tg-login">
      <button class="tg-login__btn">
        <svg class="tg-login__icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span>${t('continueWith')}</span>
      </button>
      <div class="tg-login__widget" hidden></div>
      <div class="tg-login__error" hidden></div>
    </div>
  `

  const btn = el.querySelector('.tg-login__btn')
  const widgetContainer = el.querySelector('.tg-login__widget')
  const errorEl = el.querySelector('.tg-login__error')

  let widgetLoaded = false

  btn.addEventListener('click', () => {
    if (!widgetLoaded) {
      loadWidget()
    } else {
      // If widget already loaded, trigger it
      triggerWidget()
    }
  })

  function loadWidget() {
    btn.disabled = true
    btn.querySelector('span').textContent = '...'

    // Create a unique callback name
    const callbackName = `__hopiumTgAuth_${Date.now()}`

    // Set up the global callback
    window[callbackName] = async (authData) => {
      try {
        await handleAuth(authData)
      } finally {
        delete window[callbackName]
      }
    }

    // Create the Telegram Login Widget script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', `${callbackName}(user)`)
    script.setAttribute('data-request-access', 'write')
    script.async = true

    script.onload = () => {
      widgetLoaded = true
      btn.disabled = false
      btn.querySelector('span').textContent = t('continueWith')

      // Trigger the widget after it loads
      triggerWidget()
    }

    script.onerror = () => {
      btn.disabled = false
      btn.querySelector('span').textContent = t('continueWith')
      showError(t('telegramLoadFailed'))
    }

    widgetContainer.appendChild(script)
    widgetContainer.hidden = false
  }

  function triggerWidget() {
    // The Telegram widget renders an iframe — find and click it
    const iframe = widgetContainer.querySelector('iframe')
    if (iframe) {
      iframe.style.display = 'block'
      // The widget will handle the auth popup
    }
  }

  async function handleAuth(authData) {
    errorEl.hidden = true
    btn.disabled = true
    btn.querySelector('span').textContent = '...'

    try {
      const response = await api.post('/v1/auth/widget', authData)

      // Store auth data
      store.login(response)

      // Set username and photo
      if (authData.username || authData.first_name) {
        store.set({
          username: authData.username || authData.first_name,
          photoUrl: authData.photo_url || null,
        })
      }

      // Fetch balance from /v1/balance/ (spec endpoint)
      try {
        const balanceRes = await api.get('/v1/balance/', { size: 1 })
        if (balanceRes.balance != null) {
          store.set({ balance: balanceRes.balance })
        }
      } catch {
        // Non-critical — balance will load when user visits profile
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : t('authFailed')
      showError(message)
      showToast({ message, type: 'error' })
    } finally {
      btn.disabled = false
      btn.querySelector('span').textContent = t('continueWith')
    }
  }

  function showError(message) {
    errorEl.textContent = message
    errorEl.hidden = false
  }

  return el
}
