import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ECON, OP, PHASE, TIER, VALID_TIERS } from '@/lib/chain/opcode';

/**
 * Opcodes MUST stay in lockstep with `../hopium-contracts/wrappers/opcodes.ts`.
 * Drift silently misroutes messages — so this test greps the contract source
 * (located relative to the repo) and fails on any numeric mismatch.
 */
describe('chain opcodes mirror', () => {
  it('TIER values are exactly 1 / 3 / 7 / 14', () => {
    expect([TIER.ONE_DAY, TIER.THREE_DAYS, TIER.SEVEN_DAYS, TIER.FOURTEEN_DAYS]).toEqual([1, 3, 7, 14]);
    expect(VALID_TIERS).toEqual([1, 3, 7, 14]);
  });

  it('PHASE values are exactly 0 / 1 / 2', () => {
    expect([PHASE.BETTING, PHASE.VOTING, PHASE.RESOLVED]).toEqual([0, 1, 2]);
  });

  it('economic constants match the plan', () => {
    expect(ECON.CREATION_FEE_TON).toBe(19);
    expect(ECON.STAKING_MIN_AMOUNT_TON).toBe(10);
    expect(ECON.CREATOR_BONUS_THRESHOLD_TON).toBe(500);
    expect(ECON.PLATFORM_FEE_BPS).toBe(1000);
    expect(ECON.MARKET_MIN_OUTCOMES).toBe(2);
    expect(ECON.MARKET_MAX_OUTCOMES).toBe(8);
  });

  it('matches the source-of-truth opcodes in hopium-contracts', () => {
    const src = loadContractOpcodes();
    if (!src) return;
    const mapping: Array<[keyof typeof OP, string]> = [
      ['STAKE', 'STAKE'],
      ['UNSTAKE', 'UNSTAKE'],
      ['SUBMIT_VOTE', 'SUBMIT_VOTE'],
      ['CREATE_MARKET', 'CREATE_MARKET'],
      ['PLACE_BET', 'PLACE_BET'],
      ['RESOLVE', 'RESOLVE'],
      ['CLAIM', 'CLAIM'],
      ['CLAIM_VOTER_REWARD', 'CLAIM_VOTER_REWARD'],
    ];
    for (const [ours, theirs] of mapping) {
      const match = src.match(new RegExp(`${theirs}:\\s*(0x[0-9A-Fa-f_]+)`));
      expect(match, `missing ${theirs} in contracts/opcodes.ts`).not.toBeNull();
      const hex = (match?.[1] ?? '').replace(/_/g, '');
      expect(OP[ours]).toBe(Number(hex));
    }
  });
});

function loadContractOpcodes(): string | null {
  const candidates = [
    join(process.cwd(), '..', 'hopium-contracts', 'wrappers', 'opcodes.ts'),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      continue;
    }
  }
  return null;
}
