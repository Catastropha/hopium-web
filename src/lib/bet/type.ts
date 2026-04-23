/**
 * Bet types — mirror `hopium-api/app/lib/bet/model.py` +
 * `hopium-api/app/apps/bet/model.py`.
 */

export interface BetBase {
  market_address: string;
  user_wallet: string;
  outcome_index: number;
  amount: string;
}

export interface BetRead extends BetBase {
  placed_at: string;
  placed_tx_hash: string;
  claimed: boolean;
  claim_amount: string | null;
  claim_tx_hash: string | null;
}

export interface BetIntentCreate {
  market_address: string;
  outcome_index: number;
  amount_ton: string;
}

export interface BetIntentRead {
  to: string;
  amount_nano: number;
  op: number;
  outcome_index: number;
  bet_amount_nano: number;
}
