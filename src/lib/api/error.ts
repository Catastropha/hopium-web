/**
 * ApiError: shape-preserving wrapper around a non-2xx response from hopium-api.
 *
 * Every hopium-api error body is `{detail: {code: '<namespace>:<slug>-<digit>'}}`.
 * Callers read `.code` to branch on specific errors. `.status` is the HTTP
 * code. `.message` is best-effort for logs; UI should switch on `.code`.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? `${status} ${code}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** True when this error was caused by a session / auth problem. */
  isAuth(): boolean {
    return this.status === 401 || this.code.startsWith('auth:');
  }

  /** True when a record was expected but not found. */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the server rejected validation. */
  isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }
}

/**
 * Map a machine `code` to a user-readable string. Unknown codes fall back
 * to a neutral message so we never leak internal slugs into the UI.
 */
const ERROR_COPY: Record<string, string> = {
  'auth:invalid-session-1': 'Your session expired. Reconnect your wallet.',
  'auth:init-data-invalid-1': 'Telegram login was not accepted. Try again.',
  'auth:ton-proof-invalid-1': 'Wallet signature did not verify. Try reconnecting.',
  'market:not-found-1': 'This market no longer exists.',
  'market:invalid-tier-1': 'Pick a valid tier: 1, 3, 7, or 14 days.',
  'market:invalid-outcome-count-1': 'Markets need between 2 and 8 outcomes.',
  'bet:market-closed-1': 'Betting has ended for this market.',
  'bet:outcome-out-of-range-1': 'That outcome is not on this market.',
  'stake:below-minimum-1': 'Minimum stake is 10 TON.',
  'stake:locked-1': 'Stake is still locked. Check the unlock date.',
  'rate:too-many-1': 'Slow down — too many requests.',
  'internal:error': 'Something broke on our side. Try again in a moment.',
};

export function userMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_COPY[error.code] ?? 'Request failed.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error.';
}
