import { cn } from '@/lib/_kit/cn';

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-pulse rounded-md bg-bg-subtle',
        className,
      )}
    />
  );
}
