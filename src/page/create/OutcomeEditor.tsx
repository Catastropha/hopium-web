import { Plus, X } from 'lucide-react';

import { ECON } from '@/lib/chain/opcode';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function OutcomeEditor({ value, onChange }: Props) {
  const canAdd = value.length < ECON.MARKET_MAX_OUTCOMES;
  const canRemove = value.length > ECON.MARKET_MIN_OUTCOMES;

  function update(idx: number, text: string) {
    const next = [...value];
    next[idx] = text.slice(0, 64);
    onChange(next);
  }

  function add() {
    if (!canAdd) return;
    onChange([...value, '']);
  }

  function remove(idx: number) {
    if (!canRemove) return;
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-fg-muted">
        <span>Outcomes</span>
        <span>
          {value.length} / {ECON.MARKET_MAX_OUTCOMES}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {value.map((text, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="h-11 flex-1 rounded-xl border border-border bg-bg-subtle px-3 text-sm text-fg outline-none focus:border-accent"
              placeholder={`Option ${idx + 1}`}
              value={text}
              onChange={(e) => update(idx, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              disabled={!canRemove}
              className="flex size-11 items-center justify-center rounded-xl border border-border bg-bg-subtle text-fg-muted hover:text-fg disabled:opacity-30"
              aria-label={`Remove option ${idx + 1}`}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!canAdd}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-40"
      >
        <Plus size={16} />
        Add outcome
      </button>
    </div>
  );
}
