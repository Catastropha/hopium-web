import { html, $, escapeHtml } from '../utils/dom.js'
import { formatTon, formatTonCompact, formatOdds, formatPercent, formatTimeRemaining, formatNumber, formatSignedTon } from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { CATEGORY_COLORS, MIN_BET } from '../constants.js'
import { createOddsBar, updateOddsBar } from './odds-bar.js'
import { createDetailSkeleton } from './skeleton.js'
import { showToast } from './toast.js'
import { setBetMeta } from '../utils/seo.js'
import { shareBet } from './share-menu.js'

/**
 * Create the bet detail panel.
 * Fetches full bet data from the API and renders the interactive detail view.
 *
 * @param {string} betId
 * @returns {HTMLElement}
 */
export function createBetDetail(betId) {
  const wrapper = html`
    <div class="bet-detail" role="complementary" aria-label="${t('betDetails')}"></div>
  `

  // Show skeleton while loading
  const skeleton = createDetailSkeleton()
  wrapper.appendChild(skeleton)

  // Fetch and render
  loadBet(betId, wrapper)

  return wrapper
}

async function loadBet(betId, wrapper) {
  try {
    const bet = await api.get(`/v1/bet/${betId}`)
    setBetMeta(bet)
    wrapper.innerHTML = ''
    renderDetail(bet, wrapper)
  } catch (err) {
    wrapper.innerHTML = ''
    const errorEl = html`
      <div class="bet-detail__error">
        <p>${t('error')}</p>
        <button class="btn btn-secondary bet-detail__retry">${t('retry')}</button>
      </div>
    `
    errorEl.querySelector('.bet-detail__retry')?.addEventListener('click', () => {
      wrapper.innerHTML = ''
      wrapper.appendChild(createDetailSkeleton())
      loadBet(betId, wrapper)
    })
    wrapper.appendChild(errorEl)
  }
}

