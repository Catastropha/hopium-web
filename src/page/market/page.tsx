import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { formatCountdown, formatDate } from '@/lib/format/time';
import { useMarket } from '@/lib/market/hook';
import { AddressChip } from '@/lib/ui/AddressChip';
import { Card } from '@/lib/ui/Card';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PhaseBadge } from '@/lib/ui/PhaseBadge';
import { FullScreenSpinner } from '@/lib/ui/Spinner';
import { TierBadge } from '@/lib/ui/TierBadge';
import { TonAmount } from '@/lib/ui/TonAmount';

import { BetForm } from './BetForm';
import { OutcomeBar } from './OutcomeBar';
import { VotePanel } from './VotePanel';

export function MarketPage() {
  const { address } = useParams<{ address: string }>();
  const { data, isPending, isError } = useMarket(address);

  if (isPending) return <FullScreenSpinner />;
  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Market not found"
        description="It may have expired or the link is wrong."
      />
    );
  }

  const { market, outcomes } = data;
  const isOpen = market.phase === 0;
  const isVoting = market.phase === 1;
  const isResolved = market.phase === 2;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={market.phase} />
            <TierBadge tier={market.tier} />
            <span className="text-xs text-fg-muted">
              {isOpen && `Closes ${formatCountdown(market.betting_deadline)}`}
              {isVoting && `Voting ends ${formatCountdown(market.voting_deadline)}`}
              {isResolved &&
                market.resolved_at &&
                `Resolved ${formatDate(market.resolved_at)}`}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {market.topic_text ?? '(topic pending from indexer)'}
          </h1>
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
            <span>Pool</span>
            <TonAmount amount={market.total_pool} className="text-fg" />
          </div>
          <OutcomeBar outcomes={outcomes} winningOutcome={market.winning_outcome} />
        </Card>

        <Card padded>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Creator</p>
          <div className="mt-1">
            <AddressChip address={market.creator_wallet} />
          </div>
        </Card>
      </div>

      <aside className="flex flex-col gap-4">
        {isOpen && address && <BetForm marketAddress={address} outcomes={outcomes} />}
        {isVoting && address && <VotePanel marketAddress={address} outcomes={outcomes} />}
        {isResolved && (
          <Card>
            <p className="text-sm text-fg-muted">
              Winning outcome:{' '}
              <strong className="text-fg">#{market.winning_outcome}</strong>
            </p>
          </Card>
        )}
      </aside>
    </div>
  );
}
