import { cn } from '@/lib/_kit/cn';
import { VALID_TIERS } from '@/lib/chain/opcode';

interface Props {
  value: number;
  onChange: (tier: number) => void;
}

const LABEL: Record<number, string> = {
  1: '1 day',
  3: '3 days',
  7: '7 days',
  14: '14 days',
};

export function TierPicker({ value, onChange }: Props) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
        Resolution tier
      </div>
      <div className="grid grid-cols-4 gap-2">
        {VALID_TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              'h-12 rounded-xl border text-sm font-medium transition-colors',
              value === t
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-bg-subtle text-fg hover:border-border-subtle',
            )}
          >
            {LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
