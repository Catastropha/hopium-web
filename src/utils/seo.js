const BASE_URL = 'https://hopium.bet'

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
 * Update page meta for a specific bet (called after API data loads).
 */
export function setBetMeta(bet) {
  if (!bet) return
  const title = typeof bet.title === 'object' ? (bet.title.en || Object.values(bet.title)[0]) : bet.title
  const pageTitle = `${title} — Hopium`
  document.title = pageTitle
  setMeta('name', 'description', `Prediction market: ${title}. See odds, pool size, and place your bet.`)
  setMeta('property', 'og:title', pageTitle)
  setMeta('property', 'og:description', `Prediction market: ${title}`)
  setMeta('property', 'og:url', `${BASE_URL}/bet/${bet.id}`)
  setMeta('name', 'twitter:title', pageTitle)
  setMeta('name', 'twitter:description', `Prediction market: ${title}`)
  setCanonical(`${BASE_URL}/bet/${bet.id}`)

  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: typeof bet.description === 'object' ? (bet.description.en || Object.values(bet.description)[0] || '') : (bet.description || ''),
    endDate: bet.resolution_date,
    eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: `${BASE_URL}/bet/${bet.id}` },
    organizer: { '@type': 'Organization', name: 'Hopium', url: BASE_URL },
  })
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
  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:url', `${BASE_URL}${pathname}`)
  setMeta('name', 'twitter:title', meta.title)
  setMeta('name', 'twitter:description', meta.description)
  setCanonical(`${BASE_URL}${pathname}`)

  // Clear per-bet JSON-LD on non-bet pages
  if (!pathname.startsWith('/bet/') && jsonLdEl) {
    jsonLdEl.remove()
    jsonLdEl = null
  }
}
