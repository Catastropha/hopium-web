import { TonConnectUIProvider } from '@tonconnect/ui-react';
import type { ReactNode } from 'react';

import { config } from '@/core/config';

interface Props {
  children: ReactNode;
}

export function TonConnectProvider({ children }: Props) {
  return (
    <TonConnectUIProvider manifestUrl={config.tonConnectManifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
