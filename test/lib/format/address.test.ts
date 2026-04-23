import { describe, expect, it } from 'vitest';

import { explorerUrl, sameAddress, shortenAddress } from '@/lib/format/address';

const RAW = '0:' + 'aa'.repeat(32);
const FRIENDLY = 'EQCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhF';

describe('shortenAddress', () => {
  it('shortens long friendly addresses', () => {
    expect(shortenAddress('EQCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhF')).toBe('EQCq…qqhF');
  });

  it('passes short values through untouched', () => {
    expect(shortenAddress('short')).toBe('short');
  });

  it('handles empty input', () => {
    expect(shortenAddress('')).toBe('');
  });
});

describe('sameAddress', () => {
  it('true for the same address in different forms', () => {
    expect(sameAddress(RAW, RAW)).toBe(true);
  });

  it('false for different addresses', () => {
    expect(sameAddress(RAW, '0:' + 'bb'.repeat(32))).toBe(false);
  });

  it('false when either side is empty', () => {
    expect(sameAddress('', RAW)).toBe(false);
    expect(sameAddress(RAW, '')).toBe(false);
  });
});

describe('explorerUrl', () => {
  it('targets testnet tonviewer by default', () => {
    expect(explorerUrl(RAW)).toMatch(/testnet\.tonviewer\.com/);
  });

  it('targets mainnet tonviewer when asked', () => {
    expect(explorerUrl(RAW, { network: 'mainnet' })).toMatch(/^https:\/\/tonviewer\.com\//);
  });

  it('builds transaction URLs', () => {
    const url = explorerUrl('deadbeef', { type: 'tx' });
    expect(url).toMatch(/\/transaction\/deadbeef$/);
  });

  it('does not crash on invalid input for address display (falls through)', () => {
    expect(() => explorerUrl(FRIENDLY)).not.toThrow();
  });
});
