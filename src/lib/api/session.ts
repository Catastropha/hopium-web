/**
 * Session storage — plain localStorage. The session token is an opaque
 * 32-byte hex issued by hopium-api; TTL is enforced server-side.
 */

const KEY = 'hopium:session';

export interface StoredSession {
  token: string;
  wallet_address: string;
  telegram_id: number;
  expires_at: string;
}

export function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || !parsed.wallet_address) return null;
    if (Date.parse(parsed.expires_at) < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
