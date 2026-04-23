/**
 * TON address display helpers. The API returns addresses in raw form
 * `"wc:hex64"` (e.g. `"0:aaaaaaaa..."`); TON Connect returns friendly form
 * `"EQxxxxxx..."` (base64url, bounceable). Both are valid — the UI shows
 * the friendly form when possible.
 */

import { Address } from '@ton/core';

/** Last-4 / first-4 shortening: "EQa1b2…c3d4" */
export function shortenAddress(address: string, head = 4, tail = 4): string {
  if (!address) return '';
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** Normalize whatever form we have into friendly / bounceable base64url. */
export function toFriendly(address: string, opts: { testOnly?: boolean } = {}): string {
  try {
    return Address.parse(address).toString({
      urlSafe: true,
      bounceable: true,
      testOnly: opts.testOnly ?? false,
    });
  } catch {
    return address;
  }
}

/** Normalize to raw form `"wc:hex64"` for comparisons and API calls. */
export function toRaw(address: string): string {
  try {
    return Address.parse(address).toRawString();
  } catch {
    return address;
  }
}

/** True when `a` and `b` refer to the same address, regardless of form. */
export function sameAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    return Address.parse(a).equals(Address.parse(b));
  } catch {
    return a === b;
  }
}

/** Explorer link to tonscan / tonviewer for a given address / tx. */
export function explorerUrl(
  value: string,
  opts: { network?: 'mainnet' | 'testnet'; type?: 'address' | 'tx' } = {},
): string {
  const network = opts.network ?? 'testnet';
  const type = opts.type ?? 'address';
  const host = network === 'mainnet' ? 'https://tonviewer.com' : 'https://testnet.tonviewer.com';
  const encoded = encodeURIComponent(type === 'address' ? toFriendly(value) : value);
  return type === 'address' ? `${host}/${encoded}` : `${host}/transaction/${encoded}`;
}
