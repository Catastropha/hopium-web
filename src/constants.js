export const BASE_URL = 'https://hopium.bet'
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://live-api.hopium.bet'
export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'hopiumbetbot'

export const TMA_URL = `https://t.me/${BOT_USERNAME}/app`

export const CATEGORIES = ['Sports', 'Politics', 'Crypto', 'Culture', 'Tech']

export const CATEGORY_COLORS = {
  Crypto: 'var(--cat-crypto)',
  Sports: 'var(--cat-sports)',
  Politics: 'var(--cat-politics)',
  Culture: 'var(--cat-culture)',
  Tech: 'var(--cat-tech)',
}

export const MIN_BET = 100 // $1.00 in cents
export const MIN_DEPOSIT = 100 // $1.00 in cents
export const MIN_WITHDRAWAL = 1000 // $10.00 in cents
export const PLATFORM_FEE = 0.05
