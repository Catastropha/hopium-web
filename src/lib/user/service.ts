import { apiGet } from '@/lib/api/client';

import type { UserRead } from './type';

export function getMe(): Promise<UserRead> {
  return apiGet<UserRead>('/v1/me');
}
