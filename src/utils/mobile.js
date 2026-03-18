import { TMA_URL } from '../constants.js'

/**
 * Detect if the user is on a mobile device.
 * Uses screen width + user agent heuristic.
 */
export function isMobile() {
  if (window.innerWidth < 768) return true
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Build a TMA deep link, optionally with a startapp param to preserve context.
 * Example: https://t.me/HopiumBot/app?startapp=bet_abc123
 */
export function getTMALink(context) {
  if (!context) return TMA_URL
  return `${TMA_URL}?startapp=${encodeURIComponent(context)}`
}
