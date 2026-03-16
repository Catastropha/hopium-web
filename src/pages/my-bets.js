import { html, $, $$, mount, escapeHtml } from '../utils/dom.js'
import {
  formatStars, formatStarsCompact, formatSignedStars,
  formatTimeRemaining, formatNumber,
} from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'
import { CATEGORY_COLORS } from '../constants.js'
import { createOddsBar } from '../components/odds-bar.js'
import { createBetDetail } from '../components/bet-detail.js'
import { renderBetCard, renderSkeletons } from './home.js'

/**
 * Render the login prompt for unauthenticated users.
 */
function renderLoginPrompt() {
  return `
    <div class="page-empty page-empty--login">
      <h2>${t('loginRequired')}</h2>
      <p class="text-secondary">${t('browseFreely')}</p>
      <a href="/login?redirect=/my-bets" data-link class="btn btn-primary">${t('continueWith')}</a>
    </div>
  `
}

/**
 * Render the P&L summary card.
 */
function renderPnlCard(bets) {
  let staked = 0
  let returned = 0
  let pending = 0

  bets.forEach((bet) => {
    const userTotal = bet.user_position_total || 0
    staked += userTotal

    if (bet.status === 'resolved' && bet.outcomes) {
      const winningOutcome = bet.outcomes.find((o) => o.is_winner === true)
      if (winningOutcome) {
        // Rough calculation: if the user bet on the winner, they won.
        // Without full position data on list endpoint, this is an approximation.
        returned += userTotal
      }
    } else {
      pending += userTotal
    }
  })

  const pnl = returned - staked + pending
  const pnlClass = pnl >= 0 ? 'text-yes' : 'text-no'

  return `
    <div class="pnl-card">
      <div class="pnl-card__label text-secondary">${t('totalPnL')}</div>
      <div class="pnl-card__value ${pnlClass}">${formatSignedStars(pnl)}</div>
      <div class="pnl-card__breakdown">
        <div class="pnl-card__item">
          <span class="text-secondary">${t('staked')}</span>
          <span>${formatStars(staked)}</span>
        </div>
        <div class="pnl-card__item">
          <span class="text-secondary">${t('returned')}</span>
          <span>${formatStars(returned)}</span>
        </div>
        <div class="pnl-card__item">
          <span class="text-secondary">${t('pending')}</span>
          <span>${formatStars(pending)}</span>
        </div>
      </div>
    </div>
  `
}

/**
 * Render the segmented control (Active / Resolved tabs).
 */
function renderTabs(activeTab, activeCt, resolvedCt) {
  return `
    <div class="segmented-control" role="tablist">
      <button
        class="segmented-control__btn ${activeTab === 'active' ? 'segmented-control__btn--active' : ''}"
        role="tab"
        aria-selected="${activeTab === 'active'}"
        data-tab="active"
      >${t('active')} (${activeCt})</button>
      <button
        class="segmented-control__btn ${activeTab === 'resolved' ? 'segmented-control__btn--active' : ''}"
        role="tab"
        aria-selected="${activeTab === 'resolved'}"
        data-tab="resolved"
      >${t('resolved')} (${resolvedCt})</button>
    </div>
  `
}

/**
 * My Bets page — shows the user's bets with P&L summary.
 */
