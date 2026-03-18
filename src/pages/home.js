import '../styles/home-hero.css'
import '../styles/filter-bar.css'
import '../styles/bet-card.css'
import { html, $, $$, mount, escapeHtml } from '../utils/dom.js'
import {
  formatStars, formatStarsCompact, formatOdds, formatPercent,
  formatTimeRemaining, formatNumber, formatSignedStars, formatCompact,
} from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'
import { CATEGORIES, CATEGORY_COLORS } from '../constants.js'
import { createOddsBar } from '../components/odds-bar.js'
import { createBetDetail } from '../components/bet-detail.js'
import { shareBet, closeShareMenu, handleShareClick } from '../components/share-menu.js'

/**
 * Render the home hero section for unauthenticated users.
 */
function renderHero() {
  if (store.isAuthenticated) return ''
  return `
    <div class="home-hero" role="banner">
      <div class="home-hero__brand">
        <img class="home-hero__mark" src="/logo.svg" alt="" aria-hidden="true" width="28" height="28" />
        <h1 class="home-hero__title">${escapeHtml(t('heroTitle'))}</h1>
      </div>
      <p class="home-hero__sub">${escapeHtml(t('heroSub'))}</p>
      <p class="home-hero__hint">${escapeHtml(t('heroHint'))}</p>
    </div>
  `
}

/**
 * Render a single bet card element.
 */
function renderBetCard(bet, selectedId) {
  const title = localize(bet.title)
  const yesOutcome = bet.outcomes?.[0]
  const noOutcome = bet.outcomes?.[1]
  const totalPool = bet.total_pool || 0
  const yesPct = totalPool > 0 && yesOutcome ? Math.round((yesOutcome.pool / totalPool) * 100) : 50
  const noPct = 100 - yesPct
  const yesLabel = yesOutcome ? localize(yesOutcome.label) || 'YES' : 'YES'
  const noLabel = noOutcome ? localize(noOutcome.label) || 'NO' : 'NO'
  const catColor = CATEGORY_COLORS[bet.category] || 'var(--text-secondary)'
  const isSelected = bet.id === selectedId

  // User position badge
  let positionBadge = ''
  if (bet.user_position_total != null && bet.user_position_total > 0) {
    positionBadge = `<span class="bet-card__position">${escapeHtml(t('yourBet'))}: ${formatStars(bet.user_position_total)}</span>`
  }

  // Urgency and state classes
  const hoursLeft = (new Date(bet.resolution_date) - Date.now()) / 3_600_000
  const isHot = hoursLeft > 0 && hoursLeft < 24
  const isClosingSoon = hoursLeft > 0 && hoursLeft < 6
  const isBigPool = totalPool >= 10000
  const hasPosition = bet.user_position_total != null && bet.user_position_total > 0

  let stateClasses = ''
  if (isClosingSoon) stateClasses += ' bet-card--closing'
  else if (isHot) stateClasses += ' bet-card--hot'
  if (isBigPool) stateClasses += ' bet-card--popular'
  if (hasPosition) stateClasses += ' bet-card--has-position'

  const card = html`
    <article
      class="bet-card ${isSelected ? 'bet-card--selected' : ''}${stateClasses}"
      data-bet-id="${bet.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(title)} — ${yesLabel} ${yesPct}%, ${noLabel} ${noPct}%, ${t('pool')} ${formatNumber(totalPool)}"
    >
      <div class="bet-card__top">
        <span class="bet-card__category" style="color: ${catColor}">
          <span class="bet-card__cat-dot" style="background: ${catColor}"></span>
          ${escapeHtml(bet.category)}
        </span>
        <span class="bet-card__time text-secondary">${formatTimeRemaining(bet.resolution_date)}</span>
      </div>
      <h3 class="bet-card__title">${escapeHtml(title)}</h3>
      <div class="bet-card__odds-bar-wrap"></div>
      <div class="bet-card__odds-labels">
        <span class="bet-card__odds-yes">
          ${escapeHtml(yesLabel)} ${yesPct}%
          <span class="text-secondary">&middot; ${formatStarsCompact(yesOutcome?.pool || 0)}</span>
        </span>
        <span class="bet-card__odds-no">
          ${escapeHtml(noLabel)} ${noPct}%
          <span class="text-secondary">&middot; ${formatStarsCompact(noOutcome?.pool || 0)}</span>
        </span>
      </div>
      <div class="bet-card__bottom">
        <span class="bet-card__pool">${formatStars(totalPool)} ${t('pool')}</span>
        ${positionBadge}
        <button class="bet-card__share" aria-label="${escapeHtml(t('share'))}" data-share>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>
    </article>
  `

  // Mount odds bar component
  const barWrap = $('.bet-card__odds-bar-wrap', card)
  if (barWrap && bet.outcomes) {
    barWrap.appendChild(createOddsBar(bet.outcomes))
  }

  // Attach bet data for share handler
  card._bet = bet

  return card
}

