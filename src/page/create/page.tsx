import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { userMessage } from '@/lib/api/error';
import { ECON } from '@/lib/chain/opcode';
import { useCreateMarket } from '@/lib/market/hook';
import { topicHashHex } from '@/lib/market/topic';
import { Button } from '@/lib/ui/Button';
import { Card } from '@/lib/ui/Card';
import { ConnectGate } from '@/lib/ui/ConnectGate';
import { PageHeader } from '@/lib/ui/PageHeader';
import { useToast } from '@/lib/ui/Toast';

import { OutcomeEditor } from './OutcomeEditor';
import { TierPicker } from './TierPicker';

export function CreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { mutateAsync, isPending } = useCreateMarket();

  const [tier, setTier] = useState<number>(3);
  const [topic, setTopic] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>(['Yes', 'No']);

  async function submit() {
    try {
      const topic_hash = await topicHashHex(topic, outcomes);
      await mutateAsync({ tier, outcome_count: outcomes.length, topic_hash });
      toast.push('Market sent to your wallet — approve in-app.', 'success');
      navigate('/markets');
    } catch (err) {
      toast.push(userMessage(err), 'error');
    }
  }

  const valid = topic.trim().length > 3 && outcomes.every((o) => o.trim().length > 0);

  return (
    <>
      <PageHeader title="Create market" subtitle={`${ECON.CREATION_FEE_TON} TON creation fee`} />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-fg-muted">
              Topic
            </label>
            <textarea
              className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-bg-subtle p-3 text-sm text-fg outline-none focus:border-accent"
              placeholder="Will ETH close above $5,000 on Friday?"
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 256))}
            />
            <p className="mt-1 text-xs text-fg-muted">{topic.length}/256</p>
          </Card>

          <Card>
            <TierPicker value={tier} onChange={setTier} />
          </Card>

          <Card>
            <OutcomeEditor value={outcomes} onChange={setOutcomes} />
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="border-accent/30 bg-accent-subtle">
            <p className="text-sm text-fg-muted">
              Stake{' '}
              <strong className="text-fg">
                {ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON
              </strong>{' '}
              to earn a 10% creator bonus on every market you create.
            </p>
          </Card>
          <ConnectGate cta="Connect your wallet to deploy this market">
            <Button
              block
              size="lg"
              loading={isPending}
              disabled={!valid}
              onClick={submit}
            >
              Deploy for {ECON.CREATION_FEE_TON} TON
            </Button>
          </ConnectGate>
        </aside>
      </div>
    </>
  );
}
