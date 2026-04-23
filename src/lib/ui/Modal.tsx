import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cn } from '@/lib/_kit/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/** Centered modal. Closes on backdrop click or Escape key. */
export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl',
          'transition-transform duration-150',
          SIZE[size],
          open ? 'scale-100' : 'scale-95',
        )}
      >
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
