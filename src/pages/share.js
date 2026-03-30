import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { formatDate, formatTon, formatPoolCompact } from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'

/**
 * Render a win celebration card with bet context.
 */
function renderWinCard(share, bet) {
  const betTitle = bet ? escapeHtml(localize(bet.title)) : ''
  const outcomes = bet?.outcomes || []
  const winner = outcomes.find(o => o.is_winner)
  const winnerLabel = winner ? escapeHtml(localize(winner.label)) : ''
  const totalPool = bet?.total_pool || 0
  const poolStr = totalPool > 0 ? `${formatPoolCompact(totalPool)} pool` : ''

  // Build odds context if available
  let oddsLine = ''
  if (winner && totalPool > 0) {
    const pct = Math.round((winner.pool / totalPool) * 100)
    oddsLine = `<div class="share-card__odds"><span class="text-yes">${winnerLabel} ${pct}%</span></div>`
  }

  return `
    <div class="share-card share-card--win">
      <div class="share-card__icon">&#127942;</div>
      <h2 class="share-card__title">${t('winTitle')}</h2>
      ${betTitle ? `<p class="share-card__bet-title">${betTitle}</p>` : ''}
      ${oddsLine}
      ${poolStr ? `<div class="share-card__pool text-secondary">${poolStr}</div>` : ''}
      <p class="text-secondary">${t('winDescription')}</p>
      <div class="share-card__meta text-secondary">
        ${formatDate(share.created_at)} &middot; ${share.click_count} views
      </div>
      <a href="/bet/${escapeHtml(share.reference_id)}" data-link class="btn btn-primary">${t('viewBet')}</a>
    </div>
  `
}

/**
 * Render a streak celebration card.
 */
function renderStreakCard(share) {
  return `
    <div class="share-card share-card--streak">
      <div class="share-card__icon">&#128293;</div>
      <h2 class="share-card__title">${t('streakTitle')}</h2>
      <p class="text-secondary">${t('streakDescription')}</p>
      <div class="share-card__meta text-secondary">
        ${formatDate(share.created_at)} &middot; ${share.click_count} views
      </div>
      <a href="/" data-link class="btn btn-primary">${t('browseMarkets')}</a>
    </div>
  `
}

/**
 * Share link landing page.
 * Resolves the share link and either redirects or displays a card.
 */
export async function sharePage({ params, query, container }) {
  const shareId = params.id

  // Show loading state
  mount(container, `
    <div class="page page--share">
      <h1 class="sr-only">${t('sharedLink')}</h1>
      <div class="share-loading">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--text"></div>
      </div>
    </div>
  `)

  try {
    const share = await api.get(`/v1/share/${shareId}`)

    if (share.type === 'bet') {
      router.navigate(`/bet/${share.reference_id}`)
      return () => {}
    }

    let cardHtml = ''
    if (share.type === 'win') {
      // Fetch bet data for richer card
      let bet = null
      try { bet = await api.get(`/v1/bet/${share.reference_id}`) } catch { /* use without bet data */ }
      cardHtml = renderWinCard(share, bet)
    } else if (share.type === 'streak') {
      cardHtml = renderStreakCard(share)
    } else {
      cardHtml = `
        <div class="share-card">
          <h2 class="share-card__title">${t('sharedLink')}</h2>
          <p class="text-secondary">${t('sharedLinkDescription')}</p>
          <a href="/" data-link class="btn btn-primary">${t('browseMarkets')}</a>
        </div>
      `
    }

    mount(container, `
      <div class="page page--share">
        <h1 class="sr-only">${t('sharedLink')}</h1>
        ${cardHtml}
      </div>
    `)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      mount(container, `
        <div class="page page--share">
          <h1 class="sr-only">${t('sharedLink')}</h1>
          <div class="page-empty">
            <h2>${t('error')}</h2>
            <p class="text-secondary">${t('linkNotFound')}</p>
            <a href="/" data-link class="btn btn-secondary">${t('home')}</a>
          </div>
        </div>
      `)
    } else {
      mount(container, `
        <div class="page page--share">
          <h1 class="sr-only">${t('sharedLink')}</h1>
          <div class="page-empty">
            <h2>${t('error')}</h2>
            <p class="text-secondary">${escapeHtml(err.message || t('error'))}</p>
            <a href="/" data-link class="btn btn-secondary">${t('home')}</a>
          </div>
        </div>
      `)
    }
  }

  return () => {}
}
