/**
 * User types — mirror `hopium-api/app/lib/identity/model.py`.
 */

export interface UserBase {
  wallet_address: string;
  telegram_id: number | null;
  username: string | null;
  display_name: string | null;
}

export interface UserRead extends UserBase {
  created_at: string;
  last_seen_at: string;
}
