import { TonConnectButton } from '@tonconnect/ui-react';
import type { ReactNode } from 'react';

import { useSession } from '@/lib/auth/hook';

/**
 * Renders `children` only when an authenticated session exists. Otherwise
 * shows a TON Connect button and a short explainer. Pages wrap the action
 * area (bet form, stake form, create form) — they don't replace the whole
 * page.
 *
 * Scaffolding note: this component does NOT yet complete the auth flow on
 * its own. `lib/auth/hook.ts::useLogin` is defined but currently has no
 * caller — wiring it up (load widget → await TON Connect proof → POST to
 * `/v1/auth/telegram`) is Phase 4 integration work. The `#telegram-login-
 * host` anchor is rendered here so that work only has to add an effect
 * plus a "Sign in with Telegram" trigger, not restructure the component.
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
