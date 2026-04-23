import { apiGet, apiPost } from '@/lib/api/client';

import type { BetIntentCreate, BetIntentRead, BetRead } from './type';

export function listMyBets(): Promise<BetRead[]> {
  return apiGet<BetRead[]>('/v1/bets/me');
}

export function listMarketBets(address: string): Promise<BetRead[]> {
  return apiGet<BetRead[]>(`/v1/bets/market/${encodeURIComponent(address)}`);
}

export function placeBetIntent(body: BetIntentCreate): Promise<BetIntentRead> {
  return apiPost<BetIntentRead>('/v1/bets/tx', body);
}
