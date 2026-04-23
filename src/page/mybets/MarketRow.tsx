import { useNavigate } from 'react-router-dom';

import type { MarketRead } from '@/lib/market/type';
import { Card } from '@/lib/ui/Card';
import { PhaseBadge } from '@/lib/ui/PhaseBadge';
import { TierBadge } from '@/lib/ui/TierBadge';
import { TonAmount } from '@/lib/ui/TonAmount';

interface Props {
  market: MarketRead;
}

export function MarketRow({ market }: Props) {
  const navigate = useNavigate();
  return (
    <Card interactive onClick={() => navigate(`/market/${market.address}`)}>
      <div className="mb-2 flex items-center gap-2">
        <PhaseBadge phase={market.phase} />
        <TierBadge tier={market.tier} />
      </div>
      <p className="mb-2 line-clamp-2 text-sm font-medium">
        {market.topic_text ?? '(topic pending)'}
      </p>
      <p className="text-xs text-fg-muted">
        Pool <TonAmount amount={market.total_pool} compact className="text-fg" />
      </p>
    </Card>
  );
}
