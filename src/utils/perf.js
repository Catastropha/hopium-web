/**
 * Lightweight Web Vitals collection via native PerformanceObserver.
 * Metrics are queued on window.__hopium_perf for any provider to consume.
 */

function report(name, value) {
  if (value == null) return
  window.__hopium_perf = window.__hopium_perf || []
  window.__hopium_perf.push({ name, value: Math.round(value), ts: Date.now() })
}

export function initPerfMonitoring() {
  if (!('PerformanceObserver' in window)) return

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      report('lcp', entries[entries.length - 1]?.startTime)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {}

  // CLS
  let clsValue = 0
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsValue += entry.value
      }
      report('cls', clsValue * 1000) // multiply for precision
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {}

  // Navigation timing
  window.addEventListener('load', () => {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav) {
      report('ttfb', nav.responseStart)
      report('dom-ready', nav.domContentLoadedEventEnd)
      report('load', nav.loadEventEnd)
    }
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    report('fcp', fcp?.startTime)
  })
}
