import { store } from '../store.js'
import { createBetDetail } from '../components/bet-detail.js'
import { homePage } from './home.js'

/**
 * Bet detail page — direct URL to /bet/:id.
 * Loads the home feed as main content and opens the detail panel for the specific bet.
 */
export async function betPage({ params, query, container, detailPanel }) {
  const betId = params.id
  const cleanups = []

  // Set the selected bet in store so the home page highlights it
  store.set({ selectedBetId: betId })

  // Render the home page as the main content
  const homeCleanup = await homePage({ params: {}, query, container, detailPanel })
  if (homeCleanup) cleanups.push(homeCleanup)

  // Open the detail panel with the bet detail component
  if (detailPanel) {
    const detailEl = createBetDetail(betId)
    detailPanel.open(detailEl)
  }

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
