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
 * Map a machine `code` to a user-readable string.
 *
 * Keys here MUST match the set hopium-api actually emits — see
 * `app/lib/identity/service.py` and each `app/apps/{name}/route.py` for
 * the authoritative list. Unknown codes fall through to a neutral
 * message; never surface the raw code.
 *
 * This is the web-flavoured copy: it assumes the user is in a browser
 * and can re-run the Telegram Login Widget. hopium-tma keeps a parallel
 * map with Mini-App-appropriate wording.
 */
const ERROR_COPY: Record<string, string> = {
  // Telegram identity (Login Widget HMAC, user parsing)
  'auth:telegram-0': 'Telegram sign-in was rejected. Sign in with Telegram again.',
  'auth:telegram-1': 'Telegram sign-in is stale. Sign in with Telegram again.',
  'auth:telegram-2': "Telegram didn't return a user id. Sign in again.",

  // TON Connect proof
  'auth:ton-proof-0': 'Wallet proof is stale. Reconnect your wallet.',
  'auth:ton-proof-1': 'Wallet address format is off. Reconnect your wallet.',
  'auth:ton-proof-2': 'Wallet public key format is off. Reconnect your wallet.',
  'auth:ton-proof-3': 'Wallet signature format is off. Reconnect your wallet.',
  'auth:ton-proof-4': 'Wallet signature did not verify. Reconnect your wallet.',

  // Session
  'auth:session-0': 'Your session expired. Sign in again.',
  'auth:session-1': 'Please sign in to continue.',

  // Source mismatch — only reachable on a client bug
  'auth:source-0': 'Unsupported sign-in path.',

  // Domain
  'market:not-found-0': 'This market no longer exists.',
  'market:tier-0': 'Pick a valid tier: 1, 3, 7, or 14 days.',
  'bet:not-betting-0': 'Betting has ended for this market.',
  'bet:outcome-0': 'That outcome is not on this market.',
  'stake:below-min-0': 'Minimum stake is 10 TON.',
  'user:not-found-0': "Your account isn't linked yet. Sign in again.",

  // Chain availability (addresses unset pre-deploy)
  'chain:factory-unset-0': "The market factory isn't live yet. Try again soon.",
  'chain:staking-unset-0': "Staking isn't live yet. Try again soon.",

  // Catch-all
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
