import { ExternalLink } from 'lucide-react';

import { config } from '@/core/config';
import { cn } from '@/lib/_kit/cn';
import { explorerUrl, shortenAddress, toFriendly } from '@/lib/format/address';

interface Props {
  address: string;
  link?: boolean;
  className?: string;
}

export function AddressChip({ address, link = true, className }: Props) {
  const short = shortenAddress(toFriendly(address, { testOnly: config.tonNetwork === 'testnet' }));
  const href = explorerUrl(address, { network: config.tonNetwork });

  if (!link) {
    return <span className={cn('font-mono text-[13px]', className)}>{short}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5',
        'bg-bg-subtle font-mono text-[13px] text-fg hover:border-border-subtle',
        className,
      )}
    >
      {short}
      <ExternalLink size={12} className="text-fg-muted" />
    </a>
  );
}
