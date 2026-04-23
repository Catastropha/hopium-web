import { Trophy } from 'lucide-react';
import { useState } from 'react';

import { useLeaderboard } from '@/lib/leaderboard/hook';
import type { LeaderboardScope } from '@/lib/leaderboard/type';
import { cn } from '@/lib/_kit/cn';
import { AddressChip } from '@/lib/ui/AddressChip';
import { Card } from '@/lib/ui/Card';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PageHeader } from '@/lib/ui/PageHeader';
import { FullScreenSpinner } from '@/lib/ui/Spinner';
import { TonAmount } from '@/lib/ui/TonAmount';

export function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>('weekly');
  const { data, isPending } = useLeaderboard(scope);

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Top earners. Weekly board pays 20% of the platform fee."
      />
      <div className="mb-6 inline-flex rounded-xl border border-border bg-bg-elevated p-1">
        <ScopeButton active={scope === 'weekly'} onClick={() => setScope('weekly')}>
          Weekly
        </ScopeButton>
        <ScopeButton active={scope === 'all_time'} onClick={() => setScope('all_time')}>
          All-time
        </ScopeButton>
      </div>
      {isPending && <FullScreenSpinner />}
      {data && data.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="Nobody on the board yet"
          description="Place bets to climb the ranks."
        />
      )}
      {data && data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.map((entry) => (
            <Card key={`${entry.rank}-${entry.user_wallet}`}>
              <div className="flex items-center gap-4">
                <span className="w-8 text-right text-sm font-semibold text-fg-muted">
                  {entry.rank}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.display_name ?? 'Anonymous'}</p>
                  <AddressChip address={entry.user_wallet} link={false} />
                </div>
                <TonAmount amount={entry.score} compact className="text-accent" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-bg-subtle text-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
