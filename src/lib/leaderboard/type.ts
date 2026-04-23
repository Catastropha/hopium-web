/**
 * Leaderboard types — mirror `hopium-api/app/lib/leaderboard/model.py`.
 */

export type LeaderboardScope = 'weekly' | 'all_time';

export interface LeaderboardEntryRead {
  rank: number;
  user_wallet: string;
  display_name: string | null;
  score: string;
}
