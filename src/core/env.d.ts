/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TONCONNECT_MANIFEST_URL: string;
  readonly VITE_TON_NETWORK: string;
  readonly VITE_FACTORY_ADDRESS: string;
  readonly VITE_STAKING_ADDRESS: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_SENTRY_DSN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
