import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/_kit/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:opacity-50',
  secondary: 'bg-bg-elevated text-fg border border-border hover:border-border-subtle hover:bg-bg-subtle disabled:opacity-50',
  ghost: 'bg-transparent text-accent hover:bg-accent-subtle disabled:opacity-50',
  destructive: 'bg-danger text-white hover:opacity-90 disabled:opacity-50',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-[15px] rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  block,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      data-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? <LoadingDot /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}

function LoadingDot() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
