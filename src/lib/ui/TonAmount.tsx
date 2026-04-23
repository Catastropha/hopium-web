import { cn } from '@/lib/_kit/cn';
import { formatTon, formatTonCompact } from '@/lib/format/ton';

interface Props {
  amount: string;
  compact?: boolean;
  unit?: boolean;
  className?: string;
}

export function TonAmount({ amount, compact, unit = true, className }: Props) {
  const formatted = compact ? formatTonCompact(amount) : formatTon(amount, { unit });
  return <span className={cn('tabular-nums', className)}>{formatted}</span>;
}
