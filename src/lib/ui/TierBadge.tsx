import { cn } from '@/lib/_kit/cn';

interface Props {
  tier: number;
  className?: string;
}

const LABEL: Record<number, string> = {
  1: '1d',
  3: '3d',
  7: '7d',
  14: '14d',
};

export function TierBadge({ tier, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-bg-subtle px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted',
        className,
      )}
    >
      {LABEL[tier] ?? `${tier}d`}
    </span>
  );
}