export async function myBetsPage({ params, query, container, detailPanel }) {
  const cleanups = []

  // Auth check
  if (!store.isAuthenticated) {
    mount(container, renderLoginPrompt())
    return () => {}
  }

  let activeTab = 'active'
  let allBets = []
  let cursor = null
  let loading = false
  let hasMore = true
  let fetchDepth = 0

  // Build page shell
  const page = html`
    <div class="page page--my-bets">
      <div class="pnl-card-wrap"></div>
      <div class="tabs-wrap"></div>
      <div class="bet-list" role="list" aria-live="polite" aria-label="${t('yourBets')}">
        ${renderSkeletons(3)}
      </div>
      <div class="bet-list__footer"></div>
    </div>
  `

  mount(container, page)

  const pnlWrap = $('.pnl-card-wrap', page)
  const tabsWrap = $('.tabs-wrap', page)
  const betList = $('.bet-list', page)
  const footer = $('.bet-list__footer', page)

  // Fetch bets where user has positions
  async function fetchBets(append = false) {
    if (loading) return
    loading = true

    if (!append) {
      betList.innerHTML = renderSkeletons(3)
      cursor = null
      allBets = []
    } else {
      footer.innerHTML = '<div class="load-more-spinner"></div>'
    }

    try {
      const fetchParams = { size: 50 }
      if (cursor) fetchParams.prev = cursor

      const res = await api.get('/v1/bet/', fetchParams)
      const fetched = res.items || []
      cursor = res.prev || null
      hasMore = cursor !== null

      // Filter to only bets where user has a position
      const userBets = fetched.filter((b) => b.user_position_total != null && b.user_position_total > 0)

      if (!append) {
        allBets = userBets
      } else {
        allBets = [...allBets, ...userBets]
      }

      // If we got bets from API but none passed the filter, and there's more pages, fetch more
      if (userBets.length === 0 && hasMore && fetched.length > 0 && fetchDepth < 5) {
        fetchDepth++
        loading = false
        return fetchBets(true)
      }
      fetchDepth = 0

      renderAll()
    } catch (err) {
      if (!append) {
        betList.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('error')}</p></div>`
      }
    } finally {
      loading = false
    }
  }

  // Render everything
  function renderAll() {
    const activeBets = allBets.filter((b) => b.status !== 'resolved')
    const resolvedBets = allBets.filter((b) => b.status === 'resolved')

    // P&L card
    pnlWrap.innerHTML = renderPnlCard(allBets)

    // Tabs
    tabsWrap.innerHTML = renderTabs(activeTab, activeBets.length, resolvedBets.length)

    // Bet list
    const displayBets = activeTab === 'active' ? activeBets : resolvedBets
    betList.innerHTML = ''

    if (displayBets.length === 0) {
      betList.innerHTML = `
        <div class="page-empty">
          <p class="text-secondary">${t('noBetsYet')}</p>
          <a href="/" data-link class="btn btn-primary">${t('home')}</a>
        </div>
      `
      footer.innerHTML = ''
      return
    }

    displayBets.forEach((bet) => {
      const card = renderBetCard(bet, store.get('selectedBetId'))
      betList.appendChild(card)
    })

    // Load more
    if (hasMore) {
      footer.innerHTML = `<button class="btn btn-secondary load-more-btn">${t('loadMore')}</button>`
    } else {
      footer.innerHTML = ''
    }
  }

  // Select a bet and open detail panel
  function selectBet(betId) {
    store.set({ selectedBetId: betId })
    $$('.bet-card', betList).forEach((card) => {
      card.classList.toggle('bet-card--selected', card.dataset.betId === betId)
    })
    if (betId) {
      history.replaceState(null, '', `/bet/${betId}`)
      if (detailPanel) {
        const detailEl = createBetDetail(betId)
        detailPanel.open(detailEl)
      }
    }
  }

  // Event: card click
  function onCardClick(e) {
    const card = e.target.closest('.bet-card[data-bet-id]')
    if (card) {
      e.preventDefault()
      selectBet(card.dataset.betId)
    }
  }

  // Event: card keyboard
  function onCardKeydown(e) {
    const card = e.target.closest('.bet-card[data-bet-id]')
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      selectBet(card.dataset.betId)
    }
  }

  // Event: tab click
  function onTabClick(e) {
    const btn = e.target.closest('[data-tab]')
    if (btn) {
      activeTab = btn.dataset.tab
      renderAll()
    }
  }

  // Event: load more
  function onFooterClick(e) {
    const btn = e.target.closest('.load-more-btn')
    if (btn) fetchBets(true)
  }

  betList.addEventListener('click', onCardClick)
  betList.addEventListener('keydown', onCardKeydown)
  tabsWrap.addEventListener('click', onTabClick)
  footer.addEventListener('click', onFooterClick)

  cleanups.push(() => {
    betList.removeEventListener('click', onCardClick)
    betList.removeEventListener('keydown', onCardKeydown)
    tabsWrap.removeEventListener('click', onTabClick)
    footer.removeEventListener('click', onFooterClick)
  })

  // Listen for auth changes
  const unsub = store.on('token', () => {
    if (!store.isAuthenticated) {
      mount(container, renderLoginPrompt())
    }
  })
  cleanups.push(unsub)

  // Initial fetch
  await fetchBets(false)

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
