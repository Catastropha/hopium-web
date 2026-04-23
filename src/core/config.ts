/**
 * Runtime configuration read from Vite env vars. Never read import.meta.env
 * elsewhere — always import `config` from this module so one line controls
 * defaults + types.
 */

type Network = 'mainnet' | 'testnet';

function envString(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : fallback;
}

function envNetwork(key: keyof ImportMetaEnv): Network {
  const value = envString(key, 'testnet');
  return value === 'mainnet' ? 'mainnet' : 'testnet';
}

export const config = {
  apiBaseUrl: envString('VITE_API_BASE_URL'),
  tonConnectManifestUrl: envString('VITE_TONCONNECT_MANIFEST_URL'),
  tonNetwork: envNetwork('VITE_TON_NETWORK'),
  factoryAddress: envString('VITE_FACTORY_ADDRESS'),
  stakingAddress: envString('VITE_STAKING_ADDRESS'),
  botUsername: envString('VITE_BOT_USERNAME', 'hopiumbet_bot'),
  sentryDsn: envString('VITE_SENTRY_DSN'),
} as const;

export type Config = typeof config;