function renderDetail(bet, wrapper) {
  const title = localize(bet.title)
  const description = localize(bet.description) || ''
  const resolution = localize(bet.resolution_criteria) || ''
  const category = bet.category || ''
  const categoryColor = CATEGORY_COLORS[category] || 'var(--text-secondary)'
  const countdown = formatTimeRemaining(bet.resolution_date)
  const outcomes = bet.outcomes || []
  const isResolved = outcomes.some((o) => o.is_winner)

  // Image
  const imageHtml = bet.image_url
    ? `<img class="bet-detail__image" src="${escapeHtml(bet.image_url)}" alt="" loading="lazy" />`
    : ''

  // Resolved winner info
  let resolvedHtml = ''
  if (isResolved) {
    const winner = outcomes.find((o) => o.is_winner)
    const winnerLabel = winner ? escapeHtml(localize(winner.label)) : ''
    resolvedHtml = `
      <div class="bet-detail__resolved">
        <span class="bet-detail__resolved-badge">${winnerLabel} ${t('won')}</span>
      </div>
    `
  }

  // Outcome buttons
  const outcomeButtonsHtml = outcomes.map((outcome, i) => {
    const label = escapeHtml(localize(outcome.label))
    const pool = outcome.pool || 0
    const totalPool = outcomes.reduce((sum, o) => sum + (o.pool || 0), 0)
    const pct = totalPool > 0 ? Math.round((pool / totalPool) * 100) : 50
    const odds = outcome.odds ? formatOdds(outcome.odds) : ''
    const colorClass = i === 0 ? 'bet-detail__outcome--yes' : 'bet-detail__outcome--no'
    const isWinner = outcome.is_winner
    const winnerClass = isWinner ? 'bet-detail__outcome--winner' : ''
    const disabledAttr = isResolved ? 'disabled' : ''

    return `
      <button
        class="bet-detail__outcome ${colorClass} ${winnerClass}"
        data-outcome-id="${outcome.id}"
        data-outcome-index="${i}"
        ${disabledAttr}
      >
        <span class="bet-detail__outcome-label">${label}</span>
        <span class="bet-detail__outcome-pct">${pct}%</span>
        <span class="bet-detail__outcome-meta">${formatTonCompact(pool)} &middot; ${odds}</span>
      </button>
    `
  }).join('')

  // Balance display for stake section
  const balanceCents = store.get('balance') || 0
  const balanceHtml = store.isAuthenticated
    ? `<span class="bet-detail__balance text-secondary">${t('balance')}: ${formatTon(balanceCents)}</span>`
    : ''

  const el = html`
    <div class="bet-detail__inner">
      <div class="bet-detail__close-row">
        <button class="bet-detail__close" aria-label="${t('closeDetails')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      ${imageHtml}

      <span class="bet-detail__category" style="color:${categoryColor}">${escapeHtml(category)}</span>

      <h2 class="bet-detail__title">${escapeHtml(title)}</h2>

      <div class="bet-detail__meta">
        <span class="bet-detail__countdown">${escapeHtml(countdown)}</span>
        <span class="bet-detail__pool">${formatTonCompact(bet.total_pool)} ${t('pool')}</span>
        <button class="bet-detail__share" aria-label="${t('share')}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>${t('share')}</button>
      </div>

      ${resolvedHtml}

      <div class="bet-detail__bar-container"></div>

      ${description ? `<p class="bet-detail__description">${escapeHtml(description)}</p>` : ''}

      ${resolution ? `
        <div class="bet-detail__resolution">
          <span class="bet-detail__resolution-label">${t('resolution')}</span>
          <div class="bet-detail__resolution-box">${escapeHtml(resolution)}</div>
        </div>
      ` : ''}

      <div class="bet-detail__pick">
        <h3 class="bet-detail__pick-heading">${t('pickSide')}</h3>
        <div class="bet-detail__outcomes">
          ${outcomeButtonsHtml}
        </div>
      </div>

      <div class="bet-detail__stake" hidden>
        <h3 class="bet-detail__stake-heading">${t('howMuch')}</h3>
        <div class="bet-detail__balance-row">${balanceHtml}</div>
        <div class="bet-detail__stake-input-row">
          <span class="bet-detail__stake-currency">TON</span>
          <input
            type="number"
            class="bet-detail__stake-input"
            min="1"
            step="0.1"
            placeholder="1"
            aria-label="${t('stakeAmount')}"
            inputmode="decimal"
          />
          <button class="bet-detail__stake-max">${t('max')}</button>
        </div>
        <div class="bet-detail__quick-amounts">
          <button class="bet-detail__quick" data-amount="1000000000" aria-label="1 TON">1</button>
          <button class="bet-detail__quick" data-amount="2000000000" aria-label="2 TON">2</button>
          <button class="bet-detail__quick" data-amount="5000000000" aria-label="5 TON">5</button>
          <button class="bet-detail__quick" data-amount="10000000000" aria-label="10 TON">10</button>
        </div>
        <div class="bet-detail__actions">
          <button class="bet-detail__place-btn" disabled>
            <span class="bet-detail__place-label">${t('placeBet')}</span>
            <span class="bet-detail__place-payout" aria-live="polite"></span>
          </button>
        </div>
        <div class="bet-detail__insufficient" hidden>
          <span class="text-secondary">${t('insufficientBalance')}</span>
          <a href="/profile" data-link class="bet-detail__deposit-link text-secondary">${t('deposit')}</a>
        </div>
      </div>

      <div class="bet-detail__login-prompt" hidden></div>
    </div>
  `

  // Insert odds bar
  const barContainer = el.querySelector('.bet-detail__bar-container')
  const oddsBar = createOddsBar(outcomes)
  barContainer.appendChild(oddsBar)

  // Close button
  el.querySelector('.bet-detail__close').addEventListener('click', () => {
    store.set({ selectedBetId: null })
    window.dispatchEvent(new CustomEvent('hopium:detail-close'))
  })

  // Share button — opens social share menu
  const shareBtn = el.querySelector('.bet-detail__share')
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareBet(shareBtn, bet)
    })
  }

  // State for betting flow
  let selectedOutcomeId = null
  let selectedOutcomeIndex = null
  const stakeSection = el.querySelector('.bet-detail__stake')
  const loginPrompt = el.querySelector('.bet-detail__login-prompt')
  const stakeInput = el.querySelector('.bet-detail__stake-input')
  const maxBtn = el.querySelector('.bet-detail__stake-max')
  const placeBtn = el.querySelector('.bet-detail__place-btn')
  const placePayout = el.querySelector('.bet-detail__place-payout')
  const insufficientEl = el.querySelector('.bet-detail__insufficient')
  const balanceRow = el.querySelector('.bet-detail__balance-row')
  const outcomeButtons = el.querySelectorAll('.bet-detail__outcome')

  // Update balance display when store changes
  function updateBalanceDisplay() {
    if (!balanceRow) return
    const bal = store.get('balance') || 0
    if (store.isAuthenticated) {
      balanceRow.innerHTML = `<span class="bet-detail__balance text-secondary">${t('balance')}: ${formatTon(bal)}</span>`
    } else {
      balanceRow.innerHTML = ''
    }
  }

  // Show stake section after inline login succeeds
  function onLoginSuccess() {
    loginPrompt.hidden = true
    if (selectedOutcomeId) {
      stakeSection.hidden = false
      updatePlaceBtnColor(placeBtn, selectedOutcomeIndex)
      updateBalanceDisplay()
      stakeInput.focus()
    }
  }

  // Render the inline login flow inside the detail panel
  let authSubmitting = false

  function renderInlineLogin() {
    loginPrompt.innerHTML = `
      <p class="bet-detail__login-text">${t('loginRequired')}</p>
      <p class="text-secondary bet-detail__login-subtext">${t('loginInstructions')}</p>
      <div class="bet-detail__inline-auth">
        <input
          type="text"
          class="login-input bet-detail__auth-code"
          placeholder="ABC234"
          maxlength="6"
          autocomplete="off"
          spellcheck="false"
          aria-label="${escapeHtml(t('loginCodePlaceholder'))}"
        />
        <button class="btn btn-primary bet-detail__auth-submit">${t('loginVerify')}</button>
        <div class="login-error bet-detail__auth-error" role="alert" hidden></div>
      </div>
      <p class="bet-detail__login-subtext">${t('browseFreely')}</p>
    `

    const codeInput = loginPrompt.querySelector('.bet-detail__auth-code')
    const submitBtn = loginPrompt.querySelector('.bet-detail__auth-submit')
    const errorEl = loginPrompt.querySelector('.bet-detail__auth-error')

    codeInput.focus()

    // Auto-uppercase
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    })

    async function submit() {
      const code = codeInput.value.trim()
      if (code.length !== 6 || authSubmitting) return

      authSubmitting = true
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

        onLoginSuccess()
      } catch (err) {
        authSubmitting = false
        submitBtn.disabled = false
        submitBtn.textContent = t('loginVerify')

        if (err instanceof ApiError && err.status === 401) {
          errorEl.textContent = t('authInvalidCode')
          codeInput.value = ''
          codeInput.focus()
        } else if (err instanceof ApiError && err.status === 429) {
          errorEl.textContent = t('authTooManyAttempts')
        } else {
          errorEl.textContent = err.message || t('error')
        }
        errorEl.hidden = false
      }
    }

    submitBtn.addEventListener('click', submit)
    codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit() })
  }

  // Outcome selection
  if (!isResolved) {
    outcomeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const outcomeId = btn.dataset.outcomeId
        const outcomeIdx = parseInt(btn.dataset.outcomeIndex, 10)

        // If not authenticated, show inline login
        if (!store.isAuthenticated) {
          selectedOutcomeId = outcomeId
          selectedOutcomeIndex = outcomeIdx
          highlightOutcome(outcomeButtons, outcomeIdx)
          stakeSection.hidden = true
          loginPrompt.hidden = false
          renderInlineLogin()
          return
        }

        if (selectedOutcomeId === outcomeId) {
          // Deselect
          selectedOutcomeId = null
          selectedOutcomeIndex = null
          outcomeButtons.forEach((b) => b.classList.remove('bet-detail__outcome--selected', 'bet-detail__outcome--dimmed'))
          stakeSection.hidden = true
          loginPrompt.hidden = true
          return
        }

        selectedOutcomeId = outcomeId
        selectedOutcomeIndex = outcomeIdx
        highlightOutcome(outcomeButtons, outcomeIdx)

        // Show stake section
        stakeSection.hidden = false
        loginPrompt.hidden = true

        // Update place button color
        updatePlaceBtnColor(placeBtn, outcomeIdx)
        updateBalanceDisplay()

        stakeInput.focus()
      })
    })
  }

  // MAX button
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      const balance = store.get('balance') || 0
      stakeInput.value = (balance / 1_000_000_000)
      updatePayout()
    })
  }

  // Quick amount buttons (data-amount is in nanotons)
  el.querySelectorAll('.bet-detail__quick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nanotons = parseInt(btn.dataset.amount, 10)
      stakeInput.value = (nanotons / 1_000_000_000)
      updatePayout()
    })
  })

  // Live payout update
  if (stakeInput) {
    stakeInput.addEventListener('input', updatePayout)
  }

  function getAmountNanotons() {
    const ton = parseFloat(stakeInput.value) || 0
    return Math.round(ton * 1_000_000_000)
  }

  function updatePayout() {
    const amount = getAmountNanotons()
    const balance = store.get('balance') || 0
    const outcome = outcomes[selectedOutcomeIndex]
    const odds = outcome?.odds || 1

    const payout = Math.floor(amount * odds)
    if (placePayout) {
      placePayout.textContent = amount > 0 ? `→ ${formatTon(payout)}` : ''
    }

    // Enable/disable place button
    const isValid = amount >= MIN_BET && amount <= balance
    placeBtn.disabled = !isValid

    // Show insufficient balance message with deposit link
    const showInsufficient = amount >= MIN_BET && amount > balance
    if (insufficientEl) insufficientEl.hidden = !showInsufficient

    if (amount > 0 && amount < MIN_BET) {
      placeBtn.title = t('minBet')
    } else if (amount > balance) {
      placeBtn.title = t('insufficientBalance')
    } else {
      placeBtn.title = ''
    }
  }

  // Place Bet
  let isPlacing = false
  if (placeBtn) {
    placeBtn.addEventListener('click', async () => {
      if (isPlacing) return
      if (placeBtn.disabled) return

      isPlacing = true
      const amount = getAmountNanotons()
      if (!selectedOutcomeId || amount < MIN_BET) { isPlacing = false; return }

      placeBtn.disabled = true
      placeBtn.innerHTML = '<span class="load-more-spinner" style="width:16px;height:16px;border-width:2px;margin:0;display:inline-block;vertical-align:middle"></span>'

      try {
        const res = await api.post('/v1/position/', {
          bet_id: bet.id,
          outcome_id: selectedOutcomeId,
          amount,
        })

        // Success
        showToast({ message: `${formatTon(amount)} on ${localize(outcomes[selectedOutcomeIndex]?.label) || 'your pick'}. ${t('betSuccess')}`, type: 'success' })

        // Visual pulse on the selected outcome button
        const selectedBtn = outcomeButtons[selectedOutcomeIndex]
        if (selectedBtn) {
          selectedBtn.classList.add('bet-detail__outcome--pulse')
          setTimeout(() => selectedBtn.classList.remove('bet-detail__outcome--pulse'), 600)
        }

        // Update balance in store — prefer server-authoritative balance
        if (res.new_balance != null) {
          store.set({ balance: res.new_balance })
        } else {
          const currentBalance = store.get('balance') || 0
          store.set({ balance: currentBalance - amount })
        }

        updateBalanceDisplay()

        // Reload bet data to get updated odds
        try {
          const updated = await api.get(`/v1/bet/${bet.id}`)
          // Update odds bar
          if (updated.outcomes) {
            updateOddsBar(oddsBar, updated.outcomes)

            // Update outcome buttons with new data
            const totalPool = updated.outcomes.reduce((sum, oc) => sum + (oc.pool || 0), 0)
            updated.outcomes.forEach((o, i) => {
              const btn = outcomeButtons[i]
              if (!btn) return
              const pct = totalPool > 0 ? Math.round((o.pool / totalPool) * 100) : 50
              const pctEl = btn.querySelector('.bet-detail__outcome-pct')
              const metaEl = btn.querySelector('.bet-detail__outcome-meta')
              if (pctEl) pctEl.textContent = `${pct}%`
              if (metaEl) metaEl.textContent = `${formatTonCompact(o.pool)} · ${o.odds ? formatOdds(o.odds) : ''}`
            })
          }
        } catch {
          // Non-critical — odds refresh failed
        }

        // Reset stake input
        stakeInput.value = ''
        updatePayout()
        placeBtn.textContent = t('placeBet')
      } catch (err) {
        const message = err instanceof ApiError ? err.message : t('error')
        showToast({ message, type: 'error' })
        placeBtn.disabled = false
        placeBtn.textContent = t('placeBet')
      } finally {
        isPlacing = false
      }
    })
  }

  // User positions display for resolved bets
  if (isResolved && bet.user_positions && bet.user_positions.length > 0) {
    // Check if user won
    const userWon = bet.user_positions.some(pos => {
      const outcome = outcomes.find(o => o.id === pos.outcome_id)
      return outcome?.is_winner && pos.payout > 0
    })

    const positionsHtml = bet.user_positions.map(pos => {
      const outcome = outcomes.find(o => o.id === pos.outcome_id)
      const label = outcome ? localize(outcome.label) : ''
      const payoutText = pos.payout != null
        ? (pos.payout > 0
          ? `<span class="text-yes">${t('won')} ${formatSignedTon(pos.payout)}</span>`
          : `<span class="text-no">${t('lost')}</span>`)
        : ''
      return `<div class="bet-detail__user-pos">${escapeHtml(label)}: ${formatTon(pos.amount)} ${payoutText}</div>`
    }).join('')

    const winClass = userWon ? 'bet-detail__user-payout--win' : ''
    const payoutEl = html`
      <div class="bet-detail__user-payout ${winClass}">${positionsHtml}</div>
    `
    el.querySelector('.bet-detail__pick')?.after(payoutEl)

    // Win celebration — toast + visual glow
    if (userWon) {
      const totalWon = bet.user_positions.reduce((sum, pos) => {
        return sum + (pos.payout > 0 ? pos.payout : 0)
      }, 0)
      requestAnimationFrame(() => {
        showToast({ message: `${t('won')} ${formatTon(totalWon)}`, type: 'success' })
      })
    }

    // Hide betting controls for resolved bets
    stakeSection.hidden = true
  }

  // Keyboard shortcut integration (y/n)
  function handleKeyShortcut(e) {
    if (isResolved) return
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    if (e.key === 'y' && outcomeButtons[0] && !outcomeButtons[0].disabled) {
      outcomeButtons[0].click()
    } else if (e.key === 'n' && outcomeButtons[1] && !outcomeButtons[1].disabled) {
      outcomeButtons[1].click()
    }
  }

  window.addEventListener('keydown', handleKeyShortcut)

  // Cleanup listener when detail is removed
  const observer = new MutationObserver(() => {
    if (!wrapper.contains(el)) {
      window.removeEventListener('keydown', handleKeyShortcut)
      observer.disconnect()
    }
  })
  observer.observe(wrapper, { childList: true })

  wrapper.appendChild(el)
}

function highlightOutcome(buttons, selectedIndex) {
  buttons.forEach((btn, i) => {
    if (i === selectedIndex) {
      btn.classList.add('bet-detail__outcome--selected')
      btn.classList.remove('bet-detail__outcome--dimmed')
    } else {
      btn.classList.remove('bet-detail__outcome--selected')
      btn.classList.add('bet-detail__outcome--dimmed')
    }
  })
}

function updatePlaceBtnColor(btn, outcomeIndex) {
  btn.classList.remove('bet-detail__place-btn--yes', 'bet-detail__place-btn--no')
  btn.classList.add(outcomeIndex === 0 ? 'bet-detail__place-btn--yes' : 'bet-detail__place-btn--no')
}
