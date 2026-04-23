import { useState } from 'react';

import { userMessage } from '@/lib/api/error';
import { ECON } from '@/lib/chain/opcode';
import { isValidTonAmount } from '@/lib/format/ton';
import { useStakeAction } from '@/lib/stake/hook';
import type { StakeAction } from '@/lib/stake/type';
import { cn } from '@/lib/_kit/cn';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { useToast } from '@/lib/ui/Toast';

interface Props {
  currentStaked: string;
}

export function StakeForm({ currentStaked }: Props) {
  const toast = useToast();
  const { mutateAsync, isPending } = useStakeAction();
  const [action, setAction] = useState<StakeAction>('stake');
  const [amount, setAmount] = useState('');

  const parsed = Number(amount);
  const valid =
    isValidTonAmount(amount) &&
    parsed > 0 &&
    (action === 'unstake'
      ? parsed <= Number(currentStaked)
      : parsed >= ECON.STAKING_MIN_AMOUNT_TON);

  async function submit() {
    if (!valid) return;
    try {
      await mutateAsync({ action, amount_ton: amount });
      toast.push(
        `${action === 'stake' ? 'Stake' : 'Unstake'} sent to your wallet.`,
        'success',
      );
      setAmount('');
    } catch (err) {
      toast.push(userMessage(err), 'error');
    }
  }

  return (
    <Card>
      <div className="mb-3 inline-flex rounded-xl border border-border bg-bg-subtle p-1">
        <ActionTab active={action === 'stake'} onClick={() => setAction('stake')}>
          Stake
        </ActionTab>
        <ActionTab active={action === 'unstake'} onClick={() => setAction('unstake')}>
          Withdraw
        </ActionTab>
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 focus-within:border-accent">
        <input
          inputMode="decimal"
          placeholder={action === 'stake' ? `min ${ECON.STAKING_MIN_AMOUNT_TON}` : 'amount'}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
          className="h-11 flex-1 bg-transparent text-sm text-fg outline-none"
        />
        <span className="text-xs text-fg-muted">TON</span>
      </div>
      <Button block loading={isPending} disabled={!valid} onClick={submit}>
        {action === 'stake' ? 'Stake TON' : 'Withdraw'}
      </Button>
    </Card>
  );
}

function ActionTab({
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
        active ? 'bg-bg-elevated text-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
