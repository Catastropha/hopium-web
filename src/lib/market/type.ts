/**
 * Market types — mirror `hopium-api/app/lib/market/model.py` +
 * `hopium-api/app/apps/market/model.py`. Decimal amounts are strings.
 */

export type MarketPhase = 0 | 1 | 2;

export interface MarketBase {
  address: string;
  creator_wallet: string;
  tier: number;
  outcome_count: number;
  topic_hash: string;
}

export interface MarketRead extends MarketBase {
  topic_text: string | null;
  phase: MarketPhase;
  betting_deadline: string;
  voting_deadline: string;
  winning_outcome: number | null;
  total_pool: string;
  prize_pool: string;
  staker_reward_pool: string;
  creator_bonus_eligible: boolean;
  creation_tx_hash: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketOutcomeRead {
  market_address: string;
  outcome_index: number;
  bet_total: string;
  vote_total: string;
}

export interface MarketDetailRead {
  market: MarketRead;
  outcomes: MarketOutcomeRead[];
}

export interface MarketIntentCreate {
  tier: number;
  outcome_count: number;
  topic_hash: string;
}

export interface MarketIntentRead {
  to: string;
  amount_nano: number;
  op: number;
  tier: number;
  outcome_count: number;
  topic_hash: string;
}
