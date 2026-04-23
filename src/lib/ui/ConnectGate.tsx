import { TonConnectButton } from '@tonconnect/ui-react';
import type { ReactNode } from 'react';

import { useSession } from '@/lib/auth/hook';

/**
 * Renders `children` only when an authenticated session exists. Otherwise
 * shows a connect button and a short explainer. Pages wrap the action area
 * (bet form, stake form, create form) — they don't replace the whole page.
 *
 * The Telegram Login Widget mounts into #telegram-login-host once the user
 * clicks the TON Connect button and authorizes — see lib/auth/hook.ts.
 */
interface Props {
  children: ReactNode;
  cta?: string;
}

export function ConnectGate({
  children,
  cta = 'Connect your TON wallet to continue',
}: Props) {
  const session = useSession();
  if (session) return <>{children}</>;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-6 text-center">
      <p className="text-sm text-fg-muted">{cta}</p>
      <TonConnectButton />
      <div id="telegram-login-host" />
    </div>
  );
}
