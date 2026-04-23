import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTonConnectUI } from '@tonconnect/ui-react';

import { useSession } from '@/lib/auth/hook';
import { sendIntent, type PlaceBetIntent } from '@/lib/chain/send';

import { listMarketBets, listMyBets, placeBetIntent } from './service';
import type { BetIntentCreate } from './type';

export function useMyBets() {
  const session = useSession();
  return useQuery({
    queryKey: ['bet', 'me', session?.token ?? 'anon'],
    queryFn: listMyBets,
    enabled: Boolean(session),
  });
}

export function useMarketBets(address: string | undefined) {
  return useQuery({
    queryKey: ['bet', 'market', address ?? ''],
    queryFn: () => listMarketBets(address as string),
    enabled: Boolean(address),
  });
}

export function usePlaceBet() {
  const [tonConnectUI] = useTonConnectUI();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: BetIntentCreate) => {
      const intent = await placeBetIntent(body);
      return sendIntent(tonConnectUI, intent as PlaceBetIntent);
    },
    onSuccess: (_boc, body) => {
      qc.invalidateQueries({ queryKey: ['bet', 'me'] });
      qc.invalidateQueries({ queryKey: ['bet', 'market', body.market_address] });
      qc.invalidateQueries({ queryKey: ['market', 'detail', body.market_address] });
    },
  });
}
