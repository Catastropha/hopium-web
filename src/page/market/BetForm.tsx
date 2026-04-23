import { useState } from 'react';

import { userMessage } from '@/lib/api/error';
import { usePlaceBet } from '@/lib/bet/hook';
import { ECON } from '@/lib/chain/opcode';
import { isValidTonAmount } from '@/lib/format/ton';
import type { MarketOutcomeRead } from '@/lib/market/type';
import { cn } from '@/lib/_kit/cn';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { ConnectGate } from '@/lib/ui/ConnectGate';
import { useToast } from '@/lib/ui/Toast';

interface Props {
  marketAddress: string;
  outcomes: MarketOutcomeRead[];
}

export function BetForm({ marketAddress, outcomes }: Props) {
  const toast = useToast();
  const { mutateAsync, isPending } = usePlaceBet();

  const [outcome, setOutcome] = useState<number>(outcomes[0]?.outcome_index ?? 0);
  const [amount, setAmount] = useState('');

  const valid = isValidTonAmount(amount) && Number(amount) >= ECON.MARKET_MIN_BET_TON;

  async function submit() {
    if (!valid) return;
    try {
      await mutateAsync({
        market_address: marketAddress,
        outcome_index: outcome,
        amount_ton: amount,
      });
      toast.push('Bet sent to your wallet.', 'success');
      setAmount('');
    } catch (err) {
      toast.push(userMessage(err), 'error');
    }
  }

  return (
    <Card>
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
        Place bet
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {outcomes.map((o) => (
          <button
            key={o.outcome_index}
            type="button"
            onClick={() => setOutcome(o.outcome_index)}
            className={cn(
              'h-11 rounded-xl border text-sm font-medium transition-colors',
              outcome === o.outcome_index
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-bg-subtle text-fg hover:border-border-subtle',
            )}
          >
            #{o.outcome_index}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 focus-within:border-accent">
        <input
          inputMode="decimal"
          placeholder={`min ${ECON.MARKET_MIN_BET_TON}`}
          className="h-11 flex-1 bg-transparent text-sm text-fg outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
        />
        <span className="text-xs text-fg-muted">TON</span>
      </div>
      <ConnectGate cta="Connect your wallet to place this bet">
        <Button block loading={isPending} disabled={!valid} onClick={submit}>
          Bet
        </Button>
      </ConnectGate>
    </Card>
  );
}
