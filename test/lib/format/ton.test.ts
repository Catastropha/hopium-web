import { describe, expect, it } from 'vitest';

import {
  formatTon,
  formatTonCompact,
  isValidTonAmount,
  nanoToTon,
  tonToNano,
} from '@/lib/format/ton';

describe('formatTon', () => {
  it('formats a whole number and trims trailing zeros', () => {
    expect(formatTon('19')).toBe('19 TON');
    expect(formatTon('19.000000000')).toBe('19 TON');
    expect(formatTon('1.500000000')).toBe('1.5 TON');
  });

  it('drops the unit when asked', () => {
    expect(formatTon('10', { unit: false })).toBe('10');
  });

  it('handles zero', () => {
    expect(formatTon('0')).toBe('0 TON');
  });

  it('rejects garbage gracefully', () => {
    expect(formatTon('not-a-number')).toBe('0 TON');
  });
});

describe('formatTonCompact', () => {
  it('uses K for thousands', () => {
    expect(formatTonCompact('1500')).toBe('1.5K TON');
  });
  it('uses M for millions', () => {
    expect(formatTonCompact('2500000')).toBe('2.5M TON');
  });
  it('stays plain under 1000', () => {
    expect(formatTonCompact('42')).toBe('42 TON');
  });
});

describe('tonToNano <-> nanoToTon', () => {
  it('round-trips a whole number', () => {
    expect(tonToNano('19')).toBe(19_000_000_000n);
    expect(nanoToTon(19_000_000_000n)).toBe('19.000000000');
  });

  it('preserves sub-nano precision within 9 decimals', () => {
    expect(tonToNano('0.000000001')).toBe(1n);
    expect(nanoToTon(1n)).toBe('0.000000001');
  });

  it('ignores fractions beyond 9 decimals', () => {
    expect(tonToNano('1.1234567899')).toBe(1_123_456_789n);
  });
});

describe('isValidTonAmount', () => {
  it.each([
    ['0', true],
    ['1', true],
    ['1.5', true],
    ['19.000000000', true],
    ['-1', false],
    ['1.1234567890', false],
    ['abc', false],
    ['', false],
  ])('%s → %s', (input, expected) => {
    expect(isValidTonAmount(input)).toBe(expected);
  });
});
