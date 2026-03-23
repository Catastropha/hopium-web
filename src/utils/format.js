import { getLang } from '../i18n.js'

// Cached Intl formatters — recreated only when language changes
let _lang = null
let _numFmt = null
let _numFmtCompact = null
let _dateFmt = null
let _dollarFmt = null
let _dollarFmtCompact = null

function ensureFormatters() {
  const lang = getLang()
  if (lang !== _lang) {
    _lang = lang
    _numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 })
    _numFmtCompact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })
    _dateFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' })
    _dollarFmt = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    })
    _dollarFmtCompact = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', notation: 'compact',
    })
  }
}

/**
 * Format a number: 15000 → "15,000"
 */
export function formatNumber(n) {
  ensureFormatters()
  return _numFmt.format(n)
}

/**
 * Compact format: 15000 → "15K"
 */
export function formatCompact(n) {
  ensureFormatters()
  return _numFmtCompact.format(n)
}

/**
 * Format cents as dollars: 15000 → "$150.00"
 */
export function formatDollars(n) {
  ensureFormatters()
  return _dollarFmt.format(n / 100)
}

/**
 * Format cents as compact dollars: 1500000 → "$15K"
 */
export function formatDollarsCompact(n) {
  ensureFormatters()
  return _dollarFmtCompact.format(n / 100)
}

/**
 * Format signed dollar amount: +$1.50 or -$0.50
 */
export function formatSignedDollars(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${formatDollars(n)}`
}

/**
 * Format odds: 2.5 → "2.5x"
 */
export function formatOdds(odds) {
  return `${odds.toFixed(odds >= 10 ? 1 : 2)}x`
}

/**
 * Format percentage: 0.65 → "65%", or from raw 65 → "65%"
 */
export function formatPercent(n) {
  if (n <= 1) n = n * 100
  return `${Math.round(n)}%`
}

/**
 * Format cents as compact pool string for share text / OG tags: "$150", "$1.5K"
 */
export function formatPoolCompact(cents) {
  const dollars = cents / 100
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}K`
  }
  return `$${Math.round(dollars)}`
}

/**
 * Relative time: "2d 14h", "23h", "45m"
 */
export function formatTimeRemaining(dateStr) {
  const diff = new Date(dateStr) - Date.now()

  if (diff <= 0) return 'Ended'

  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24

  if (days > 0) return `${days}d ${remainHours}h`
  if (hours > 0) return `${hours}h`
  return `${Math.floor(diff / 60_000)}m`
}

/**
 * Format date: "Mar 10, 2026"
 */
export function formatDate(dateStr) {
  ensureFormatters()
  return _dateFmt.format(new Date(dateStr))
}
