import { html, $, $$, mount, escapeHtml } from '../utils/dom.js'
import {
  formatDollars, formatNumber, formatSignedDollars, formatDate,
} from '../utils/format.js'
import { MIN_DEPOSIT, MIN_WITHDRAWAL } from '../constants.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { showToast } from '../components/toast.js'

/**
 * Transaction type config: icon SVG, color class, label.
 */
function getTxTypes() {
  return {
    deposit: {
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
      colorClass: 'text-yes',
      label: t('txDeposit'),
    },
    bet_placed: {
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
      colorClass: 'text-no',
      label: t('txBetPlaced'),
    },
    payout: {
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><path d="M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M12 16v2"/><path d="M8 22h8"/></svg>`,
      colorClass: 'text-yes',
      label: t('txPayout'),
    },
    withdrawal: {
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
      colorClass: 'text-no',
      label: t('txWithdrawal'),
    },
  }
}

/**
 * Render the login prompt for unauthenticated users.
 */
function renderLoginPrompt() {
  return `
    <div class="page-empty page-empty--login">
      <h2>${t('loginRequired')}</h2>
      <p class="text-secondary">${t('browseFreely')}</p>
      <a href="/login?redirect=/profile" data-link class="btn btn-primary">${t('continueWith')}</a>
    </div>
  `
}

/**
 * Render the balance card.
 */
function renderBalanceCard(balance) {
  const bal = balance != null ? balance : 0
  const hint = bal === 0 ? `<div class="balance-card__hint text-secondary">${t('addFundsToStart')}</div>` : ''
  return `
    <div class="balance-card">
      <div class="balance-card__label text-secondary">${t('balance')}</div>
      <div class="balance-card__value">${formatDollars(bal)}</div>
      ${hint}
      <div class="balance-card__actions">
        <button class="btn btn-primary balance-deposit-btn">${t('deposit')}</button>
        <button class="btn btn-secondary balance-withdraw-btn">${t('withdraw')}</button>
      </div>
    </div>
  `
}

/**
 * Render deposit inline form.
 */
function renderDepositForm() {
  return `
    <div class="balance-flow balance-flow--deposit">
      <h4 class="balance-flow__title" id="deposit-title">${t('depositTitle')}</h4>
      <div class="balance-flow__input-wrap">
        <span class="balance-flow__icon">$</span>
        <input type="number" class="balance-flow__input" min="1" step="0.01" placeholder="10.00" aria-labelledby="deposit-title" />
      </div>
      <div class="balance-flow__quick">
        <button class="stake-quick" data-amount="5">$5</button>
        <button class="stake-quick" data-amount="10">$10</button>
        <button class="stake-quick" data-amount="25">$25</button>
        <button class="stake-quick" data-amount="50">$50</button>
      </div>
      <button class="btn btn-primary balance-flow__confirm">${t('depositContinue')}</button>
      <p class="balance-flow__note text-secondary">${t('depositCardNote')}<br>${t('depositFeeNote')}</p>
      <div class="balance-flow__error" role="alert" hidden></div>
      <div class="balance-flow__message" hidden></div>
    </div>
  `
}

/**
 * Render withdraw inline form.
 */
function renderWithdrawForm(balance) {
  return `
    <div class="balance-flow balance-flow--withdraw">
      <h4 class="balance-flow__title" id="withdraw-title">${t('withdrawTitle')}</h4>
      <div class="balance-flow__input-wrap">
        <span class="balance-flow__icon">$</span>
        <input type="number" class="balance-flow__input" min="10" step="0.01" placeholder="50.00" aria-labelledby="withdraw-title" />
      </div>
      <p class="balance-flow__note text-secondary">${t('withdrawAvailable')}: ${formatDollars(balance || 0)}<br>${t('withdrawMinimum')}</p>
      <button class="btn btn-primary balance-flow__confirm">${t('withdraw')}</button>
      <p class="balance-flow__note text-secondary">${t('withdrawRedirectNote')}<br>${t('withdrawArrivalNote')}</p>
      <div class="balance-flow__error" role="alert" hidden></div>
    </div>
  `
}

/**
 * Render transaction history table.
 */
function renderTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return `<div class="page-empty"><p class="text-secondary">${t('noTransactions')}</p></div>`
  }

  const rows = transactions.map((tx) => {
    const txTypes = getTxTypes()
    const config = txTypes[tx.type] || txTypes.deposit
    const amountClass = tx.amount >= 0 ? 'text-yes' : 'text-no'
    const amountStr = tx.amount >= 0
      ? `+${formatDollars(tx.amount)}`
      : `-${formatDollars(Math.abs(tx.amount))}`

    return `
      <tr class="tx-row">
        <td class="tx-cell tx-cell--date text-secondary">${formatDate(tx.created_at)}</td>
        <td class="tx-cell tx-cell--type">
          <span class="tx-icon ${config.colorClass}">${config.icon}</span>
          <span>${escapeHtml(config.label)}</span>
        </td>
        <td class="tx-cell tx-cell--amount ${amountClass}">${amountStr}</td>
      </tr>
    `
  }).join('')

  return `
    <table class="tx-table">
      <tbody>${rows}</tbody>
    </table>
  `
}

/**
 * Profile / Balance page. Auth required.
 */
export async function profilePage({ params, query, container }) {
  const cleanups = []

  // Auth check
  if (!store.isAuthenticated) {
    mount(container, renderLoginPrompt())
    return () => {}
  }

  let balance = store.get('balance')
  let transactions = []
  let cursor = null
  let loading = false
  let hasMore = true
  let activeFlow = null // 'deposit' | 'withdraw' | null

  // Build page shell
  const page = html`
    <div class="page page--profile">
      <div class="profile-content">
        <div class="balance-card-wrap"></div>
        <div class="balance-flow-wrap"></div>
        <div class="email-connect-wrap"></div>
        <div class="tx-section">
          <h3 class="tx-section__title">${t('transactions')}</h3>
          <div class="tx-list">
            <div class="skeleton skeleton--text"></div>
            <div class="skeleton skeleton--text"></div>
            <div class="skeleton skeleton--text"></div>
          </div>
          <div class="tx-footer"></div>
        </div>
      </div>
    </div>
  `

  mount(container, page)

  const balanceWrap = $('.balance-card-wrap', page)
  const flowWrap = $('.balance-flow-wrap', page)
  const emailWrap = $('.email-connect-wrap', page)
  const txList = $('.tx-list', page)
  const txFooter = $('.tx-footer', page)

  // Render balance card
  function renderBalance() {
    balanceWrap.innerHTML = renderBalanceCard(balance)
  }

  // Email connect section
  function renderEmailConnect() {
    const email = store.get('email')
    if (email) {
      emailWrap.innerHTML = `
        <div class="email-section">
          <span class="email-section__label text-secondary">${t('profileEmail')}</span>
          <span class="email-section__value">${escapeHtml(email)}</span>
        </div>
      `
    } else {
      emailWrap.innerHTML = `
        <div class="email-section">
          <span class="email-section__label text-secondary">${t('profileEmail')}</span>
          <span class="email-section__value text-secondary">${t('profileEmailNotConnected')}</span>
          <button class="btn btn-secondary email-connect-btn">${t('profileConnectEmail')}</button>
        </div>
      `
      const connectBtn = $('.email-connect-btn', emailWrap)
      if (connectBtn) {
        connectBtn.addEventListener('click', startEmailConnect)
      }
    }
  }

  let connectEmail = '' // tracks email during connect flow

  function startEmailConnect() {
    emailWrap.innerHTML = `
      <div class="email-section">
        <span class="email-section__label text-secondary">${t('profileEmail')}</span>
        <div class="email-connect-flow">
          <input type="email" class="login-input email-connect-input" placeholder="${escapeHtml(t('authEmailPlaceholder'))}" />
          <div class="email-connect-actions">
            <button class="btn btn-primary email-connect-send">${t('authSendCode')}</button>
            <button class="btn btn-secondary email-connect-cancel">${t('close')}</button>
          </div>
          <div class="login-error email-connect-error" role="alert" hidden></div>
        </div>
      </div>
    `
    const input = $('.email-connect-input', emailWrap)
    const sendBtn = $('.email-connect-send', emailWrap)
    const cancelBtn = $('.email-connect-cancel', emailWrap)
    const errorEl = $('.email-connect-error', emailWrap)
    input.focus()

    sendBtn.addEventListener('click', () => sendConnectCode(input, sendBtn, errorEl))
    cancelBtn.addEventListener('click', renderEmailConnect)
  }

  async function sendConnectCode(input, sendBtn, errorEl) {
    connectEmail = input.value.trim()
    if (!connectEmail || !connectEmail.includes('@')) return

    sendBtn.disabled = true
    sendBtn.textContent = '...'
    errorEl.hidden = true

    try {
      await api.request('POST', '/v1/auth/email', { body: { email: connectEmail } })
      showConnectCodeStep()
    } catch (err) {
      errorEl.textContent = err.message || t('error')
      errorEl.hidden = false
      sendBtn.disabled = false
      sendBtn.textContent = t('authSendCode')
    }
  }

  function showConnectCodeStep() {
    emailWrap.innerHTML = `
      <div class="email-section">
        <span class="email-section__label text-secondary">${t('profileEmail')}</span>
        <div class="email-connect-flow">
          <p class="text-secondary">${t('authCodeSentTo')} ${escapeHtml(connectEmail)}</p>
          <input type="text" class="login-input email-connect-code" placeholder="000000" maxlength="6" inputmode="numeric" />
          <button class="btn btn-primary email-connect-verify">${t('profileConnectEmail')}</button>
          <div class="login-error email-connect-error" role="alert" hidden></div>
        </div>
      </div>
    `
    const codeInput = $('.email-connect-code', emailWrap)
    const verifyBtn = $('.email-connect-verify', emailWrap)
    const verifyError = $('.email-connect-error', emailWrap)
    codeInput.focus()

    verifyBtn.addEventListener('click', () => verifyConnectCode(codeInput, verifyBtn, verifyError))
  }

  async function verifyConnectCode(codeInput, verifyBtn, verifyError) {
    const code = codeInput.value.trim()
    if (code.length !== 6) return

    verifyBtn.disabled = true
    verifyBtn.textContent = '...'
    verifyError.hidden = true

    try {
      await api.post('/v1/auth/email/connect', { email: connectEmail, code })
      store.set({ email: connectEmail })
      showToast({ message: t('profileEmailConnected'), type: 'success' })
      renderEmailConnect()
    } catch (err) {
      verifyError.textContent = err.message || t('error')
      verifyError.hidden = false
      verifyBtn.disabled = false
      verifyBtn.textContent = t('profileConnectEmail')
    }
  }

  renderEmailConnect()

  // Fetch balance and transactions
  async function fetchTransactions(append = false) {
    if (loading) return
    loading = true

    if (!append) {
      txList.innerHTML = `
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text"></div>
      `
      cursor = null
      transactions = []
    } else {
      txFooter.innerHTML = '<div class="load-more-spinner"></div>'
    }

    try {
      const fetchParams = { size: 20 }
      if (cursor) fetchParams.prev = cursor

      const res = await api.get('/v1/balance/', fetchParams)
      balance = res.balance
      store.set({ balance })
      renderBalance()

      const newTx = res.items || []
      cursor = res.prev || null
      hasMore = cursor !== null

      if (!append) {
        transactions = newTx
      } else {
        transactions = [...transactions, ...newTx]
      }

      txList.innerHTML = renderTransactions(transactions)

      if (hasMore) {
        txFooter.innerHTML = `<button class="btn btn-secondary load-more-btn">${t('loadMore')}</button>`
      } else {
        txFooter.innerHTML = ''
      }
    } catch (err) {
      if (!append) {
        txList.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('error')}</p></div>`
      }
    } finally {
      loading = false
    }
  }

  // Toggle deposit/withdraw flow
  function showFlow(type) {
    if (activeFlow === type) {
      activeFlow = null
      flowWrap.innerHTML = ''
      return
    }

    activeFlow = type

    if (type === 'deposit') {
      flowWrap.innerHTML = renderDepositForm()
      setupDepositFlow()
    } else {
      flowWrap.innerHTML = renderWithdrawForm(balance)
      setupWithdrawFlow()
    }
  }

  // Deposit flow
  function setupDepositFlow() {
    const input = $('.balance-flow__input', flowWrap)
    const confirmBtn = $('.balance-flow__confirm', flowWrap)
    const errorEl = $('.balance-flow__error', flowWrap)
    const messageEl = $('.balance-flow__message', flowWrap)

    // Quick amount buttons
    function onQuickClick(e) {
      const btn = e.target.closest('.stake-quick')
      if (btn) {
        input.value = btn.dataset.amount
      }
    }
    flowWrap.addEventListener('click', onQuickClick)
    cleanups.push(() => flowWrap.removeEventListener('click', onQuickClick))

    // Confirm deposit
    async function onConfirm() {
      const dollars = parseFloat(input.value) || 0
      const amount = Math.round(dollars * 100) // convert to cents
      if (amount < MIN_DEPOSIT) {
        errorEl.textContent = t('depositMinimum')
        errorEl.hidden = false
        return
      }

      confirmBtn.disabled = true
      confirmBtn.textContent = '...'
      errorEl.hidden = true
      messageEl.hidden = true

      try {
        const res = await api.post('/v1/balance/deposit', { amount })

        if (res.widget_config) {
          // Open Onramper widget
          const { createOnramperWidget } = await import('../components/onramper-widget.js')
          const modal = createOnramperWidget(res.widget_config)
          document.body.appendChild(modal)
        }

        messageEl.textContent = t('depositSuccess')
        messageEl.hidden = false
        confirmBtn.textContent = t('depositContinue')
        confirmBtn.disabled = false
      } catch (err) {
        // Error-code-specific messages per spec
        const msg = err instanceof ApiError && err.code === 'deposit-1'
          ? t('paymentUnavailable')
          : (err.message || t('error'))
        errorEl.textContent = msg
        errorEl.hidden = false
        confirmBtn.textContent = t('depositContinue')
        confirmBtn.disabled = false
      }
    }

    confirmBtn.addEventListener('click', onConfirm)
    cleanups.push(() => confirmBtn.removeEventListener('click', onConfirm))
  }

  // Withdraw flow
  function setupWithdrawFlow() {
    const input = $('.balance-flow__input', flowWrap)
    const confirmBtn = $('.balance-flow__confirm', flowWrap)
    const errorEl = $('.balance-flow__error', flowWrap)

    async function onConfirm() {
      const dollars = parseFloat(input.value) || 0
      const amount = Math.round(dollars * 100) // convert to cents
      if (amount < MIN_WITHDRAWAL) {
        errorEl.textContent = t('withdrawMinimum')
        errorEl.hidden = false
        return
      }
      if (amount > (store.get('balance') || 0)) {
        errorEl.textContent = t('withdrawInsufficient')
        errorEl.hidden = false
        return
      }

      confirmBtn.disabled = true
      confirmBtn.textContent = '...'
      errorEl.hidden = true

      try {
        const res = await api.post('/v1/balance/withdraw', { amount })

        // Open MoonPay widget URL
        if (res.moonpay_widget_url) {
          window.open(res.moonpay_widget_url, '_blank')
        }

        // Show success, close flow
        activeFlow = null
        flowWrap.innerHTML = `<div class="balance-flow__success text-yes">${t('withdrawSuccess')}</div>`
        setTimeout(() => {
          flowWrap.innerHTML = ''
        }, 3000)

        // Refresh transactions
        fetchTransactions(false)
      } catch (err) {
        // Error-code-specific messages per spec
        const ERROR_MSGS = {
          'withdraw-2': t('withdrawNoDeposit'),
          'withdraw-3': t('withdrawInsufficient'),
          'withdraw-4': t('withdrawFailed'),
        }
        const msg = err instanceof ApiError && ERROR_MSGS[err.code]
          ? ERROR_MSGS[err.code]
          : (err.message || t('error'))
        errorEl.textContent = msg
        errorEl.hidden = false
        confirmBtn.textContent = t('withdraw')
        confirmBtn.disabled = false
      }
    }

    confirmBtn.addEventListener('click', onConfirm)
    cleanups.push(() => confirmBtn.removeEventListener('click', onConfirm))
  }

  // Event: deposit button click
  function onBalanceAction(e) {
    if (e.target.closest('.balance-deposit-btn')) {
      showFlow('deposit')
    } else if (e.target.closest('.balance-withdraw-btn')) {
      showFlow('withdraw')
    }
  }
  balanceWrap.addEventListener('click', onBalanceAction)
  cleanups.push(() => balanceWrap.removeEventListener('click', onBalanceAction))

  // Event: load more transactions
  function onTxFooterClick(e) {
    const btn = e.target.closest('.load-more-btn')
    if (btn) fetchTransactions(true)
  }
  txFooter.addEventListener('click', onTxFooterClick)
  cleanups.push(() => txFooter.removeEventListener('click', onTxFooterClick))

  // Listen for balance changes
  const unsub = store.on('balance', (val) => {
    balance = val
    renderBalance()
  })
  cleanups.push(unsub)

  // Listen for auth changes
  const unsubAuth = store.on('token', () => {
    if (!store.isAuthenticated) {
      mount(container, renderLoginPrompt())
    }
  })
  cleanups.push(unsubAuth)

  // Initial render + fetch
  renderBalance()
  await fetchTransactions(false)

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
