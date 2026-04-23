import { Wallet } from 'lucide-react';
import { useState } from 'react';

import { useSession } from '@/lib/auth/hook';
import { useMyBets } from '@/lib/bet/hook';
import { useMarkets } from '@/lib/market/hook';
import { cn } from '@/lib/_kit/cn';
import { ConnectGate } from '@/lib/ui/ConnectGate';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PageHeader } from '@/lib/ui/PageHeader';
import { FullScreenSpinner } from '@/lib/ui/Spinner';

import { BetRow } from './BetRow';
import { MarketRow } from './MarketRow';

type Tab = 'bets' | 'markets';

export function MyBetsPage() {
  const [tab, setTab] = useState<Tab>('bets');
  const session = useSession();

  return (
    <>
      <PageHeader title="My activity" />
      <div className="mb-6 inline-flex rounded-xl border border-border bg-bg-elevated p-1">
        <TabButton active={tab === 'bets'} onClick={() => setTab('bets')}>
          Bets
        </TabButton>
        <TabButton active={tab === 'markets'} onClick={() => setTab('markets')}>
          My markets
        </TabButton>
      </div>
      <ConnectGate cta="Connect your wallet to see your activity">
        {session && tab === 'bets' && <BetsTab />}
        {session && tab === 'markets' && <MarketsTab wallet={session.wallet_address} />}
      </ConnectGate>
    </>
  );
}

function TabButton({
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

function BetsTab() {
  const { data, isPending } = useMyBets();
  if (isPending) return <FullScreenSpinner />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No bets yet"
        description="Open a market and place your first bet."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((b) => (
        <BetRow key={`${b.market_address}-${b.placed_tx_hash}`} bet={b} />
      ))}
    </div>
  );
}

function MarketsTab({ wallet }: { wallet: string }) {
  const { data, isPending } = useMarkets();
  const mine = data?.filter((m) => m.creator_wallet === wallet) ?? [];
  if (isPending) return <FullScreenSpinner />;
  if (mine.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No markets yet"
        description="Markets you deploy show up here."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {mine.map((m) => (
        <MarketRow key={m.address} market={m} />
      ))}
    </div>
  );
}
