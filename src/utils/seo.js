import { BASE_URL } from '../constants.js'
import { localize } from '../i18n.js'

const DEFAULT_OG_IMAGE = `${BASE_URL}/og.png`

const ROUTE_META = {
  '/': {
    title: 'Hopium — Prediction Markets',
    description: 'Parimutuel prediction markets on real-world events. Bet on crypto, sports, politics, culture, and tech outcomes with Telegram Stars.',
  },
  '/my-bets': {
    title: 'My Bets — Hopium',
    description: 'Track your active and resolved prediction market positions.',
    robots: 'noindex, nofollow',
  },
  '/leaders': {
    title: 'Leaderboard — Hopium',
    description: 'Top prediction market players ranked by profit, win rate, and streak.',
  },
  '/profile': {
    title: 'Profile — Hopium',
    description: 'Your Hopium wallet and transaction history.',
    robots: 'noindex, nofollow',
  },
  '/login': {
    title: 'Log In — Hopium',
    description: 'Log in with Telegram to place bets on Hopium.',
    robots: 'noindex, nofollow',
  },
}

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attr, key) {
  const el = document.querySelector(`meta[${attr}="${key}"]`)
  if (el) el.remove()
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

let jsonLdEl = null

/**
 * Inject or update a JSON-LD structured data block.
 */
export function setJsonLd(data) {
  if (!jsonLdEl) {
    jsonLdEl = document.createElement('script')
    jsonLdEl.type = 'application/ld+json'
    jsonLdEl.id = 'hopium-jsonld'
    document.head.appendChild(jsonLdEl)
  }
  jsonLdEl.textContent = JSON.stringify(data)
}

/**
 * Build a rich description from bet data for OG tags and social sharing.
 * Dense, scannable — odds, pool, urgency — everything to provoke a click.
 */
function buildBetDescription(bet) {
  const outcomes = bet.outcomes || []
  const totalPool = bet.total_pool || 0
  const yes = outcomes[0]
  const no = outcomes[1]
  const yesPct = totalPool > 0 && yes ? Math.round((yes.pool / totalPool) * 100) : 50
  const noPct = 100 - yesPct
  const yesLabel = yes ? localize(yes.label) || 'YES' : 'YES'
  const noLabel = no ? localize(no.label) || 'NO' : 'NO'

  const parts = [`${yesLabel} ${yesPct}% · ${noLabel} ${noPct}%`]
  if (totalPool > 0) {
    const pool = totalPool >= 1000
      ? `${(totalPool / 1000).toFixed(totalPool >= 10000 ? 0 : 1)}K`
      : String(totalPool)
    parts.push(`⭐ ${pool} pool`)
  }
  if (bet.category) parts.push(bet.category)

  return `${parts.join(' · ')} — Pick a side on Hopium`
}

/**
 * Update page meta for a specific bet (called after API data loads).
 */
export function setBetMeta(bet) {
  if (!bet) return
  const title = localize(bet.title)
  const pageTitle = `${title} — Hopium`
  const description = buildBetDescription(bet)
  const betUrl = `${BASE_URL}/bet/${bet.id}`
  const image = bet.image_url || DEFAULT_OG_IMAGE

  document.title = pageTitle
  setMeta('name', 'description', description)

  // Open Graph
  setMeta('property', 'og:title', pageTitle)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', betUrl)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:image:width', '1200')
  setMeta('property', 'og:image:height', '630')

  // Twitter Card — use large image when bet has its own image
  setMeta('name', 'twitter:card', bet.image_url ? 'summary_large_image' : 'summary')
  setMeta('name', 'twitter:title', pageTitle)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)

  // Article meta
  setMeta('property', 'article:published_time', bet.created_at || new Date().toISOString())
  if (bet.resolution_date) {
    setMeta('property', 'article:expiration_time', bet.resolution_date)
  }
  if (bet.category) {
    setMeta('property', 'article:section', bet.category)
    setMeta('property', 'article:tag', bet.category)
  }

  setCanonical(betUrl)

  // JSON-LD structured data
  const ldData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: localize(bet.description),
    endDate: bet.resolution_date,
    eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: betUrl },
    organizer: { '@type': 'Organization', name: 'Hopium', url: BASE_URL },
  }
  if (bet.image_url) {
    ldData.image = bet.image_url
  }
  setJsonLd(ldData)
}

/**
 * Update meta tags based on the current route.
 * Called on every route change.
 */
export function updateRouteMeta(pathname) {
  // Match static route or fall back to '/'
  let routeKey = pathname
  if (pathname.startsWith('/bet/')) routeKey = '/bet/:id'
  else if (pathname.startsWith('/share/')) routeKey = '/share/:id'
  else if (pathname.startsWith('/leaders/')) routeKey = '/leaders'
  else if (pathname.startsWith('/my-bets/')) routeKey = '/my-bets'

  const meta = ROUTE_META[routeKey] || ROUTE_META['/']

  document.title = meta.title
  setMeta('name', 'description', meta.description)
  setMeta('name', 'robots', meta.robots || 'index, follow')

  // Open Graph
  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:url', `${BASE_URL}${pathname}`)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE)
  setMeta('property', 'og:image:width', '1200')
  setMeta('property', 'og:image:height', '630')

  // Twitter Card
  setMeta('name', 'twitter:card', 'summary')
  setMeta('name', 'twitter:title', meta.title)
  setMeta('name', 'twitter:description', meta.description)
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE)

  setCanonical(`${BASE_URL}${pathname}`)

  // Clear per-bet meta on non-bet pages
  if (!pathname.startsWith('/bet/')) {
    removeMeta('property', 'article:published_time')
    removeMeta('property', 'article:expiration_time')
    removeMeta('property', 'article:section')
    removeMeta('property', 'article:tag')
    if (jsonLdEl) {
      jsonLdEl.remove()
      jsonLdEl = null
    }
  }
}
