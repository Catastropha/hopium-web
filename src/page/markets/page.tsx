import { Sparkles } from 'lucide-react';

import { useMarkets } from '@/lib/market/hook';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PageHeader } from '@/lib/ui/PageHeader';
import { Skeleton } from '@/lib/ui/Skeleton';

import { MarketCard } from './MarketCard';

export function MarketsPage() {
  const { data, isPending, isError } = useMarkets();

  return (
    <>
      <PageHeader
        title="Live markets"
        subtitle="Bet, vote, and claim across every active prediction market on TON."
      />
      {isPending && <SkeletonGrid />}
      {isError && (
        <EmptyState
          icon={Sparkles}
          title="Couldn't load markets"
          description="Refresh the page to retry."
        />
      )}
      {data && data.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No markets yet"
          description="Be the first — deploy one in under a minute."
        />
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => <MarketCard key={m.address} market={m} />)}
        </div>
      )}
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
