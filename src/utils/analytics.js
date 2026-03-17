/**
 * Lightweight analytics adapter.
 * Queues events for any provider to consume via window.__hopium_analytics.
 */

export function trackPageView(path, title) {
  const event = { type: 'pageview', path, title, ts: Date.now() }
  if (window.__hopium_analytics) window.__hopium_analytics.push(event)
}

export function trackEvent(category, action, label, value) {
  const event = { type: 'event', category, action, label, value, ts: Date.now() }
  if (window.__hopium_analytics) window.__hopium_analytics.push(event)
}
