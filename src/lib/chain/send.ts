/**
 * TON Connect message construction + send. One `sendIntent(...)` helper
 * that takes the `/tx` intent payload from hopium-api and hands it to the
 * user's wallet for approval.
 *
 * Cell bodies exactly mirror the encoders in `../hopium-contracts/wrappers/
 * {Factory,Market,Staking}.ts`. Any drift breaks execution on-chain.
 */

import { Address, beginCell, Cell } from '@ton/core';
import type { SendTransactionRequest, TonConnectUI } from '@tonconnect/ui-react';

import { OP } from './opcode';

// Message lifetime on TonConnect — wallet is expected to sign within 5 min.
const VALID_WINDOW_SEC = 5 * 60;

export interface CreateMarketIntent {
  to: string;
  amount_nano: number | string;
  op: typeof OP.CREATE_MARKET;
  tier: number;
  outcome_count: number;
  topic_hash: string; // 64-char sha256 hex
}

export interface PlaceBetIntent {
  to: string;
  amount_nano: number | string;
  op: typeof OP.PLACE_BET;
  outcome_index: number;
  bet_amount_nano: number | string;
}

export interface StakeIntent {
  to: string;
  amount_nano: number | string;
  op: typeof OP.STAKE | typeof OP.UNSTAKE;
  stake_amount_nano: number | string;
}

export interface VoteIntent {
  to: string; // staking contract address
  amount_nano: number | string;
  op: typeof OP.SUBMIT_VOTE;
  market_address: string;
  outcome_index: number;
}

export interface ClaimIntent {
  to: string;
  amount_nano: number | string;
  op: typeof OP.CLAIM | typeof OP.CLAIM_VOTER_REWARD;
}

export type AnyIntent =
  | CreateMarketIntent
  | PlaceBetIntent
  | StakeIntent
  | VoteIntent
  | ClaimIntent;

/** Dispatch an API-supplied intent through TonConnectUI. */
export async function sendIntent(tonConnect: TonConnectUI, intent: AnyIntent): Promise<string> {
  const payload = buildPayload(intent);
  const request: SendTransactionRequest = {
    validUntil: Math.floor(Date.now() / 1000) + VALID_WINDOW_SEC,
    messages: [
      {
        address: intent.to,
        amount: String(intent.amount_nano),
        payload,
      },
    ],
  };
  const result = await tonConnect.sendTransaction(request);
  return result.boc;
}

function buildPayload(intent: AnyIntent): string {
  return cellToBase64(buildBody(intent));
}

function buildBody(intent: AnyIntent): Cell {
  switch (intent.op) {
    case OP.CREATE_MARKET:
      return beginCell()
        .storeUint(OP.CREATE_MARKET, 32)
        .storeUint(nextQueryId(), 64)
        .storeUint(intent.tier, 8)
        .storeUint(intent.outcome_count, 8)
        .storeUint(hexToBigInt(intent.topic_hash), 256)
        .endCell();

    case OP.PLACE_BET:
      return beginCell()
        .storeUint(OP.PLACE_BET, 32)
        .storeUint(nextQueryId(), 64)
        .storeUint(intent.outcome_index, 8)
        .storeCoins(BigInt(intent.bet_amount_nano))
        .endCell();

    case OP.STAKE:
    case OP.UNSTAKE:
      return beginCell()
        .storeUint(intent.op, 32)
        .storeUint(nextQueryId(), 64)
        .storeCoins(BigInt(intent.stake_amount_nano))
        .endCell();

    case OP.SUBMIT_VOTE:
      return beginCell()
        .storeUint(OP.SUBMIT_VOTE, 32)
        .storeUint(nextQueryId(), 64)
        .storeAddress(Address.parse(intent.market_address))
        .storeUint(intent.outcome_index, 8)
        .endCell();

    case OP.CLAIM:
    case OP.CLAIM_VOTER_REWARD:
      return beginCell().storeUint(intent.op, 32).storeUint(nextQueryId(), 64).endCell();
  }
}

/** Base64 encoding preferred by TonConnect (the library accepts BOC base64). */
function cellToBase64(cell: Cell): string {
  return cell.toBoc().toString('base64');
}

/** Monotonic query id per wallet session — helps wallet UIs de-duplicate. */
let queryCounter = 0n;
function nextQueryId(): bigint {
  queryCounter = (queryCounter + 1n) & 0xffff_ffff_ffff_ffffn;
  return queryCounter;
}

function hexToBigInt(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(clean)) return 0n;
  return BigInt(`0x${clean}`);
}
