/**
 * Create a DOM element from an HTML string.
 */
export function html(strings, ...values) {
  const raw = String.raw({ raw: strings }, ...values)
  const tpl = document.createElement('template')
  tpl.innerHTML = raw.trim()
  return tpl.content.firstChild
}

/**
 * Create a document fragment from HTML.
 */
export function fragment(strings, ...values) {
  const raw = String.raw({ raw: strings }, ...values)
  const tpl = document.createElement('template')
  tpl.innerHTML = raw.trim()
  return tpl.content
}

/**
 * Mount element into container, replacing contents.
 */
export function mount(container, el) {
  container.innerHTML = ''
  if (typeof el === 'string') {
    container.innerHTML = el
  } else {
    container.appendChild(el)
  }
}

/**
 * Shorthand for querySelector.
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector)
}

/**
 * Shorthand for querySelectorAll.
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)]
}

/**
 * Escape HTML to prevent XSS.
 * String-based — no DOM allocation. Also escapes quotes for safe attribute use.
 */
const _escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => _escMap[c])
}
