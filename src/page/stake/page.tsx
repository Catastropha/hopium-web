import { AlertCircle, Wallet } from 'lucide-react';

import { useSession } from '@/lib/auth/hook';
import { ECON } from '@/lib/chain/opcode';
import { formatDate } from '@/lib/format/time';
import { useMyStake } from '@/lib/stake/hook';
import { Card } from '@/lib/ui/Card';
import { ConnectGate } from '@/lib/ui/ConnectGate';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PageHeader } from '@/lib/ui/PageHeader';
import { FullScreenSpinner } from '@/lib/ui/Spinner';
import { TonAmount } from '@/lib/ui/TonAmount';

import { StakeForm } from './StakeForm';

export function StakePage() {
  const session = useSession();

  return (
    <>
      <PageHeader
        title="Staking"
        subtitle={`Minimum ${ECON.STAKING_MIN_AMOUNT_TON} TON · ${ECON.STAKING_LOCK_DAYS}-day lock`}
      />
      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div>
          <CreatorBonusHint />
        </div>
        <aside>
          <ConnectGate cta="Connect your wallet to stake TON">
            {session && <StakeBody />}
          </ConnectGate>
        </aside>
      </div>
    </>
  );
}

function StakeBody() {
  const { data, isPending, isError } = useMyStake();
  if (isPending) return <FullScreenSpinner />;
  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load stake"
        description="Check your connection."
      />
    );
  }

  const staked = data?.amount ?? '0';

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted">
          <Wallet size={14} /> Your stake
        </div>
        <TonAmount amount={staked} className="text-4xl font-semibold tracking-tight" />
        {data?.locked_until && (
          <p className="mt-2 text-sm text-fg-muted">
            Locked until {formatDate(data.locked_until, { withTime: true })}
          </p>
        )}
      </Card>
      <StakeForm currentStaked={staked} />
    </div>
  );
}

function CreatorBonusHint() {
  return (
    <Card className="border-accent/30 bg-accent-subtle">
      <p className="text-sm text-fg-muted">
        Stake{' '}
        <strong className="text-fg">
          {ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON
        </strong>{' '}
        to earn a 10% creator bonus on every market you create. Correct voters
        also share 30% of the platform fee on resolved markets.
      </p>
    </Card>
  );
}
