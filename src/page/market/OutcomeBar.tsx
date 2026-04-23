import { cn } from '@/lib/_kit/cn';
import type { MarketOutcomeRead } from '@/lib/market/type';
import { TonAmount } from '@/lib/ui/TonAmount';

interface Props {
  outcomes: MarketOutcomeRead[];
  winningOutcome?: number | null;
}

export function OutcomeBar({ outcomes, winningOutcome }: Props) {
  const total = outcomes.reduce((acc, o) => acc + Number(o.bet_total), 0);

  return (
    <div className="flex flex-col gap-2">
      {outcomes.map((o) => {
        const pct = total > 0 ? (Number(o.bet_total) / total) * 100 : 0;
        const isWinning = winningOutcome === o.outcome_index;
        return (
          <div key={o.outcome_index} className="flex items-center gap-3">
            <span className="w-8 text-xs text-fg-muted">#{o.outcome_index}</span>
            <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-bg-subtle">
              <div
                className={cn(
                  'h-full transition-[width]',
                  isWinning ? 'bg-success/40' : 'bg-accent/40',
                )}
                style={{ width: `${pct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-3 text-sm">
                <span>{pct.toFixed(0)}%</span>
                <TonAmount amount={o.bet_total} compact />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
