import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTonConnectUI } from '@tonconnect/ui-react';

import { useSession } from '@/lib/auth/hook';
import { sendIntent, type StakeIntent } from '@/lib/chain/send';

import { getMyStake, stakeIntent } from './service';
import type { StakeIntentCreate } from './type';

export function useMyStake() {
  const session = useSession();
  return useQuery({
    queryKey: ['stake', 'me', session?.token ?? 'anon'],
    queryFn: getMyStake,
    enabled: Boolean(session),
  });
}

export function useStakeAction() {
  const [tonConnectUI] = useTonConnectUI();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: StakeIntentCreate) => {
      const intent = await stakeIntent(body);
      return sendIntent(tonConnectUI, intent as StakeIntent);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stake', 'me'] });
    },
  });
}