/**
 * Render skeleton placeholder cards.
 */
function renderSkeletons(count = 4) {
  let skeletons = ''
  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="bet-card bet-card--skeleton" aria-hidden="true">
        <div class="bet-card__top">
          <span class="skeleton skeleton--sm"></span>
          <span class="skeleton skeleton--xs"></span>
        </div>
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--bar"></div>
        <div class="bet-card__odds-labels">
          <span class="skeleton skeleton--sm"></span>
          <span class="skeleton skeleton--sm"></span>
        </div>
        <div class="bet-card__bottom">
          <span class="skeleton skeleton--sm"></span>
        </div>
      </div>
    `
  }
  return skeletons
}

/**
 * Render the filter bar (category chips + country selector).
 */
function renderFilterBar(activeCategory, activeCountry, countries) {
  const categoryChips = ['', ...CATEGORIES].map((cat) => {
    const label = cat || t('all')
    const isActive = cat === (activeCategory || '')
    const color = CATEGORY_COLORS[cat] || ''
    return `<button
      class="filter-chip ${isActive ? 'filter-chip--active' : ''}"
      data-category="${escapeHtml(cat)}"
      ${color && isActive ? `style="--chip-accent: ${color}"` : ''}
      aria-pressed="${isActive}"
    >${escapeHtml(label)}</button>`
  }).join('')

  // Country dropdown
  const activeFlag = activeCountry
    ? (countries.find(c => c.code === activeCountry)?.flag_emoji || '🌍')
    : '🌍'
  const activeName = activeCountry
    ? escapeHtml(localize(countries.find(c => c.code === activeCountry)?.name) || activeCountry)
    : t('global')

  let countryItems = `<button class="filter-bar__dropdown-item ${!activeCountry ? 'filter-bar__dropdown-item--selected' : ''}" data-country="" role="option" aria-selected="${!activeCountry}"><span>🌍</span><span>${t('global')}</span></button>`
  if (countries && countries.length) {
    countries.forEach((c) => {
      const name = localize(c.name)
      const selected = c.code === activeCountry
      countryItems += `<button class="filter-bar__dropdown-item ${selected ? 'filter-bar__dropdown-item--selected' : ''}" data-country="${escapeHtml(c.code)}" role="option" aria-selected="${selected}"><span>${c.flag_emoji || ''}</span><span>${escapeHtml(name)}</span></button>`
    })
  }

  return `
    <div class="filter-bar" role="toolbar" aria-label="${t('filters')}">
      <div class="filter-bar__country">
        <button class="filter-bar__country-btn" aria-expanded="false" aria-haspopup="listbox">
          <span class="filter-bar__country-flag">${activeFlag}</span>
          <span class="filter-bar__country-name">${activeName}</span>
          <svg class="filter-bar__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-bar__dropdown" role="listbox" hidden>
          ${countryItems}
        </div>
      </div>
      <div class="filter-chips" role="group" aria-label="${t('categoryFilter')}">
        ${categoryChips}
      </div>
    </div>
  `
}

/**
 * Home page — browse all active bets with filters and pagination.
 */
export async function homePage({ params, query, container, detailPanel }) {
  const cleanups = []
  let currentCategory = query.category || ''
  let currentCountry = query.country_code || ''
  let cursor = null
  let bets = []
  let loading = false
  let selectedBetId = store.get('selectedBetId')

  // Build page shell
  const page = html`
    <div class="page page--home">
      ${renderHero()}
      <div class="filter-bar-wrap"></div>
      <div class="bet-list" role="list" aria-live="polite" aria-label="${t('bets')}">
        ${renderSkeletons(4)}
      </div>
      <div class="bet-list__footer"></div>
    </div>
  `

  mount(container, page)

  const filterWrap = $('.filter-bar-wrap', page)
  const betList = $('.bet-list', page)
  const footer = $('.bet-list__footer', page)

  // Fetch countries (non-blocking — render filter bar with cached or empty, update when ready)
  let countries = store.get('countries') || []
  filterWrap.innerHTML = renderFilterBar(currentCategory, currentCountry, countries)

  if (!store.get('countries')) {
    api.get('/v1/country/').then(res => {
      countries = res.items || []
      store.set({ countries })
      filterWrap.innerHTML = renderFilterBar(currentCategory, currentCountry, countries)
    }).catch(() => {})
  }

  // Update URL query params without full reload
  function updateURL() {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    if (currentCountry) params.set('country_code', currentCountry)
    const qs = params.toString()
    const url = '/' + (qs ? `?${qs}` : '')
    history.replaceState(null, '', url)
  }

  // Fetch bets
  async function fetchBets(append = false) {
    if (loading) return
    loading = true

    if (!append) {
      betList.innerHTML = renderSkeletons(4)
      cursor = null
      bets = []
    } else {
      footer.innerHTML = '<div class="load-more-spinner"></div>'
    }

    try {
      const fetchParams = { size: 20 }
      if (currentCategory) fetchParams.category = currentCategory
      if (currentCountry) fetchParams.country_code = currentCountry
      if (cursor) fetchParams.prev = cursor

      const res = await api.get('/v1/bet/', fetchParams)
      const newBets = res.items || []
      cursor = res.prev || null

      if (!append) {
        bets = newBets
        renderBetList(bets)
      } else {
        bets = [...bets, ...newBets]
        appendCards(newBets)
      }

      updateFooter()
    } catch (err) {
      // Cursor errors (bet-get-1, bet-get-2): retry without cursor
      if (err instanceof ApiError && (err.code === 'bet-get-1' || err.code === 'bet-get-2')) {
        cursor = null
        loading = false
        return fetchBets(false)
      }
      if (!append) {
        betList.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('error')}</p></div>`
      }
      footer.innerHTML = ''
    } finally {
      loading = false
    }
  }

  // Render full bet list (used on initial load and filter change)
  function renderBetList(items) {
    betList.innerHTML = ''

    if (items.length === 0) {
      betList.innerHTML = `
        <div class="page-empty">
          <p class="text-secondary">${t('noResults')}</p>
        </div>
      `
      return
    }

    const frag = document.createDocumentFragment()
    items.forEach((bet) => frag.appendChild(renderBetCard(bet, selectedBetId)))
    betList.appendChild(frag)
  }

  // Append new cards only (used on "Load more")
  function appendCards(newBets) {
    const frag = document.createDocumentFragment()
    newBets.forEach((bet) => frag.appendChild(renderBetCard(bet, selectedBetId)))
    betList.appendChild(frag)
  }

  // Update footer load-more button
  function updateFooter() {
    if (cursor) {
      footer.innerHTML = `<button class="btn btn-secondary load-more-btn">${t('loadMore')}</button>`
    } else {
      footer.innerHTML = ''
    }
  }

  // Select a bet card and open detail panel
  function selectBet(betId) {
    selectedBetId = betId
    store.set({ selectedBetId: betId })

    // Update visual selection
    $$('.bet-card', betList).forEach((card) => {
      card.classList.toggle('bet-card--selected', card.dataset.betId === betId)
    })

    // Update URL
    if (betId) {
      history.replaceState(null, '', `/bet/${betId}`)
      // Open detail panel
      if (detailPanel) {
        const detailEl = createBetDetail(betId)
        detailPanel.open(detailEl)
      }
    }
  }

  // Event: bet card click
  function onBetListClick(e) {
    // Ignore clicks on share button
    if (e.target.closest('.bet-card__share')) return
    const card = e.target.closest('.bet-card[data-bet-id]')
    if (!card) return
    e.preventDefault()
    selectBet(card.dataset.betId)
  }

  // Event: bet card keyboard
  function onBetListKeydown(e) {
    const card = e.target.closest('.bet-card[data-bet-id]')
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      selectBet(card.dataset.betId)
    }
  }

  // Event: load more
  function onFooterClick(e) {
    const btn = e.target.closest('.load-more-btn')
    if (btn) {
      fetchBets(true)
    }
  }

  // Event: category chip click
  function onFilterClick(e) {
    const chip = e.target.closest('.filter-chip')
    if (chip) {
      currentCategory = chip.dataset.category || ''
      updateURL()
      // Re-render filter bar
      filterWrap.innerHTML = renderFilterBar(currentCategory, currentCountry, countries)
      fetchBets(false)
      return
    }

    // Country dropdown toggle
    const countryBtn = e.target.closest('.filter-bar__country-btn')
    if (countryBtn) {
      const dropdown = filterWrap.querySelector('.filter-bar__dropdown')
      if (dropdown) {
        const isOpen = !dropdown.hidden
        dropdown.hidden = isOpen
        countryBtn.setAttribute('aria-expanded', String(!isOpen))
      }
      return
    }

    // Country dropdown item select
    const countryItem = e.target.closest('.filter-bar__dropdown-item')
    if (countryItem) {
      currentCountry = countryItem.dataset.country || ''
      updateURL()
      filterWrap.innerHTML = renderFilterBar(currentCategory, currentCountry, countries)
      fetchBets(false)
      return
    }
  }

  // Close country dropdown on outside click
  function onDocumentClick(e) {
    if (!e.target.closest('.filter-bar__country')) {
      const dropdown = filterWrap.querySelector('.filter-bar__dropdown')
      const btn = filterWrap.querySelector('.filter-bar__country-btn')
      if (dropdown && !dropdown.hidden) {
        dropdown.hidden = true
        if (btn) btn.setAttribute('aria-expanded', 'false')
      }
    }
  }

  // Close country dropdown on Escape
  function onFilterKeydown(e) {
    if (e.key === 'Escape') {
      const dropdown = filterWrap.querySelector('.filter-bar__dropdown')
      const btn = filterWrap.querySelector('.filter-bar__country-btn')
      if (dropdown && !dropdown.hidden) {
        dropdown.hidden = true
        if (btn) {
          btn.setAttribute('aria-expanded', 'false')
          btn.focus()
        }
      }
    }
  }

  // Keyboard navigation (j/k) — throttled to prevent scroll jank on key hold
  let navThrottled = false
  function onKeydown(e) {
    if (e.target.closest('input, select, textarea')) return

    if (e.key === 'j' || e.key === 'k') {
      e.preventDefault()
      if (navThrottled) return
      navThrottled = true
      setTimeout(() => { navThrottled = false }, 80)

      const cards = $$('.bet-card[data-bet-id]', betList)
      if (!cards.length) return

      const currentIdx = cards.findIndex((c) => c.dataset.betId === selectedBetId)

      let nextIdx
      if (e.key === 'j') {
        nextIdx = currentIdx < cards.length - 1 ? currentIdx + 1 : 0
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : cards.length - 1
      }

      const nextCard = cards[nextIdx]
      if (nextCard) {
        selectBet(nextCard.dataset.betId)
        nextCard.focus()
        nextCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }

  // Attach events
  betList.addEventListener('click', handleShareClick, true)
  betList.addEventListener('click', onBetListClick)
  betList.addEventListener('keydown', onBetListKeydown)
  footer.addEventListener('click', onFooterClick)
  filterWrap.addEventListener('click', onFilterClick)
  filterWrap.addEventListener('keydown', onFilterKeydown)
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)

  cleanups.push(() => {
    betList.removeEventListener('click', handleShareClick, true)
    betList.removeEventListener('click', onBetListClick)
    betList.removeEventListener('keydown', onBetListKeydown)
    footer.removeEventListener('click', onFooterClick)
    filterWrap.removeEventListener('click', onFilterClick)
    filterWrap.removeEventListener('keydown', onFilterKeydown)
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
    closeShareMenu()
  })

  // Listen for selectedBetId changes from external sources
  const unsub = store.on('selectedBetId', (id) => {
    selectedBetId = id
    $$('.bet-card', betList).forEach((card) => {
      card.classList.toggle('bet-card--selected', card.dataset.betId === id)
    })
  })
  cleanups.push(unsub)

  // Initial fetch
  await fetchBets(false)

  // Auto-select first bet if none selected (reveals two-panel layout)
  if (!selectedBetId && bets.length > 0) {
    selectBet(bets[0].id)
  }

  // Return cleanup
  return () => {
    cleanups.forEach((fn) => fn())
  }
}

// Re-export renderBetCard and renderSkeletons for use by other pages
export { renderBetCard, renderSkeletons }
