import { useState } from 'react';

import { userMessage } from '@/lib/api/error';
import type { MarketOutcomeRead } from '@/lib/market/type';
import { useCastVote } from '@/lib/vote/hook';
import { cn } from '@/lib/_kit/cn';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { ConnectGate } from '@/lib/ui/ConnectGate';
import { useToast } from '@/lib/ui/Toast';

interface Props {
  marketAddress: string;
  outcomes: MarketOutcomeRead[];
}

export function VotePanel({ marketAddress, outcomes }: Props) {
  const toast = useToast();
  const { mutateAsync, isPending } = useCastVote();
  const [outcome, setOutcome] = useState<number>(outcomes[0]?.outcome_index ?? 0);

  async function submit() {
    try {
      await mutateAsync({ market_address: marketAddress, outcome_index: outcome });
      toast.push('Vote signed in your wallet.', 'success');
    } catch (err) {
      toast.push(userMessage(err), 'error');
    }
  }

  return (
    <Card>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
        Vote on resolution
      </div>
      <p className="mb-3 text-sm text-fg-muted">
        Your stake weight decides the winning outcome. Correct voters share 30%
        of the platform fee.
      </p>
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
      <ConnectGate cta="Connect your wallet to cast a vote">
        <Button block loading={isPending} onClick={submit}>
          Cast vote
        </Button>
      </ConnectGate>
    </Card>
  );
}
