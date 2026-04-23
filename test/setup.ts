/**
 * Boots the test environment. Every test file inherits this setup via
 * `vitest.config.ts::setupFiles`.
 *
 * - Seeds `import.meta.env` with values the app expects
 * - Wires up `@testing-library/jest-dom` matchers
 * - Starts msw for HTTP interception
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './_mocks/server';

const ENV: Record<string, string> = {
  VITE_API_BASE_URL: 'http://api.test',
  VITE_TONCONNECT_MANIFEST_URL: 'http://api.test/manifest.json',
  VITE_TON_NETWORK: 'testnet',
  VITE_FACTORY_ADDRESS: '0:' + 'ff'.repeat(32),
  VITE_STAKING_ADDRESS: '0:' + 'ee'.repeat(32),
  VITE_BOT_USERNAME: 'hopiumbet_bot',
  VITE_SENTRY_DSN: '',
};

for (const [k, v] of Object.entries(ENV)) {
  vi.stubEnv(k, v);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
