/**
 * Vote types — mirror `hopium-api/app/lib/vote/model.py`.
 */

export interface VoteBase {
  market_address: string;
  voter_wallet: string;
  outcome_index: number;
  weight: string;
}

export interface VoteRead extends VoteBase {
  cast_at: string;
  cast_tx_hash: string;
  claimed: boolean;
  claim_amount: string | null;
  claim_tx_hash: string | null;
}
