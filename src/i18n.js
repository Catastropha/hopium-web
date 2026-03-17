const LS_KEY = 'hopium_lang'

let currentLang = localStorage.getItem(LS_KEY) || navigator.language?.split('-')[0] || 'en'

const SUPPORTED = ['en', 'ru', 'uk', 'pt', 'hi', 'ro']

// Ensure current lang is supported, fallback to en
if (!SUPPORTED.includes(currentLang)) currentLang = 'en'

/**
 * Localize a JSONB dict from the API.
 * localize({ en: "Hello", ru: "Привет" }) → "Hello"
 */
export function localize(dict) {
  if (!dict || typeof dict !== 'object') return ''
  if (dict[currentLang]) return dict[currentLang]
  const base = currentLang.split('-')[0]
  if (dict[base]) return dict[base]
  if (dict.en) return dict.en
  const values = Object.values(dict)
  return values[0] || ''
}

export function getLang() {
  return currentLang
}

export function setLang(lang) {
  if (SUPPORTED.includes(lang)) {
    currentLang = lang
    localStorage.setItem(LS_KEY, lang)
    document.documentElement.lang = lang
  }
}

// UI strings — minimal set for static interface text
const strings = {
  en: {
    home: 'Home',
    myBets: 'My Bets',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    login: 'Log in',
    logout: 'Log out',
    global: 'Global',
    all: 'All',
    active: 'Active',
    resolved: 'Resolved',
    loadMore: 'Load more',
    placeBet: 'Place Bet',
    pickSide: 'Pick your side',
    howMuch: 'How much?',
    potentialPayout: 'Potential payout',
    max: 'MAX',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    balance: 'Balance',
    noResults: 'No bets match your filters. Try a different category.',
    noBetsYet: 'No bets yet. Browse markets and find your conviction.',
    betPlaced: 'Bet placed',
    loginRequired: 'Log in to place your bet',
    continueWith: 'Continue with Telegram',
    browseFreely: 'Browse freely. Log in when you\'re ready to play.',
    remaining: 'remaining',
    pool: 'pool',
    bettors: 'bettors',
    staked: 'staked',
    yourBet: 'Your bet',
    won: 'Won',
    lost: 'Lost',
    share: 'Share',
    copied: 'Link copied',
    allTime: 'All Time',
    days30: '30 Days',
    days7: '7 Days',
    rank: 'Rank',
    user: 'User',
    winRate: 'Win Rate',
    streak: 'Streak',
    profit: 'Profit',
    totalPnL: 'Total P&L',
    pending: 'Pending',
    returned: 'Returned',
    transactions: 'Transactions',
    noTransactions: 'No transactions yet. Place a bet or deposit to get started.',
    depositVia: 'Deposit via Telegram',
    withdrawTo: 'Withdraw to Telegram',
    minBet: 'Minimum bet is 10 Stars',
    insufficientBalance: 'Not enough Stars. Deposit more to place this bet.',
    anonymous: 'Anonymous',
    selectBet: 'Select a bet to view details',
    resolution: 'Resolution criteria',
    skipToMain: 'Skip to main content',
    shortcuts: 'Keyboard shortcuts',
    betSuccess: 'Bet placed!',
    depositSuccess: 'Deposit initiated — complete in Telegram',
    withdrawSuccess: 'Withdrawal successful',
    error: 'Something went wrong. Try again.',
    paymentUnavailable: 'Payment service is temporarily unavailable. Try again later.',
    withdrawNoDeposit: 'You need to make at least one deposit before withdrawing.',
    withdrawInsufficient: 'Not enough Stars to withdraw that amount.',
    withdrawFailed: 'Withdrawal failed. Your balance has been restored. Try again later.',
    hopiumBestOnTelegram: 'Hopium is best on Telegram',
    openInTelegram: 'Open in Telegram',
    redirecting: 'Redirecting...',

    // Error messages
    retry: 'Retry',
    authFailed: 'Login failed. Please try again.',
    telegramLoadFailed: 'Couldn\'t load Telegram Login. Try refreshing the page.',
    offline: 'You\'re offline. Check your connection.',
    backOnline: 'Back online',
    authenticating: 'Logging in...',

    // Empty states
    noResultsFilter: 'No bets match your filters. Try a different category.',
    noLeaderboardData: 'No rankings yet for this time period.',

    // Share page
    winTitle: 'Winning Prediction',
    winDescription: 'Someone nailed it on Hopium.',
    streakTitle: 'Winning Streak',
    streakDescription: 'Someone\'s on fire on Hopium.',
    sharedLink: 'Shared Link',
    sharedLinkDescription: 'Check it out on Hopium.',
    viewBet: 'View the Bet',
    browseMarkets: 'Browse Markets',
    linkNotFound: 'This link doesn\'t exist or has expired.',

    // Home hero (unauthenticated)
    heroTitle: 'Prediction Markets',
    heroSub: 'Pick a side. Back your conviction.',
    heroHint: 'Browse freely — log in when you\'re ready to bet.',

    // Mobile redirect
    mobileTitle: 'Hopium is best on Telegram',
    mobileDescription: 'Get the full experience in the Telegram app.',
    mobileHeadline: 'Prediction markets with real stakes.',
    mobileSub: 'Pick a side on real-world events. Win when you\'re right.',
    mobileFooter: 'The full experience lives in Telegram.',
    mobileNoTelegram: 'Don\'t have Telegram?',
    mobileGetTelegram: 'Get it free',
    mobileBetShared: 'Someone shared a prediction with you.',

    // 404
    notFound: 'Page not found',
    notFoundDescription: 'This page doesn\'t exist.',
    goHome: 'Go home',

    // Accessibility
    mainNav: 'Main navigation',
    filters: 'Filters',
    categoryFilter: 'Category filter',
    bets: 'Bets',
    yourBets: 'Your bets',
    betDetails: 'Bet details',
    closeDetails: 'Close details',
    close: 'Close',
    dismiss: 'Dismiss',
    stakeAmount: 'Stake amount',
    depositAmount: 'Deposit amount',
    withdrawAmount: 'Withdraw amount',

    // Transaction types
    txDeposit: 'Deposit',
    txBetPlaced: 'Bet Placed',
    txPayout: 'Payout',
    txWithdrawal: 'Withdrawal',

    // Keyboard shortcuts
    kbNextBet: 'Next bet',
    kbPrevBet: 'Previous bet',
    kbOpenBet: 'Open selected bet',
    kbClosePanel: 'Close detail panel',
    kbHome: 'Home',
    kbMyBets: 'My Bets',
    kbLeaderboard: 'Leaderboard',
    kbProfile: 'Profile',
    kbYes: 'Select YES',
    kbNo: 'Select NO',
    kbFilter: 'Focus filter bar',
    kbShortcuts: 'Show shortcuts',
  },
}

/**
 * Get a UI string by key.
 */
export function t(key) {
  const dict = strings[currentLang] || strings.en
  return dict[key] || strings.en[key] || key
}
