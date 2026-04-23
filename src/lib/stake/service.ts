import { apiGet, apiPost } from '@/lib/api/client';

import type { StakeIntentCreate, StakeIntentRead, StakeRead } from './type';

export function getMyStake(): Promise<StakeRead | null> {
  return apiGet<StakeRead | null>('/v1/stakes/me');
}

export function stakeIntent(body: StakeIntentCreate): Promise<StakeIntentRead> {
  return apiPost<StakeIntentRead>('/v1/stakes/tx', body);
}
