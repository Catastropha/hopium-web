import { html, $, $$, mount, escapeHtml } from '../utils/dom.js'
import {
  formatStars, formatNumber, formatSignedStars, formatDate,
} from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'

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
  return `
    <div class="balance-card">
      <div class="balance-card__label text-secondary">${t('balance')}</div>
      <div class="balance-card__value">${formatStars(balance != null ? balance : 0)}</div>
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
      <h4 class="balance-flow__title">${t('depositVia')}</h4>
      <div class="balance-flow__input-wrap">
        <span class="balance-flow__icon">&#11088;</span>
        <input type="number" class="balance-flow__input" min="1" placeholder="100" aria-label="${t('depositAmount')}" />
      </div>
      <div class="balance-flow__quick">
        <button class="stake-quick" data-amount="100">100</button>
        <button class="stake-quick" data-amount="500">500</button>
        <button class="stake-quick" data-amount="1000">1000</button>
      </div>
      <button class="btn btn-primary balance-flow__confirm">${t('deposit')}</button>
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
      <h4 class="balance-flow__title">${t('withdrawTo')}</h4>
      <div class="balance-flow__input-wrap">
        <span class="balance-flow__icon">&#11088;</span>
        <input type="number" class="balance-flow__input" min="1" max="${balance || 0}" placeholder="50" aria-label="${t('withdrawAmount')}" />
      </div>
      <button class="btn btn-primary balance-flow__confirm">${t('withdraw')}</button>
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
      ? `+${formatStars(tx.amount)}`
      : `-${formatStars(Math.abs(tx.amount))}`

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
  const txList = $('.tx-list', page)
  const txFooter = $('.tx-footer', page)

  // Render balance card
  function renderBalance() {
    balanceWrap.innerHTML = renderBalanceCard(balance)
  }

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
      const amount = Math.max(0, parseInt(input.value, 10) || 0)
      if (amount < 1) return

      confirmBtn.disabled = true
      confirmBtn.textContent = '...'
      errorEl.hidden = true
      messageEl.hidden = true

      try {
        const res = await api.post('/v1/balance/deposit', { amount })

        if (res.invoice_url) {
          window.open(res.invoice_url, '_blank')
        }

        messageEl.textContent = t('depositSuccess')
        messageEl.hidden = false
        confirmBtn.textContent = t('deposit')
        confirmBtn.disabled = false
      } catch (err) {
        // Error-code-specific messages per spec
        const msg = err instanceof ApiError && err.code === 'deposit-1'
          ? t('paymentUnavailable')
          : (err.message || t('error'))
        errorEl.textContent = msg
        errorEl.hidden = false
        confirmBtn.textContent = t('deposit')
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
      const amount = Math.max(0, parseInt(input.value, 10) || 0)
      if (amount < 1 || amount > (store.get('balance') || 0)) return

      confirmBtn.disabled = true
      confirmBtn.textContent = '...'
      errorEl.hidden = true

      try {
        const res = await api.post('/v1/balance/withdraw', { amount })

        if (res.new_balance != null) {
          balance = res.new_balance
          store.set({ balance })
          renderBalance()
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
