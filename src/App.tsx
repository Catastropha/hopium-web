import { RootErrorBoundary } from '@/core/error';
import { QueryProvider } from '@/core/query';
import { TonConnectProvider } from '@/core/tonconnect';
import { Router } from '@/routes';
import { ToastProvider } from '@/lib/ui/Toast';

export function App() {
  return (
    <RootErrorBoundary>
      <TonConnectProvider>
        <QueryProvider>
          <ToastProvider>
            <Router />
          </ToastProvider>
        </QueryProvider>
      </TonConnectProvider>
    </RootErrorBoundary>
  );
}
