import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/_kit/cn';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  padded = true,
  interactive,
  className,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-bg-elevated text-fg',
        padded && 'p-5',
        interactive &&
          'cursor-pointer transition-colors hover:border-border-subtle hover:bg-bg-subtle',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
