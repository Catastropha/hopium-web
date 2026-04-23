import { describe, expect, it } from 'vitest';

import { formatCountdown, formatRelativePast } from '@/lib/format/time';

const NOW = Date.parse('2026-05-01T12:00:00Z');

describe('formatCountdown', () => {
  it('renders days + hours for >1 day', () => {
    const future = new Date(NOW + 2 * 24 * 3600_000 + 4 * 3600_000).toISOString();
    expect(formatCountdown(future, NOW)).toBe('2d 4h');
  });

  it('renders hours + minutes under a day', () => {
    const future = new Date(NOW + 3 * 3600_000 + 12 * 60_000).toISOString();
    expect(formatCountdown(future, NOW)).toBe('3h 12m');
  });

  it('renders minutes under an hour', () => {
    const future = new Date(NOW + 45 * 60_000).toISOString();
    expect(formatCountdown(future, NOW)).toBe('45m');
  });

  it('renders "ended" in the past', () => {
    const past = new Date(NOW - 1000).toISOString();
    expect(formatCountdown(past, NOW)).toBe('ended');
  });
});

describe('formatRelativePast', () => {
  it('says "just now" within a minute', () => {
    expect(formatRelativePast(new Date(NOW - 5_000).toISOString(), NOW)).toBe('just now');
  });

  it('counts minutes under an hour', () => {
    expect(formatRelativePast(new Date(NOW - 12 * 60_000).toISOString(), NOW)).toBe('12m ago');
  });

  it('counts hours under a day', () => {
    expect(formatRelativePast(new Date(NOW - 5 * 3600_000).toISOString(), NOW)).toBe('5h ago');
  });

  it('counts days past', () => {
    expect(formatRelativePast(new Date(NOW - 3 * 24 * 3600_000).toISOString(), NOW)).toBe(
      '3d ago',
    );
  });
});
