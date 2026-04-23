import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { formatCountdown } from '@/lib/format/time';
import type { MarketRead } from '@/lib/market/type';
import { Card } from '@/lib/ui/Card';
import { PhaseBadge } from '@/lib/ui/PhaseBadge';
import { TierBadge } from '@/lib/ui/TierBadge';
import { TonAmount } from '@/lib/ui/TonAmount';

interface Props {
  market: MarketRead;
}

export function MarketCard({ market }: Props) {
  const navigate = useNavigate();
  const isOpen = market.phase === 0;
  const deadline = isOpen ? market.betting_deadline : market.voting_deadline;

  return (
    <Card interactive onClick={() => navigate(`/market/${market.address}`)}>
      <div className="mb-3 flex items-center gap-2">
        <PhaseBadge phase={market.phase} />
        <TierBadge tier={market.tier} />
        <span className="ml-auto text-xs text-fg-muted">
          {isOpen ? 'Closes' : market.phase === 1 ? 'Voting ends' : 'Resolved'}{' '}
          {market.phase !== 2 && formatCountdown(deadline)}
        </span>
      </div>
      <p className="mb-3 line-clamp-2 text-base font-medium">
        {market.topic_text ?? '(topic pending)'}
      </p>
      <div className="flex items-center gap-3 text-sm text-fg-muted">
        <span className="inline-flex items-center gap-1">
          <Users size={14} />
          {market.outcome_count} outcomes
        </span>
        <span className="ml-auto">
          Pool <TonAmount amount={market.total_pool} compact className="text-fg" />
        </span>
      </div>
    </Card>
  );
}
