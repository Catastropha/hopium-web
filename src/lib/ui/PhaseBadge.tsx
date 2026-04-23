import { cn } from '@/lib/_kit/cn';
import type { MarketPhase } from '@/lib/market/type';

interface Props {
  phase: MarketPhase;
  className?: string;
}

const LABEL: Record<MarketPhase, string> = {
  0: 'Open',
  1: 'Voting',
  2: 'Resolved',
};

const TONE: Record<MarketPhase, string> = {
  0: 'bg-accent-subtle text-accent',
  1: 'bg-warning/15 text-warning',
  2: 'bg-success/15 text-success',
};

export function PhaseBadge({ phase, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        TONE[phase],
        className,
      )}
    >
      {LABEL[phase]}
    </span>
  );
}
