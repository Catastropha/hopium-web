import { apiGet, apiPost } from '@/lib/api/client';

import type {
  MarketDetailRead,
  MarketIntentCreate,
  MarketIntentRead,
  MarketRead,
} from './type';

export function listMarkets(): Promise<MarketRead[]> {
  return apiGet<MarketRead[]>('/v1/markets');
}

export function readMarket(address: string): Promise<MarketDetailRead> {
  return apiGet<MarketDetailRead>(`/v1/markets/${encodeURIComponent(address)}`);
}

export function createMarketIntent(body: MarketIntentCreate): Promise<MarketIntentRead> {
  return apiPost<MarketIntentRead>('/v1/markets/tx', body);
}
