import { html, $, $$, mount, escapeHtml } from '../utils/dom.js'
import {
  formatTon, formatPercent, formatNumber, formatSignedTon,
  formatCompact,
} from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { store } from '../store.js'
import { api, ApiError } from '../api.js'
import { CATEGORIES, CATEGORY_COLORS } from '../constants.js'

const TIME_WINDOWS = [
  { value: 'all', labelKey: 'allTime' },
  { value: '30d', labelKey: 'days30' },
  { value: '7d', labelKey: 'days7' },
]

/**
 * Render time window tabs.
 */
function renderTimeWindowTabs(activeWindow) {
  return TIME_WINDOWS.map((tw) => `
    <button
      class="segmented-control__btn ${tw.value === activeWindow ? 'segmented-control__btn--active' : ''}"
      role="tab"
      aria-selected="${tw.value === activeWindow}"
      data-time-window="${tw.value}"
    >${t(tw.labelKey)}</button>
  `).join('')
}

/**
 * Render optional category filter chips.
 */
function renderCategoryFilter(activeCategory) {
  return ['', ...CATEGORIES].map((cat) => {
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
}

/**
 * Render the podium section for the top 3.
 */
function renderPodium(entries) {
  if (entries.length < 3) return ''

  const first = entries[0]
  const second = entries[1]
  const third = entries[2]

  function podiumItem(entry, place) {
    const name = entry.username ? escapeHtml(entry.username) : t('anonymous')
    const initial = entry.username ? entry.username.charAt(0).toUpperCase() : '?'
    const profitClass = entry.total_profit >= 0 ? 'text-yes' : 'text-no'
    const medals = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' }
    const sizes = { 1: 'podium__item--first', 2: 'podium__item--second', 3: 'podium__item--third' }

    return `
      <div class="podium__item ${sizes[place]}">
        <div class="podium__medal">${medals[place]}</div>
        <div class="podium__avatar">${initial}</div>
        <div class="podium__name">${name}</div>
        <div class="podium__profit ${profitClass}">${formatSignedTon(entry.total_profit)}</div>
      </div>
    `
  }

  // Layout: 2nd — 1st — 3rd
  return `
    <div class="podium">
      ${podiumItem(second, 2)}
      ${podiumItem(first, 1)}
      ${podiumItem(third, 3)}
    </div>
  `
}

/**
 * Render the leaderboard table for entries beyond top 3.
 */
function renderTable(entries, startRank) {
  if (!entries.length) return ''

  const currentUserId = store.get('userId')

  const rows = entries.map((entry) => {
    const name = entry.username ? escapeHtml(entry.username) : t('anonymous')
    const initial = entry.username ? entry.username.charAt(0).toUpperCase() : '?'
    const profitClass = entry.total_profit >= 0 ? 'text-yes' : 'text-no'
    const isCurrentUser = currentUserId && entry.user_id === currentUserId
    const rowClass = isCurrentUser ? 'leaderboard-row--highlight' : ''
    const streakStr = entry.current_streak > 0 ? `\uD83D\uDD25 ${entry.current_streak}` : '\u2014'

    // Medal icons for top 3 even in table
    let rankDisplay = String(entry.rank)
    if (entry.rank === 1) rankDisplay = '\uD83E\uDD47'
    else if (entry.rank === 2) rankDisplay = '\uD83E\uDD48'
    else if (entry.rank === 3) rankDisplay = '\uD83E\uDD49'

    return `
      <tr class="leaderboard-row ${rowClass}">
        <td class="leaderboard-cell leaderboard-cell--rank">${rankDisplay}</td>
        <td class="leaderboard-cell leaderboard-cell--user">
          <span class="leaderboard-avatar">${initial}</span>
          <span>${name}</span>
        </td>
        <td class="leaderboard-cell leaderboard-cell--winrate">${formatPercent(entry.win_rate)}</td>
        <td class="leaderboard-cell leaderboard-cell--streak">${streakStr}</td>
        <td class="leaderboard-cell leaderboard-cell--profit ${profitClass}">${formatSignedTon(entry.total_profit)}</td>
      </tr>
    `
  }).join('')

  return `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="leaderboard-th">${t('rank')}</th>
          <th class="leaderboard-th">${t('user')}</th>
          <th class="leaderboard-th">${t('winRate')}</th>
          <th class="leaderboard-th">${t('streak')}</th>
          <th class="leaderboard-th">${t('profit')}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `
}

/**
 * Render skeleton loading state.
 */
function renderLeaderboardSkeleton() {
  const skeletonRows = Array.from({ length: 8 }, () => `
    <tr class="leaderboard-row">
      <td class="leaderboard-cell"><span class="skeleton skeleton--xs"></span></td>
      <td class="leaderboard-cell"><span class="skeleton skeleton--sm"></span></td>
      <td class="leaderboard-cell"><span class="skeleton skeleton--xs"></span></td>
      <td class="leaderboard-cell"><span class="skeleton skeleton--xs"></span></td>
      <td class="leaderboard-cell"><span class="skeleton skeleton--sm"></span></td>
    </tr>
  `).join('')

  return `
    <div class="podium podium--skeleton">
      <div class="podium__item podium__item--second"><div class="skeleton skeleton--avatar"></div></div>
      <div class="podium__item podium__item--first"><div class="skeleton skeleton--avatar"></div></div>
      <div class="podium__item podium__item--third"><div class="skeleton skeleton--avatar"></div></div>
    </div>
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="leaderboard-th">${t('rank')}</th>
          <th class="leaderboard-th">${t('user')}</th>
          <th class="leaderboard-th">${t('winRate')}</th>
          <th class="leaderboard-th">${t('streak')}</th>
          <th class="leaderboard-th">${t('profit')}</th>
        </tr>
      </thead>
      <tbody>${skeletonRows}</tbody>
    </table>
  `
}

/**
 * Leaderboard page — public, no auth required.
 */
export async function leaderboardPage({ params, query, container, detailPanel }) {
  const cleanups = []
  let timeWindow = query.time_window || 'all'
  let category = query.category || ''
  let allEntries = []
  let cursor = null
  let loading = false
  let hasMore = true

  // Build page shell
  const page = html`
    <div class="page page--leaderboard">
      <h1 class="page-title">${t('leaderboard')}</h1>
      <div class="leaderboard-controls">
        <div class="segmented-control" role="tablist">
          ${renderTimeWindowTabs(timeWindow)}
        </div>
        <div class="filter-chips filter-chips--leaderboard" role="group" aria-label="${t('categoryFilter')}">
          ${renderCategoryFilter(category)}
        </div>
      </div>
      <div class="leaderboard-content">
        ${renderLeaderboardSkeleton()}
      </div>
      <div class="leaderboard-footer" aria-live="polite"></div>
    </div>
  `

  mount(container, page)

  const controlsEl = $('.leaderboard-controls', page)
  const contentEl = $('.leaderboard-content', page)
  const footerEl = $('.leaderboard-footer', page)

  // Update URL
  function updateURL() {
    const params = new URLSearchParams()
    if (timeWindow !== 'all') params.set('time_window', timeWindow)
    if (category) params.set('category', category)
    const qs = params.toString()
    const url = '/leaders' + (qs ? `?${qs}` : '')
    history.replaceState(null, '', url)
  }

  // Fetch leaderboard data
  async function fetchLeaderboard(append = false) {
    if (loading) return
    loading = true

    if (!append) {
      contentEl.innerHTML = renderLeaderboardSkeleton()
      cursor = null
      allEntries = []
    } else {
      footerEl.innerHTML = '<div class="load-more-spinner"></div>'
    }

    try {
      const fetchParams = { time_window: timeWindow, size: 50 }
      if (category) fetchParams.category = category
      if (cursor) fetchParams.prev = cursor

      const res = await api.get('/v1/leaderboard/', fetchParams)
      const newEntries = res.items || []
      cursor = res.prev || null
      hasMore = cursor !== null

      if (!append) {
        allEntries = newEntries
      } else {
        allEntries = [...allEntries, ...newEntries]
      }

      renderContent()
    } catch (err) {
      if (!append) {
        contentEl.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('error')}</p><button class="btn btn-secondary leaderboard-retry-btn">${t('retry')}</button></div>`
        const retryBtn = contentEl.querySelector('.leaderboard-retry-btn')
        if (retryBtn) {
          retryBtn.addEventListener('click', () => fetchLeaderboard(false))
        }
      }
    } finally {
      loading = false
    }
  }

  // Render leaderboard content
  function renderContent() {
    if (allEntries.length === 0) {
      contentEl.innerHTML = `<div class="page-empty"><p class="text-secondary">${t('noLeaderboardData')}</p><a href="/" data-link class="btn btn-secondary">${t('browseMarkets')}</a></div>`
      footerEl.innerHTML = ''
      return
    }

    const top3 = allEntries.slice(0, 3)
    const rest = allEntries.slice(3)

    let contentHtml = ''
    if (top3.length >= 3) {
      contentHtml += renderPodium(top3)
    }
    contentHtml += renderTable(allEntries.length >= 3 ? rest : allEntries, 4)

    contentEl.innerHTML = contentHtml

    // Load more
    if (hasMore) {
      footerEl.innerHTML = `<button class="btn btn-secondary load-more-btn">${t('loadMore')}</button>`
    } else {
      footerEl.innerHTML = ''
    }
  }

  // Event: time window tab click
  function onTimeWindowClick(e) {
    const btn = e.target.closest('[data-time-window]')
    if (btn) {
      timeWindow = btn.dataset.timeWindow
      // Re-render tabs
      const tablist = $('.segmented-control', controlsEl)
      if (tablist) tablist.innerHTML = renderTimeWindowTabs(timeWindow)
      updateURL()
      fetchLeaderboard(false)
    }
  }

  // Event: category chip click
  function onCategoryClick(e) {
    const chip = e.target.closest('.filter-chip')
    if (chip) {
      category = chip.dataset.category || ''
      // Re-render chips
      const chipsWrap = $('.filter-chips--leaderboard', controlsEl)
      if (chipsWrap) chipsWrap.innerHTML = renderCategoryFilter(category)
      updateURL()
      fetchLeaderboard(false)
    }
  }

  // Event: load more
  function onFooterClick(e) {
    const btn = e.target.closest('.load-more-btn')
    if (btn) fetchLeaderboard(true)
  }

  controlsEl.addEventListener('click', onTimeWindowClick)
  controlsEl.addEventListener('click', onCategoryClick)
  footerEl.addEventListener('click', onFooterClick)

  cleanups.push(() => {
    controlsEl.removeEventListener('click', onTimeWindowClick)
    controlsEl.removeEventListener('click', onCategoryClick)
    footerEl.removeEventListener('click', onFooterClick)
  })

  // Initial fetch
  await fetchLeaderboard(false)

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
