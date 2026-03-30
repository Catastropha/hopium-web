import { html } from '../utils/dom.js'

/**
 * Create a proportional odds bar from outcomes.
 * Green (YES) / Red (NO) proportional split.
 * 6px height, fully rounded.
 *
 * @param {Array} outcomes - Array of outcome objects with { pool, label }
 * @returns {HTMLElement}
 */
export function createOddsBar(outcomes) {
  if (!outcomes || outcomes.length < 2) {
    return html`<div class="odds-bar" role="meter" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-label="Odds: 50/50">
      <div class="odds-bar__yes" style="flex: 50 0 0%"></div>
      <div class="odds-bar__no" style="flex: 50 0 0%"></div>
    </div>`
  }

  const yesPool = outcomes[0].pool || 0
  const noPool = outcomes[1].pool || 0
  const total = yesPool + noPool

  const yesPct = total > 0 ? Math.round((yesPool / total) * 100) : 50
  const noPct = 100 - yesPct

  const yesLabel = outcomes[0].label
    ? (typeof outcomes[0].label === 'object' ? outcomes[0].label.en : outcomes[0].label)
    : 'YES'
  const noLabel = outcomes[1].label
    ? (typeof outcomes[1].label === 'object' ? outcomes[1].label.en : outcomes[1].label)
    : 'NO'

  const el = html`
    <div
      class="odds-bar"
      role="meter"
      aria-valuenow="${yesPct}"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="${yesLabel} ${yesPct}%, ${noLabel} ${noPct}%"
    >
      <div class="odds-bar__yes" style="flex: ${yesPct} 0 0%"></div>
      <div class="odds-bar__no" style="flex: ${noPct} 0 0%"></div>
    </div>
  `

  return el
}

/**
 * Update an existing odds bar with new outcome data.
 * Triggers the CSS width transition.
 */
export function updateOddsBar(el, outcomes) {
  if (!el || !outcomes || outcomes.length < 2) return

  const yesPool = outcomes[0].pool || 0
  const noPool = outcomes[1].pool || 0
  const total = yesPool + noPool

  const yesPct = total > 0 ? Math.round((yesPool / total) * 100) : 50
  const noPct = 100 - yesPct

  const yesBar = el.querySelector('.odds-bar__yes')
  const noBar = el.querySelector('.odds-bar__no')

  if (yesBar) yesBar.style.flex = `${yesPct} 0 0%`
  if (noBar) noBar.style.flex = `${noPct} 0 0%`

  el.setAttribute('aria-valuenow', String(yesPct))

  const yesLabel = outcomes[0].label
    ? (typeof outcomes[0].label === 'object' ? outcomes[0].label.en : outcomes[0].label)
    : 'YES'
  const noLabel = outcomes[1].label
    ? (typeof outcomes[1].label === 'object' ? outcomes[1].label.en : outcomes[1].label)
    : 'NO'
  el.setAttribute('aria-label', `${yesLabel} ${yesPct}%, ${noLabel} ${noPct}%`)
}
