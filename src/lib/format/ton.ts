/**
 * TON amount formatting. Amounts are carried as Decimal strings across the
 * wire (`"19.000000000"`, `"0.1"`). Never parseFloat — floats lose nano
 * precision on values > 2^53 / 10^9.
 *
 * All format helpers take a Decimal string and return a displayable string.
 * Conversions to / from nano use BigInt for full precision.
 */

const NANO_PER_TON = 1_000_000_000n;

/** `"19"` → `"19 TON"`; `"1.5"` → `"1.5 TON"`; trims trailing zeros. */
export function formatTon(amount: string, options: { unit?: boolean; max?: number } = {}): string {
  const unit = options.unit ?? true;
  const max = options.max ?? 9;
  const trimmed = trimDecimal(amount, max);
  return unit ? `${trimmed} TON` : trimmed;
}

/** Compact display — 1234.5 → "1.2K"; 1_200_000 → "1.2M". Useful on cards. */
export function formatTonCompact(amount: string): string {
  const n = Number(trimDecimal(amount, 2));
  if (!Number.isFinite(n)) return '0 TON';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${round(n / 1_000_000, 1)}M TON`;
  if (abs >= 1_000) return `${round(n / 1_000, 1)}K TON`;
  return `${round(n, 2)} TON`;
}

/** Decimal string → BigInt nano. `"1.5"` → `1500000000n`. */
export function tonToNano(amount: string): bigint {
  const [wholeRaw = '0', fracRaw = ''] = normalize(amount).split('.');
  const whole = BigInt(wholeRaw || '0');
  const frac = BigInt(padFrac(fracRaw).slice(0, 9));
  return whole * NANO_PER_TON + frac;
}

/** BigInt nano → Decimal string, canonical 9-decimal form. */
export function nanoToTon(nano: bigint): string {
  const negative = nano < 0n;
  const abs = negative ? -nano : nano;
  const whole = abs / NANO_PER_TON;
  const frac = abs % NANO_PER_TON;
  const fracStr = frac.toString().padStart(9, '0');
  const result = `${whole.toString()}.${fracStr}`;
  return negative ? `-${result}` : result;
}

/** True when `amount` parses as a non-negative Decimal string. */
export function isValidTonAmount(amount: string): boolean {
  if (!/^\d+(\.\d{1,9})?$/.test(amount)) return false;
  return true;
}

function trimDecimal(amount: string, maxFrac: number): string {
  const src = normalize(amount);
  if (!src.includes('.')) return src;
  const [whole = '0', rawFrac = ''] = src.split('.');
  const frac = rawFrac.slice(0, maxFrac).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

function normalize(amount: string): string {
  const trimmed = amount.trim();
  if (!trimmed) return '0';
  if (!/^-?\d+(\.\d*)?$/.test(trimmed)) return '0';
  return trimmed.replace(/^(-?)0+(\d)/, '$1$2');
}

function padFrac(frac: string): string {
  return (frac + '000000000').slice(0, 9);
}

function round(n: number, digits: number): string {
  const factor = 10 ** digits;
  return (Math.round(n * factor) / factor).toString();
}
