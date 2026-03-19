import { html } from '../utils/dom.js'

/**
 * Create a skeleton loading placeholder for a bet card.
 * Matches the bet card layout with pulsing rectangles.
 */
export function createCardSkeleton() {
  return html`
    <div class="bet-card bet-card--skeleton" aria-hidden="true">
      <div class="bet-card__header">
        <div class="skeleton skeleton--circle" style="width:10px;height:10px"></div>
        <div class="skeleton skeleton--text" style="width:60px;height:13px;margin-inline-start:8px"></div>
        <div class="skeleton skeleton--text" style="width:70px;height:13px;margin-inline-start:auto"></div>
      </div>
      <div class="skeleton skeleton--text" style="width:90%;height:17px;margin-top:12px"></div>
      <div class="skeleton skeleton--text" style="width:65%;height:17px;margin-top:6px"></div>
      <div class="skeleton skeleton--bar" style="width:100%;height:6px;margin-top:12px;border-radius:3px"></div>
      <div class="bet-card__odds-labels" style="margin-top:8px">
        <div class="skeleton skeleton--text" style="width:80px;height:15px"></div>
        <div class="skeleton skeleton--text" style="width:80px;height:15px"></div>
      </div>
      <div class="bet-card__footer" style="margin-top:12px">
        <div class="skeleton skeleton--text" style="width:100px;height:13px"></div>
        <div class="skeleton skeleton--text" style="width:70px;height:13px"></div>
      </div>
    </div>
  `
}

/**
 * Create a skeleton loading placeholder for the detail panel.
 * Matches the bet detail layout.
 */
export function createDetailSkeleton() {
  return html`
    <div class="bet-detail bet-detail--skeleton" aria-hidden="true">
      <div class="bet-detail__close-row">
        <div class="skeleton skeleton--circle" style="width:32px;height:32px"></div>
      </div>
      <div class="skeleton skeleton--rect" style="width:100%;height:200px;border-radius:var(--r-md);margin-top:16px"></div>
      <div class="skeleton skeleton--text" style="width:60px;height:13px;margin-top:16px"></div>
      <div class="skeleton skeleton--text" style="width:100%;height:22px;margin-top:12px"></div>
      <div class="skeleton skeleton--text" style="width:80%;height:22px;margin-top:6px"></div>
      <div style="display:flex;gap:16px;margin-top:16px">
        <div class="skeleton skeleton--text" style="width:80px;height:13px"></div>
        <div class="skeleton skeleton--text" style="width:100px;height:13px"></div>
        <div class="skeleton skeleton--text" style="width:60px;height:13px"></div>
      </div>
      <div class="skeleton skeleton--text" style="width:100%;height:15px;margin-top:24px"></div>
      <div class="skeleton skeleton--text" style="width:100%;height:15px;margin-top:6px"></div>
      <div class="skeleton skeleton--text" style="width:70%;height:15px;margin-top:6px"></div>
      <div class="skeleton skeleton--rect" style="width:100%;height:80px;border-radius:var(--r-md);margin-top:24px"></div>
      <div class="skeleton skeleton--text" style="width:120px;height:15px;margin-top:24px"></div>
      <div style="display:flex;gap:12px;margin-top:12px">
        <div class="skeleton skeleton--rect" style="flex:1;height:90px;border-radius:var(--r-md)"></div>
        <div class="skeleton skeleton--rect" style="flex:1;height:90px;border-radius:var(--r-md)"></div>
      </div>
    </div>
  `
}

/**
 * Create skeleton loading placeholder for table rows.
 *
 * @param {number} [rows=5] - Number of skeleton rows to render.
 */
export function createTableSkeleton(rows = 5) {
  const rowsHtml = Array.from({ length: rows }, () => `
    <tr class="skeleton-row" aria-hidden="true">
      <td><div class="skeleton skeleton--text" style="width:30px;height:15px"></div></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="skeleton skeleton--circle" style="width:32px;height:32px"></div>
          <div class="skeleton skeleton--text" style="width:100px;height:15px"></div>
        </div>
      </td>
      <td><div class="skeleton skeleton--text" style="width:50px;height:15px"></div></td>
      <td><div class="skeleton skeleton--text" style="width:40px;height:15px"></div></td>
      <td><div class="skeleton skeleton--text" style="width:70px;height:15px"></div></td>
    </tr>
  `).join('')

  return html`
    <tbody class="skeleton-table">
      ${rowsHtml}
    </tbody>
  `
}
