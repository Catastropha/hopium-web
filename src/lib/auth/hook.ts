import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useCallback, useEffect } from 'react';

import { readSession, type StoredSession } from '@/lib/api/session';
import { loginWithTelegram, widgetPayloadToInitData } from '@/core/telegram';

import { authTelegram, logout } from './service';
import type { AuthTelegramCreate, Source } from './type';

const SESSION_KEY = ['auth', 'session'] as const;

/** Current session record (or null). Driven by localStorage + a storage event listener. */
export function useSession(): StoredSession | null {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => readSession(),
    staleTime: Infinity,
    initialData: readSession(),
  });

  useEffect(() => {
    const onStorage = () => qc.invalidateQueries({ queryKey: SESSION_KEY });
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [qc]);

  return data ?? null;
}

/**
 * Best-effort issuance of a new session. On web we:
 *   1. Open the Telegram Login Widget and wait for the signed user blob.
 *   2. Convert the blob into the same urlencoded form the backend accepts
 *      for Mini-App initData.
 *   3. Pull the TON Connect proof off the current wallet.
 *   4. POST both to `/v1/auth/telegram` with `source: 'web'`.
 */
export function useLogin(source: Source = 'web') {
  const qc = useQueryClient();
  const wallet = useTonWallet();

  return useMutation({
    mutationFn: async () => {
      const proof = extractProof(wallet);
      if (!proof) throw new Error('auth:no-ton-proof');

      const widgetUser = await loginWithTelegram();
      const initData = widgetPayloadToInitData(widgetUser);

      const body: AuthTelegramCreate = {
        init_data: initData,
        wallet_address: proof.wallet_address,
        wallet_public_key: proof.wallet_public_key,
        ton_proof_timestamp: proof.timestamp,
        ton_proof_domain: proof.domain,
        ton_proof_payload: proof.payload,
        ton_proof_signature: proof.signature,
        source,
      };
      return authTelegram(body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const [tonConnectUI] = useTonConnectUI();
  return useCallback(async () => {
    await logout();
    await tonConnectUI.disconnect().catch(() => undefined);
    qc.clear();
  }, [qc, tonConnectUI]);
}

interface NormalizedProof {
  wallet_address: string;
  wallet_public_key: string;
  timestamp: number;
  domain: string;
  payload: string;
  signature: string;
}

function extractProof(wallet: ReturnType<typeof useTonWallet>): NormalizedProof | null {
  if (!wallet) return null;
  const conn = wallet.connectItems?.tonProof;
  if (!conn || !('proof' in conn)) return null;
  const { proof } = conn;
  if (!proof) return null;
  return {
    wallet_address: wallet.account.address,
    wallet_public_key: wallet.account.publicKey ?? '',
    timestamp: proof.timestamp,
    domain: proof.domain.value,
    payload: proof.payload,
    signature: proof.signature,
  };
}
