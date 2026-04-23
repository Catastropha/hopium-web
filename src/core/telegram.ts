/**
 * Thin adapter over the Telegram Login Widget script.
 *
 * The widget is a global `<script>` tag that posts an HMAC-signed user
 * object to a global callback of your choosing. We load it on demand the
 * first time `loginWithTelegram()` is called and resolve the promise from
 * inside the callback.
 *
 * Keeping the integration in one file means the rest of the code is free
 * of DOM injection and lets us swap the widget for an iframe button later
 * without touching lib/auth.
 *
 * NB: The widget's HMAC scheme is similar to but distinct from Mini-App
 * `initData`. The backend is expected to accept both as equivalent
 * Telegram-identity proofs for the `/v1/auth/telegram` endpoint.
 */

import { config } from '@/core/config';

export interface TelegramWidgetUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const GLOBAL_CALLBACK = '__hopiumTelegramAuth';
const SCRIPT_ID = 'hopium-telegram-login';

type GlobalWithCallback = typeof globalThis & {
  [GLOBAL_CALLBACK]?: (user: TelegramWidgetUser) => void;
};

export function loginWithTelegram(): Promise<TelegramWidgetUser> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('loginWithTelegram requires a browser environment'));
      return;
    }
    const bot = config.botUsername;
    if (!bot) {
      reject(new Error('VITE_BOT_USERNAME is not configured'));
      return;
    }

    (globalThis as GlobalWithCallback)[GLOBAL_CALLBACK] = (user) => {
      resolve(user);
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', `${GLOBAL_CALLBACK}(user)`);
    script.onerror = () => reject(new Error('Failed to load Telegram widget'));

    const host = document.getElementById('telegram-login-host');
    if (!host) {
      reject(new Error('No #telegram-login-host element mounted'));
      return;
    }
    host.innerHTML = '';
    host.appendChild(script);
  });
}

/**
 * Convert widget payload to the urlencoded wire format the backend expects
 * for `init_data`. The field set matches Telegram's own ordering rules.
 */
export function widgetPayloadToInitData(user: TelegramWidgetUser): string {
  const entries: Array<[string, string]> = [];
  entries.push(['auth_date', String(user.auth_date)]);
  entries.push(['first_name', user.first_name]);
  entries.push(['id', String(user.id)]);
  if (user.last_name) entries.push(['last_name', user.last_name]);
  if (user.photo_url) entries.push(['photo_url', user.photo_url]);
  if (user.username) entries.push(['username', user.username]);
  entries.push(['hash', user.hash]);
  return entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}
