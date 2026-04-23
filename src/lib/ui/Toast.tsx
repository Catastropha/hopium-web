import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

import { cn } from '@/lib/_kit/cn';

type Tone = 'neutral' | 'success' | 'error';

interface ToastEntry {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastCtx {
  push: (message: string, tone?: Tone) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const push = useCallback((message: string, tone: Tone = 'neutral') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg',
              t.tone === 'success' && 'border-success/40 bg-success/20 text-success',
              t.tone === 'error' && 'border-danger/40 bg-danger/20 text-danger',
              t.tone === 'neutral' && 'border-border bg-bg-elevated text-fg',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast called outside ToastProvider');
  return ctx;
}
