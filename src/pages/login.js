import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'
import { getTMALink } from '../utils/mobile.js'

const CODE_LENGTH = 6

/**
 * Login page — enter a web-code generated in the TMA.
 */
export async function loginPage({ params, query, container }) {
  const cleanups = []
  const redirect = query.redirect || '/'

  if (store.isAuthenticated) {
    router.navigate(redirect)
    return () => {}
  }

  const page = html`
    <div class="page page--login">
      <div class="login-card">
        <div class="login-card__logo"><img src="/logo-letter.svg" alt="Hopium" width="48" height="48" /></div>
        <h1 class="login-card__title">${t('signInToHopium')}</h1>
        <p class="login-card__subtext text-secondary">${t('loginInstructions')}</p>
        <div class="login-card__form">
          <div class="login-code-step">
            <input
              type="text"
              class="login-input login-code-input"
              placeholder="ABC234"
              maxlength="${CODE_LENGTH}"
              autocomplete="off"
              spellcheck="false"
              aria-label="${escapeHtml(t('loginCodePlaceholder'))}"
            />
            <button class="btn btn-primary login-submit">${t('loginVerify')}</button>
            <div class="login-error" role="alert" hidden></div>
          </div>
        </div>
        <p class="login-card__subtext text-secondary">
          <a href="${getTMALink()}" class="login-card__tma-link">${t('onMobileOpenTelegram')}</a>
        </p>
      </div>
    </div>
  `

  mount(container, page)

  const input = $('.login-code-input', page)
  const submitBtn = $('.login-submit', page)
  const errorEl = $('.login-error', page)

  input.focus()

  // Auto-uppercase as user types
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
  })

  let submitting = false

  async function onSubmit() {
    const code = input.value.trim()
    if (code.length !== CODE_LENGTH || submitting) return

    submitting = true
    submitBtn.disabled = true
    submitBtn.textContent = '...'
    errorEl.hidden = true

    try {
      const res = await api.request('POST', '/v1/auth/web-code/validate', {
        body: { code },
      })

      store.login(res)

      // Fetch balance
      try {
        const balanceRes = await api.get('/v1/balance/', { size: 1 })
        if (balanceRes.balance != null) store.set({ balance: balanceRes.balance })
      } catch { /* non-critical */ }

      router.navigate(redirect)
    } catch (err) {
      submitting = false
      submitBtn.disabled = false
      submitBtn.textContent = t('loginVerify')

      if (err instanceof ApiError && err.status === 429) {
        errorEl.textContent = t('authTooManyAttempts')
      } else if (err instanceof ApiError && err.status === 401) {
        errorEl.textContent = t('authInvalidCode')
        input.classList.add('login-code-input--shake')
        setTimeout(() => input.classList.remove('login-code-input--shake'), 500)
        input.value = ''
        input.focus()
      } else {
        errorEl.textContent = err.message || t('error')
      }
      errorEl.hidden = false
    }
  }

  submitBtn.addEventListener('click', onSubmit)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onSubmit()
  })

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
