export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.hopium.app'
export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'HopiumBot'

export const TMA_URL = `https://t.me/${BOT_USERNAME}/app`

export const CATEGORIES = ['Sports', 'Politics', 'Crypto', 'Culture', 'Tech']

export const CATEGORY_COLORS = {
  Crypto: 'var(--cat-crypto)',
  Sports: 'var(--cat-sports)',
  Politics: 'var(--cat-politics)',
  Culture: 'var(--cat-culture)',
  Tech: 'var(--cat-tech)',
}

export const MIN_BET = 10
export const PLATFORM_FEE = 0.05
