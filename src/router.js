/**
 * Minimal history-based router.
 *
 * router.add('/', homePage)
 * router.add('/bet/:id', betPage)
 * router.start()
 */

import { t } from './i18n.js'

const routes = []
let currentCleanup = null
let containerEl = null

function matchRoute(pathname) {
  for (const route of routes) {
    const match = route.pattern.exec(pathname)
    if (match) {
      const params = {}
      route.keys.forEach((key, i) => {
        params[key] = match[i + 1]
      })
      return { handler: route.handler, params }
    }
  }
  return null
}

function pathToRegex(path) {
  const keys = []
  const pattern = path
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key)
      return '([^/]+)'
    })
    .replace(/\//g, '\\/')
  return { pattern: new RegExp(`^${pattern}$`), keys }
}

export const router = {
  add(path, handler) {
    const { pattern, keys } = pathToRegex(path)
    routes.push({ pattern, keys, handler })
  },

  async resolve() {
    const pathname = window.location.pathname
    const search = window.location.search
    const match = matchRoute(pathname)

    if (currentCleanup) {
      currentCleanup()
      currentCleanup = null
    }

    if (!containerEl) return

    if (match) {
      // Parse query params
      const query = Object.fromEntries(new URLSearchParams(search))
      const result = await match.handler({ params: match.params, query })
      if (result) {
        if (typeof result === 'function') {
          // Handler returned a cleanup function after mounting
          currentCleanup = result
        } else if (result instanceof Node) {
          containerEl.innerHTML = ''
          containerEl.appendChild(result)
        }
      }
    } else {
      // 404
      containerEl.innerHTML = `
        <div class="page-empty">
          <h2>${t('notFound')}</h2>
          <p class="text-secondary">${t('notFoundDescription')}</p>
          <a href="/" class="btn btn-primary" data-link>${t('goHome')}</a>
        </div>
      `
    }

    window.dispatchEvent(new CustomEvent('hopium:route-change'))
  },

  navigate(url) {
    window.history.pushState(null, '', url)
    this.resolve()
  },

  setContainer(el) {
    containerEl = el
  },

  start() {
    // Handle popstate (back/forward)
    window.addEventListener('popstate', () => this.resolve())

    // Handle link clicks with data-link attribute
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]')
      if (link) {
        e.preventDefault()
        const href = link.getAttribute('href')
        if (href && href !== window.location.pathname + window.location.search) {
          this.navigate(href)
        }
      }
    })

    this.resolve()
  },
}
