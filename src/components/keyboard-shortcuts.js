import { html, $, $$ } from '../utils/dom.js'
import { t } from '../i18n.js'
import { store } from '../store.js'
import { router } from '../router.js'

const SHORTCUTS = [
  { key: 'j', descKey: 'kbNextBet' },
  { key: 'k', descKey: 'kbPrevBet' },
  { key: 'Enter', descKey: 'kbOpenBet' },
  { key: 'Escape', descKey: 'kbClosePanel' },
  { key: '1', descKey: 'kbHome' },
  { key: '2', descKey: 'kbMyBets' },
  { key: '3', descKey: 'kbLeaderboard' },
  { key: '4', descKey: 'kbProfile' },
  { key: 'y', descKey: 'kbYes' },
  { key: 'n', descKey: 'kbNo' },
  { key: 'f', descKey: 'kbFilter' },
  { key: '?', descKey: 'kbShortcuts' },
]

const TAB_ROUTES = ['/', '/my-bets', '/leaders', '/profile']

let overlayEl = null
let isOverlayVisible = false
let previousFocus = null

/**
 * Initialize global keyboard shortcut handling.
 * Call once at app startup.
 */
export function initKeyboardShortcuts() {
  document.addEventListener('keydown', handleGlobalKeydown)
}

function handleGlobalKeydown(e) {
  // Skip if input/textarea is focused
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
    // Allow Escape to blur inputs
    if (e.key === 'Escape') {
      e.target.blur()
    }
    return
  }

  // Skip if modifier keys are held (except Shift for ?)
  if (e.ctrlKey || e.metaKey || e.altKey) return

  switch (e.key) {
    case 'j':
      e.preventDefault()
      moveBetSelection(1)
      break

    case 'k':
      e.preventDefault()
      moveBetSelection(-1)
      break

    case 'Enter':
      e.preventDefault()
      openSelectedBet()
      break

    case 'Escape':
      e.preventDefault()
      if (isOverlayVisible) {
        hideShortcutsOverlay()
      } else {
        closeDetailPanel()
      }
      break

    case '1':
    case '2':
    case '3':
    case '4': {
      e.preventDefault()
      const idx = parseInt(e.key, 10) - 1
      if (TAB_ROUTES[idx]) {
        router.navigate(TAB_ROUTES[idx])
      }
      break
    }

    case 'y':
      // Handled by bet-detail component directly
      break

    case 'n':
      // Handled by bet-detail component directly
      break

    case 'f':
      e.preventDefault()
      focusFilterBar()
      break

    case '?':
      e.preventDefault()
      if (isOverlayVisible) {
        hideShortcutsOverlay()
      } else {
        showShortcutsOverlay()
      }
      break
  }
}

/**
 * Move the bet card selection by a delta (1 = next, -1 = previous).
 */
function moveBetSelection(delta) {
  const cards = $$('.bet-card:not(.bet-card--skeleton)')
  if (cards.length === 0) return

  const currentId = store.get('selectedBetId')
  let currentIndex = cards.findIndex((c) => c.dataset.betId === currentId)

  if (currentIndex === -1) {
    // Nothing selected — select first or last
    currentIndex = delta > 0 ? 0 : cards.length - 1
  } else {
    currentIndex += delta
    if (currentIndex < 0) currentIndex = 0
    if (currentIndex >= cards.length) currentIndex = cards.length - 1
  }

  const card = cards[currentIndex]
  if (!card) return

  const betId = card.dataset.betId
  store.set({ selectedBetId: betId })

  // Scroll the card into view
  card.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  card.focus()
}

/**
 * Open the currently selected bet in the detail panel.
 */
function openSelectedBet() {
  const betId = store.get('selectedBetId')
  if (!betId) return

  router.navigate(`/bet/${betId}`)
  window.dispatchEvent(new CustomEvent('hopium:bet-select', { detail: { betId } }))
}

/**
 * Close the detail panel.
 */
function closeDetailPanel() {
  store.set({ selectedBetId: null })
  window.dispatchEvent(new CustomEvent('hopium:detail-close'))
}

/**
 * Focus the filter bar.
 */
function focusFilterBar() {
  const filterBar = $('.filter-bar')
  if (filterBar && typeof filterBar.focus === 'function') {
    filterBar.focus()
  }
}

/**
 * Show the keyboard shortcuts overlay modal.
 */
export function showShortcutsOverlay() {
  if (isOverlayVisible) return

  if (!overlayEl) {
    const rows = SHORTCUTS.map((s) => `
      <div class="shortcuts__row">
        <kbd class="shortcuts__key">${s.key}</kbd>
        <span class="shortcuts__desc">${t(s.descKey)}</span>
      </div>
    `).join('')

    overlayEl = html`
      <div class="shortcuts-overlay" role="dialog" aria-modal="true" aria-label="${t('shortcuts')}">
        <div class="shortcuts-overlay__backdrop"></div>
        <div class="shortcuts-overlay__panel">
          <div class="shortcuts-overlay__header">
            <h2 class="shortcuts-overlay__title">${t('shortcuts')}</h2>
            <button class="shortcuts-overlay__close" aria-label="${t('close')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="shortcuts-overlay__body">
            ${rows}
          </div>
        </div>
      </div>
    `

    overlayEl.querySelector('.shortcuts-overlay__backdrop').addEventListener('click', hideShortcutsOverlay)
    overlayEl.querySelector('.shortcuts-overlay__close').addEventListener('click', hideShortcutsOverlay)

    // Focus trap — Tab cycles to close button
    overlayEl.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        overlayEl.querySelector('.shortcuts-overlay__close')?.focus()
      }
    })
  }

  previousFocus = document.activeElement
  document.body.appendChild(overlayEl)
  isOverlayVisible = true

  requestAnimationFrame(() => {
    overlayEl.querySelector('.shortcuts-overlay__close')?.focus()
  })
}

/**
 * Hide the keyboard shortcuts overlay.
 */
function hideShortcutsOverlay() {
  if (!isOverlayVisible || !overlayEl) return
  overlayEl.remove()
  isOverlayVisible = false
  if (previousFocus && previousFocus.focus) previousFocus.focus()
  previousFocus = null
}
