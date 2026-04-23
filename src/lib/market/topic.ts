/**
 * Canonical topic hashing — market content identity. The hash is what the
 * Factory contract stores (`topicHash: uint256`); the plain text goes in
 * the DB purely for display.
 */
export async function topicHashHex(topic: string, outcomes: string[]): Promise<string> {
  const canonical = [topic.trim(), ...outcomes.map((o) => o.trim())].join('\n');
  const buf = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
