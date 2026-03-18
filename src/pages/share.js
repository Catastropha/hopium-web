import '../styles/share.css'
import { html, $, mount, escapeHtml } from '../utils/dom.js'
import { formatStars, formatDate } from '../utils/format.js'
import { localize, t } from '../i18n.js'
import { api, ApiError } from '../api.js'
import { router } from '../router.js'

/**
 * Render a win celebration card.
 */
function renderWinCard(share) {
  return `
    <div class="share-card share-card--win">
      <div class="share-card__icon">&#127942;</div>
      <h2 class="share-card__title">${t('won')}</h2>
      <p class="text-secondary">${t('winDescription')}</p>
      <div class="share-card__meta text-secondary">
        Shared ${formatDate(share.created_at)} &middot; ${share.click_count} views
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
        Shared ${formatDate(share.created_at)} &middot; ${share.click_count} views
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
      <div class="share-loading">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--text"></div>
      </div>
    </div>
  `)

  try {
    const share = await api.get(`/v1/share/${shareId}`)

    if (share.type === 'bet') {
      // Redirect to the bet page
      router.navigate(`/bet/${share.reference_id}`)
      return () => {}
    }

    let cardHtml = ''
    if (share.type === 'win') {
      cardHtml = renderWinCard(share)
    } else if (share.type === 'streak') {
      cardHtml = renderStreakCard(share)
    } else {
      // Unknown share type — show generic card
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
        ${cardHtml}
      </div>
    `)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      mount(container, `
        <div class="page page--share">
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
