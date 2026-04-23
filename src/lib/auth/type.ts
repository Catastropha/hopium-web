/**
 * Auth types mirror `hopium-api/app/lib/identity/model.py`. Keep fields
 * spelled exactly as the backend expects — it validates body shape.
 */

export type Source = 'tma' | 'web' | 'bot';

export interface AuthTelegramCreate {
  init_data: string;
  wallet_address: string;
  wallet_public_key: string;
  ton_proof_timestamp: number;
  ton_proof_domain: string;
  ton_proof_payload: string;
  ton_proof_signature: string;
  source: Source;
}

export interface AuthTelegramRead {
  session_token: string;
  wallet_address: string;
  telegram_id: number;
  expires_at: string;
}
