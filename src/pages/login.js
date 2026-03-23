import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'
import { getTMALink } from '../utils/mobile.js'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 45

/**
 * Login page with email OTP flow (2-step).
 */
export async function loginPage({ params, query, container }) {
  const cleanups = []
  const redirect = query.redirect || '/'

  // If already authenticated, redirect immediately
  if (store.isAuthenticated) {
    router.navigate(redirect)
    return () => {}
  }

  let step = 'email' // 'email' | 'otp'
  let email = ''

  const page = html`
    <div class="page page--login">
      <div class="login-card">
        <div class="login-card__logo"><img src="/logo-letter.svg" alt="Hopium" width="48" height="48" /></div>
        <h1 class="login-card__title">${t('signInToHopium')}</h1>
        <div class="login-card__form"></div>
        <p class="login-card__subtext text-secondary">
          <a href="${getTMALink()}" class="login-card__tma-link">${t('onMobileOpenTelegram')}</a>
        </p>
      </div>
    </div>
  `

  mount(container, page)

  const formWrap = $('.login-card__form', page)
  const titleEl = $('.login-card__title', page)

  renderEmailStep()

  function renderEmailStep() {
    step = 'email'
    titleEl.textContent = t('signInToHopium')

    formWrap.innerHTML = `
      <div class="login-email-step">
        <input
          type="email"
          class="login-input"
          placeholder="${escapeHtml(t('authEmailPlaceholder'))}"
          autocomplete="email"
          aria-label="${escapeHtml(t('authEmailPlaceholder'))}"
          required
        />
        <button class="btn btn-primary login-submit">${t('authSendCode')}</button>
        <div class="login-error" role="alert" hidden></div>
      </div>
    `

    const input = $('.login-input', formWrap)
    const submitBtn = $('.login-submit', formWrap)
    const errorEl = $('.login-error', formWrap)

    input.focus()

    async function onSubmit() {
      email = input.value.trim()
      if (!email || !email.includes('@')) return

      submitBtn.disabled = true
      submitBtn.textContent = '...'
      errorEl.hidden = true

      try {
        await api.request('POST', '/v1/auth/email', { body: { email } })
        renderOtpStep()
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          errorEl.textContent = t('authTooManyAttempts')
        } else {
          errorEl.textContent = err.message || t('error')
        }
        errorEl.hidden = false
        submitBtn.disabled = false
        submitBtn.textContent = t('authSendCode')
      }
    }

    submitBtn.addEventListener('click', onSubmit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onSubmit()
    })
  }

  function renderOtpStep() {
    step = 'otp'
    titleEl.textContent = t('authCheckEmail')

    formWrap.innerHTML = `
      <div class="login-otp-step">
        <p class="login-otp-email text-secondary" id="otp-desc">${t('authCodeSentTo')} ${escapeHtml(email)}</p>
        <div class="login-otp-inputs" role="group" aria-label="Verification code" aria-describedby="otp-desc">
          ${Array.from({ length: OTP_LENGTH }, (_, i) => `
            <input
              type="text"
              class="login-otp-digit"
              maxlength="1"
              inputmode="numeric"
              pattern="[0-9]"
              autocomplete="one-time-code"
              aria-label="Digit ${i + 1} of ${OTP_LENGTH}"
              data-index="${i}"
            />
          `).join('')}
        </div>
        <div class="login-error" role="alert" hidden></div>
        <button class="login-back-btn text-secondary">${t('authDifferentEmail')}</button>
        <button class="login-resend-btn text-secondary" disabled>${t('authResend')}</button>
      </div>
    `

    const digits = formWrap.querySelectorAll('.login-otp-digit')
    const errorEl = $('.login-error', formWrap)
    const backBtn = $('.login-back-btn', formWrap)
    const resendBtn = $('.login-resend-btn', formWrap)

    digits[0].focus()

    // OTP input handling
    digits.forEach((digit, i) => {
      digit.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '')
        e.target.value = val.charAt(0)

        if (val && i < OTP_LENGTH - 1) {
          digits[i + 1].focus()
        }

        // Auto-submit when all digits filled
        const code = Array.from(digits).map(d => d.value).join('')
        if (code.length === OTP_LENGTH) {
          submitOtp(code)
        }
      })

      digit.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) {
          digits[i - 1].focus()
        }
      })

      // Handle paste
      digit.addEventListener('paste', (e) => {
        e.preventDefault()
        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
        pasted.split('').forEach((ch, j) => {
          if (digits[i + j]) digits[i + j].value = ch
        })
        const nextIdx = Math.min(i + pasted.length, OTP_LENGTH - 1)
        digits[nextIdx].focus()

        // Auto-submit if complete
        const code = Array.from(digits).map(d => d.value).join('')
        if (code.length === OTP_LENGTH) {
          submitOtp(code)
        }
      })
    })

    let submitting = false

    async function submitOtp(code) {
      if (submitting) return
      submitting = true
      errorEl.hidden = true

      try {
        const res = await api.request('POST', '/v1/auth/email/validate', {
          body: { email, code },
        })

        // Store auth data
        store.login(res)
        store.set({ email })

        // Fetch balance
        try {
          const balanceRes = await api.get('/v1/balance/', { size: 1 })
          if (balanceRes.balance != null) {
            store.set({ balance: balanceRes.balance })
          }
        } catch {
          // Non-critical
        }

        // Redirect
        router.navigate(redirect)
      } catch (err) {
        submitting = false
        if (err instanceof ApiError && err.status === 429) {
          errorEl.textContent = t('authTooManyAttempts')
        } else if (err instanceof ApiError && err.status === 401) {
          errorEl.textContent = t('authInvalidCode')
          // Shake + clear inputs
          const otpGroup = formWrap.querySelector('.login-otp-inputs')
          otpGroup.classList.add('login-otp-inputs--shake')
          setTimeout(() => otpGroup.classList.remove('login-otp-inputs--shake'), 500)
          digits.forEach(d => { d.value = '' })
          digits[0].focus()
        } else {
          errorEl.textContent = err.message || t('error')
        }
        errorEl.hidden = false
      }
    }

    // Back to email step
    backBtn.addEventListener('click', renderEmailStep)

    // Resend cooldown
    let cooldown = RESEND_COOLDOWN
    let activeTimer = null

    function startCooldown() {
      cooldown = RESEND_COOLDOWN
      resendBtn.disabled = true
      resendBtn.textContent = `${t('authResendIn')} ${cooldown}s`
      if (activeTimer) clearInterval(activeTimer)
      activeTimer = setInterval(() => {
        cooldown--
        if (cooldown <= 0) {
          clearInterval(activeTimer)
          activeTimer = null
          resendBtn.disabled = false
          resendBtn.textContent = t('authResend')
        } else {
          resendBtn.textContent = `${t('authResendIn')} ${cooldown}s`
        }
      }, 1000)
    }

    startCooldown()
    cleanups.push(() => { if (activeTimer) clearInterval(activeTimer) })

    resendBtn.addEventListener('click', async () => {
      if (resendBtn.disabled) return
      resendBtn.disabled = true
      try {
        await api.request('POST', '/v1/auth/email', { body: { email } })
        startCooldown()
      } catch {
        resendBtn.disabled = false
        resendBtn.textContent = t('authResend')
      }
    })
  }

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
