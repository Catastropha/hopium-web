/**
 * Mirror of `../hopium-contracts/wrappers/opcodes.ts`. The web and the
 * contract wrappers must ship identical values — drift silently misroutes
 * messages. Keep this file in lockstep with the source on any contract
 * deploy.
 *
 * Last sync: matches hopium-contracts 1.0 (see CLAUDE.md · Chain constants).
 */

export const OP = {
  // Staking user-facing
  STAKE: 0x01000001,
  UNSTAKE: 0x01000002,
  SUBMIT_VOTE: 0x01000003,

  // Factory user-facing
  CREATE_MARKET: 0x10000001,

  // Market user-facing
  PLACE_BET: 0x20000001,
  RESOLVE: 0x20000002,
  CLAIM: 0x20000003,
  CLAIM_VOTER_REWARD: 0x20000004,

  // Cross-contract
  VERIFY_CREATOR_STAKE: 0x30000001,
  CREATOR_STAKE_VERDICT: 0x30000002,
  VOTE_CAST: 0x30000003,
} as const;

export const ERR = {
  NotOwner: 100,
  Paused: 101,
  InsufficientGas: 102,
  ZeroAddress: 103,
  WouldBreachReserve: 104,
  ZeroAmount: 105,
  NotStaking: 106,
  NotFactory: 107,
  NotMarket: 108,
  WrongWorkchain: 109,

  StakeBelowMin: 130,
  StakeLocked: 131,
  NoStake: 132,
  StakeInsufficient: 133,
  NotVoter: 134,
  VoteWeightZero: 135,
  NotInitialized: 137,

  CreateFeeMismatch: 160,
  InvalidTier: 161,
  InvalidOutcomeCount: 162,
  MarketCodeUnset: 163,

  NotBettingPhase: 190,
  NotVotingPhase: 191,
  NotResolved: 192,
  AlreadyResolved: 193,
  ResolutionTooEarly: 194,
  OutcomeOutOfRange: 195,
  BetBelowMin: 196,
  AlreadyVoted: 197,
  NoWinningBet: 198,
  NoWinningVote: 199,
  AlreadyClaimed: 200,
  VerdictAlreadySet: 201,
  NoPool: 202,
  VerdictIneligible: 203,
} as const;

export const TIER = {
  ONE_DAY: 1,
  THREE_DAYS: 3,
  SEVEN_DAYS: 7,
  FOURTEEN_DAYS: 14,
} as const;

export type Tier = (typeof TIER)[keyof typeof TIER];
export const VALID_TIERS: readonly Tier[] = [
  TIER.ONE_DAY,
  TIER.THREE_DAYS,
  TIER.SEVEN_DAYS,
  TIER.FOURTEEN_DAYS,
];

export const PHASE = {
  BETTING: 0,
  VOTING: 1,
  RESOLVED: 2,
} as const;

export type Phase = (typeof PHASE)[keyof typeof PHASE];

/** Economic constants surfaced in UI copy. Must match `opcodes.ts · ECON`. */
export const ECON = {
  CREATION_FEE_TON: 19,
  MARKET_SEED_AMOUNT_TON: 14,
  TREASURY_DEPLOY_CUT_TON: 5,
  STAKING_MIN_AMOUNT_TON: 10,
  STAKING_LOCK_DAYS: 30,
  CREATOR_BONUS_THRESHOLD_TON: 500,
  VOTING_WINDOW_HOURS: 48,
  MARKET_MIN_BET_TON: 0.1,
  MARKET_MIN_OUTCOMES: 2,
  MARKET_MAX_OUTCOMES: 8,
  PLATFORM_FEE_BPS: 1000,
} as const;
