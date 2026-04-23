import { apiDelete, apiPost } from '@/lib/api/client';
import { clearSession, writeSession } from '@/lib/api/session';

import type { AuthTelegramCreate, AuthTelegramRead } from './type';

/**
 * Exchange a Telegram identity proof + TON Connect proof for a hopium-api
 * session. Response is written to localStorage via `writeSession`; callers
 * can read back with `readSession()`.
 */
export async function authTelegram(body: AuthTelegramCreate): Promise<AuthTelegramRead> {
  const result = await apiPost<AuthTelegramRead>('/v1/auth/telegram', body, {
    anonymous: true,
  });
  writeSession({
    token: result.session_token,
    wallet_address: result.wallet_address,
    telegram_id: result.telegram_id,
    expires_at: result.expires_at,
  });
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiDelete<void>('/v1/auth/session');
  } catch {
    // Session might already be invalid on the server — either way, drop it
    // locally.
  } finally {
    clearSession();
  }
}
