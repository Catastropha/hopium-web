import { useQuery } from '@tanstack/react-query';

import { listLeaderboard } from './service';
import type { LeaderboardScope } from './type';

export function useLeaderboard(scope: LeaderboardScope) {
  return useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => listLeaderboard(scope),
  });
}
