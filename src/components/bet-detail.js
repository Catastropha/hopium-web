import { html, $, escapeHtml } from '../utils/dom.js'
import { formatStars, formatStarsCompact, formatOdds, formatPercent, formatTimeRemaining, formatNumber, formatSignedStars } from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { CATEGORY_COLORS, MIN_BET } from '../constants.js'
import { createOddsBar, updateOddsBar } from './odds-bar.js'
import { createDetailSkeleton } from './skeleton.js'
import { showToast } from './toast.js'

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
        <span class="bet-detail__outcome-meta">${formatStarsCompact(pool)} &middot; ${odds}</span>
      </button>
    `
  }).join('')

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
        <span class="bet-detail__pool">${formatStarsCompact(bet.total_pool)} ${t('pool')}</span>
        ${store.isAuthenticated ? `<button class="bet-detail__share" aria-label="${t('share')}">${t('share')}</button>` : ''}
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
        <div class="bet-detail__stake-input-row">
          <span class="bet-detail__stake-star">&#11088;</span>
          <input
            type="number"
            class="bet-detail__stake-input"
            min="${MIN_BET}"
            step="1"
            placeholder="${MIN_BET}"
            aria-label="${t('stakeAmount')}"
            inputmode="numeric"
          />
          <button class="bet-detail__stake-max">${t('max')}</button>
        </div>
        <div class="bet-detail__quick-amounts">
          <button class="bet-detail__quick" data-amount="10">10</button>
          <button class="bet-detail__quick" data-amount="50">50</button>
          <button class="bet-detail__quick" data-amount="100">100</button>
          <button class="bet-detail__quick" data-amount="500">500</button>
        </div>
        <div class="bet-detail__payout">
          <span class="bet-detail__payout-label">${t('potentialPayout')}</span>
          <span class="bet-detail__payout-value">&#11088;&nbsp;0</span>
        </div>
        <button class="bet-detail__place-btn" disabled>
          ${t('placeBet')}
        </button>
      </div>

      <div class="bet-detail__login-prompt" hidden>
        <p class="bet-detail__login-text">${t('loginRequired')}</p>
        <a href="/login" data-link class="btn btn-primary bet-detail__login-btn">${t('continueWith')}</a>
        <p class="bet-detail__login-subtext">${t('browseFreely')}</p>
      </div>
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

  // Share button (POST /v1/share/)
  const shareBtn = el.querySelector('.bet-detail__share')
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        const res = await api.post('/v1/share/', { type: 'bet', reference_id: bet.id })
        if (res.share_url) {
          await navigator.clipboard.writeText(res.share_url)
          showToast({ message: t('copied'), type: 'success' })
        }
      } catch {
        // Fallback: copy current URL
        await navigator.clipboard.writeText(window.location.href).catch(() => {})
        showToast({ message: t('copied'), type: 'success' })
      }
    })
  }

  // State for betting flow
  let selectedOutcomeId = null
  let selectedOutcomeIndex = null
  const stakeSection = el.querySelector('.bet-detail__stake')
  const loginPrompt = el.querySelector('.bet-detail__login-prompt')
  const stakeInput = el.querySelector('.bet-detail__stake-input')
  const maxBtn = el.querySelector('.bet-detail__stake-max')
  const payoutValue = el.querySelector('.bet-detail__payout-value')
  const placeBtn = el.querySelector('.bet-detail__place-btn')
  const outcomeButtons = el.querySelectorAll('.bet-detail__outcome')

  // Outcome selection
  if (!isResolved) {
    outcomeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const outcomeId = btn.dataset.outcomeId
        const outcomeIdx = parseInt(btn.dataset.outcomeIndex, 10)

        // If not authenticated, show login prompt
        if (!store.isAuthenticated) {
          selectedOutcomeId = outcomeId
          selectedOutcomeIndex = outcomeIdx
          highlightOutcome(outcomeButtons, outcomeIdx)
          stakeSection.hidden = true
          loginPrompt.hidden = false
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

        stakeInput.focus()
      })
    })
  }

  // MAX button
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      const balance = store.get('balance') || 0
      stakeInput.value = balance
      updatePayout()
    })
  }

  // Quick amount buttons
  el.querySelectorAll('.bet-detail__quick').forEach((btn) => {
    btn.addEventListener('click', () => {
      stakeInput.value = btn.dataset.amount
      updatePayout()
    })
  })

  // Live payout update
  if (stakeInput) {
    stakeInput.addEventListener('input', updatePayout)
  }

  function updatePayout() {
    const amount = Math.max(0, parseInt(stakeInput.value, 10) || 0)
    const balance = store.get('balance') || 0
    const outcome = outcomes[selectedOutcomeIndex]
    const odds = outcome?.odds || 1

    const payout = Math.floor(amount * odds)
    payoutValue.textContent = `\u2B50\u00A0${formatNumber(payout)}`

    // Enable/disable place button
    const isValid = amount >= MIN_BET && amount <= balance
    placeBtn.disabled = !isValid

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
      const amount = Math.max(0, parseInt(stakeInput.value, 10) || 0)
      if (!selectedOutcomeId || amount < MIN_BET) { isPlacing = false; return }

      placeBtn.disabled = true
      placeBtn.textContent = '...'

      try {
        const res = await api.post('/v1/position/', {
          bet_id: bet.id,
          outcome_id: selectedOutcomeId,
          amount,
        })

        // Success
        showToast({ message: `${formatStars(amount)} on ${localize(outcomes[selectedOutcomeIndex]?.label) || 'your pick'}. ${t('betSuccess')}`, type: 'success' })

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
              if (metaEl) metaEl.textContent = `${formatStarsCompact(o.pool)} · ${o.odds ? formatOdds(o.odds) : ''}`
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
    const positionsHtml = bet.user_positions.map(pos => {
      const outcome = outcomes.find(o => o.id === pos.outcome_id)
      const label = outcome ? localize(outcome.label) : ''
      const payoutText = pos.payout != null
        ? (pos.payout > 0
          ? `<span class="text-yes">${t('won')} ${formatSignedStars(pos.payout)}</span>`
          : `<span class="text-no">${t('lost')}</span>`)
        : ''
      return `<div class="bet-detail__user-pos">${escapeHtml(label)}: ${formatStars(pos.amount)} ${payoutText}</div>`
    }).join('')

    const payoutEl = html`
      <div class="bet-detail__user-payout">${positionsHtml}</div>
    `
    el.querySelector('.bet-detail__pick')?.after(payoutEl)

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
