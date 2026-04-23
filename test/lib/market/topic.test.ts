import { describe, expect, it } from 'vitest';

import { topicHashHex } from '@/lib/market/topic';

describe('topicHashHex', () => {
  it('produces a 64-char sha256 hex', async () => {
    const hash = await topicHashHex('Will BTC close above $100k?', ['Yes', 'No']);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable across equivalent inputs', async () => {
    const a = await topicHashHex('  Topic ', ['Yes ', ' No']);
    const b = await topicHashHex('Topic', ['Yes', 'No']);
    expect(a).toBe(b);
  });

  it('is sensitive to outcome order (outcomes are positional)', async () => {
    const a = await topicHashHex('Topic', ['Yes', 'No']);
    const b = await topicHashHex('Topic', ['No', 'Yes']);
    expect(a).not.toBe(b);
  });
});
