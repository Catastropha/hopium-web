import { useNavigate } from 'react-router-dom';

import type { BetRead } from '@/lib/bet/type';
import { formatRelativePast } from '@/lib/format/time';
import { Card } from '@/lib/ui/Card';
import { TonAmount } from '@/lib/ui/TonAmount';

interface Props {
  bet: BetRead;
}

export function BetRow({ bet }: Props) {
  const navigate = useNavigate();
  return (
    <Card interactive onClick={() => navigate(`/market/${bet.market_address}`)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Outcome #{bet.outcome_index}</p>
          <p className="text-xs text-fg-muted">{formatRelativePast(bet.placed_at)}</p>
        </div>
        <div className="text-right">
          <TonAmount amount={bet.amount} />
          {bet.claimed && bet.claim_amount && (
            <p className="text-xs text-success">
              +<TonAmount amount={bet.claim_amount} />
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
