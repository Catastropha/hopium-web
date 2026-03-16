import { getLang } from '../i18n.js'

// Cached Intl formatters — recreated only when language changes
let _lang = null
let _numFmt = null
let _numFmtCompact = null
let _dateFmt = null

function ensureFormatters() {
  const lang = getLang()
  if (lang !== _lang) {
    _lang = lang
    _numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 })
    _numFmtCompact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })
    _dateFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' })
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
 * Format Stars amount with star icon: "⭐ 15,000"
 */
export function formatStars(n) {
  return `⭐\u00A0${formatNumber(n)}`
}

/**
 * Format Stars compact: "⭐ 15K"
 */
export function formatStarsCompact(n) {
  return `⭐\u00A0${formatCompact(n)}`
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

/**
 * Format sign amount: +⭐ 100 or -⭐ 50
 */
export function formatSignedStars(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}⭐\u00A0${formatNumber(Math.abs(n))}`
}
