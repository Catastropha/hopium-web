/**
 * Stake types — mirror `hopium-api/app/lib/stake/model.py` +
 * `hopium-api/app/apps/stake/model.py`.
 */

export interface StakeBase {
  user_wallet: string;
  amount: string;
  locked_until: string;
}

export interface StakeRead extends StakeBase {
  first_staked_at: string;
  updated_at: string;
}

export type StakeAction = 'stake' | 'unstake';

export interface StakeIntentCreate {
  action: StakeAction;
  amount_ton: string;
}

export interface StakeIntentRead {
  to: string;
  amount_nano: number;
  op: number;
  stake_amount_nano: number;
}
