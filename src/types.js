/**
 * @file API data shape typedefs for Hopium Web.
 * Import in JSDoc annotations: @type {import('./types.js').Bet}
 */

// ── Localized String ─────────────────────────────────────────────

/** @typedef {Object<string, string>} LocalizedString */

// ── Outcome ──────────────────────────────────────────────────────

/**
 * @typedef {Object} Outcome
 * @property {string} id
 * @property {LocalizedString|string} label
 * @property {number} pool - Total stars staked on this outcome
 * @property {number} [odds] - Current payout multiplier
 * @property {boolean} [is_winner] - True if this outcome won (resolved bets only)
 */

// ── User Position ────────────────────────────────────────────────

/**
 * @typedef {Object} UserPosition
 * @property {string} outcome_id
 * @property {number} amount - Stars staked by the user
 * @property {number} [payout] - Stars paid out (resolved bets only)
 */

// ── Bet ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} Bet
 * @property {string} id
 * @property {LocalizedString} title
 * @property {LocalizedString} [description]
 * @property {LocalizedString} [resolution_criteria]
 * @property {string} category - One of: Sports, Politics, Crypto, Culture, Tech
 * @property {string} [image_url]
 * @property {string} resolution_date - ISO 8601 datetime
 * @property {number} total_pool
 * @property {'active'|'resolved'} status
 * @property {Outcome[]} outcomes
 * @property {UserPosition[]} [user_positions] - Present when authenticated
 * @property {number} [user_position_total] - Sum of user positions
 */

// ── Paginated Response ───────────────────────────────────────────

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {string|null} prev - Cursor for next page
 */

// ── Country ──────────────────────────────────────────────────────

/**
 * @typedef {Object} Country
 * @property {string} code - ISO 3166-1 alpha-2
 * @property {LocalizedString} name
 * @property {string} [flag_emoji]
 */

// ── Leaderboard Entry ────────────────────────────────────────────

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} user_id
 * @property {string} [username]
 * @property {number} rank
 * @property {number} total_profit
 * @property {number} win_rate - 0-1 decimal
 * @property {number} current_streak
 */

// ── Auth Response ────────────────────────────────────────────────

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {number} token_exp - Unix timestamp (seconds)
 * @property {string} refresh_token
 * @property {number} refresh_token_exp - Unix timestamp (seconds)
 * @property {string} user_id
 */

// ── Telegram Auth Data ───────────────────────────────────────────

/**
 * @typedef {Object} TelegramAuthData
 * @property {number} id
 * @property {string} first_name
 * @property {string} [last_name]
 * @property {string} [username]
 * @property {string} [photo_url]
 * @property {number} auth_date
 * @property {string} hash
 */

// ── Balance Response ─────────────────────────────────────────────

/**
 * @typedef {Object} BalanceResponse
 * @property {number} balance
 */

// ── Transaction ──────────────────────────────────────────────────

/**
 * @typedef {Object} Transaction
 * @property {string} type - deposit, bet_placed, payout, withdrawal
 * @property {number} amount
 * @property {string} created_at - ISO 8601 datetime
 */

// ── Position Response ────────────────────────────────────────────

/**
 * @typedef {Object} PositionResponse
 * @property {number} [new_balance]
 */

// ── Share ────────────────────────────────────────────────────────

/**
 * @typedef {Object} ShareCreateResponse
 * @property {string} share_url
 */

/**
 * @typedef {Object} Share
 * @property {string} type - bet, win, streak
 * @property {string} reference_id
 * @property {string} created_at - ISO 8601 datetime
 * @property {number} click_count
 */

// ── Deposit / Withdraw ───────────────────────────────────────────

/**
 * @typedef {Object} DepositResponse
 * @property {string} [invoice_url]
 */

/**
 * @typedef {Object} WithdrawResponse
 * @property {number} [new_balance]
 */

export {}
