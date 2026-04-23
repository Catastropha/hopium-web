import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTonConnectUI } from '@tonconnect/ui-react';

import { config } from '@/core/config';
import { tonToNano } from '@/lib/format/ton';
import { OP } from '@/lib/chain/opcode';
import { sendIntent, type VoteIntent } from '@/lib/chain/send';

interface CastVoteInput {
  market_address: string;
  outcome_index: number;
}

/**
 * Cast a vote on a market. Votes are submitted TO the staking contract
 * (the contract checks caller's stake, applies voting power, then forwards
 * the VOTE_CAST message to the target market). The web doesn't need an
 * intent endpoint for voting — staking contract address is configured
 * client-side and the body has no amount.
 */
export function useCastVote() {
  const [tonConnectUI] = useTonConnectUI();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ market_address, outcome_index }: CastVoteInput) => {
      const intent: VoteIntent = {
        to: config.stakingAddress,
        amount_nano: Number(tonToNano('0.05')), // gas forward
        op: OP.SUBMIT_VOTE,
        market_address,
        outcome_index,
      };
      return sendIntent(tonConnectUI, intent);
    },
    onSuccess: (_boc, input) => {
      qc.invalidateQueries({ queryKey: ['market', 'detail', input.market_address] });
    },
  });
}
