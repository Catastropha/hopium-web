import { cn } from '@/lib/_kit/cn';

interface Props {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className }: Props) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-r-transparent text-fg-muted',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <Spinner size={28} />
    </div>
  );
}
