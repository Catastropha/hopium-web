import { apiGet } from '@/lib/api/client';

import type { LeaderboardEntryRead, LeaderboardScope } from './type';

export function listLeaderboard(scope: LeaderboardScope): Promise<LeaderboardEntryRead[]> {
  return apiGet<LeaderboardEntryRead[]>('/v1/leaderboard', { query: { scope } });
}
