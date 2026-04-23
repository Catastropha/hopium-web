import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTonConnectUI } from '@tonconnect/ui-react';

import { sendIntent, type CreateMarketIntent } from '@/lib/chain/send';

import { createMarketIntent, listMarkets, readMarket } from './service';
import type { MarketIntentCreate } from './type';

export function useMarkets() {
  return useQuery({
    queryKey: ['market', 'list'],
    queryFn: listMarkets,
  });
}

export function useMarket(address: string | undefined) {
  return useQuery({
    queryKey: ['market', 'detail', address ?? ''],
    queryFn: () => readMarket(address as string),
    enabled: Boolean(address),
  });
}

/** Create-market flow: request intent from hopium-api, then TonConnect send. */
export function useCreateMarket() {
  const [tonConnectUI] = useTonConnectUI();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: MarketIntentCreate) => {
      const intent = await createMarketIntent(body);
      return sendIntent(tonConnectUI, intent as CreateMarketIntent);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['market', 'list'] });
    },
  });
}
