import { ArrowRight, BookOpen, Coins, Scale, Shield, Vote } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ECON } from '@/lib/chain/opcode';
import { Card } from '@/lib/ui/Card';
import { EmptyState } from '@/lib/ui/EmptyState';
import { PageHeader } from '@/lib/ui/PageHeader';

const SECTIONS = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    icon: BookOpen,
    summary: 'Deploy your first market in under a minute.',
  },
  {
    slug: 'staking',
    title: 'Staking',
    icon: Coins,
    summary: `How the ${ECON.STAKING_LOCK_DAYS}-day stake lock and ${ECON.CREATOR_BONUS_THRESHOLD_TON} TON creator bonus work.`,
  },
  {
    slug: 'voting',
    title: 'Voting & resolution',
    icon: Vote,
    summary: `The ${ECON.VOTING_WINDOW_HOURS}-hour window and how winners are picked.`,
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    icon: Shield,
    summary: 'What we store (almost nothing) and what we don’t.',
  },
  {
    slug: 'terms',
    title: 'Terms of use',
    icon: Scale,
    summary: 'The legal shape of using hopium.bet.',
  },
] as const;

type Slug = (typeof SECTIONS)[number]['slug'];

export function DocsPage() {
  const { slug } = useParams<{ slug?: string }>();
  if (!slug) return <DocsIndex />;
  const target = SECTIONS.find((s) => s.slug === slug);
  if (!target) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Section not found"
        description="Pick one of the links on the left or head back to the index."
      />
    );
  }
  return <DocsBody slug={target.slug as Slug} />;
}

function DocsIndex() {
  return (
    <>
      <PageHeader
        title="Docs"
        subtitle="Short pages only. If something takes more than five minutes to read, we broke it into pieces."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.slug} to={`/docs/${s.slug}`}>
              <Card interactive>
                <div className="flex items-start gap-3">
                  <Icon size={20} className="mt-0.5 text-accent" />
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="mt-1 text-sm text-fg-muted">{s.summary}</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto mt-0.5 text-fg-muted" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function DocsBody({ slug }: { slug: Slug }) {
  switch (slug) {
    case 'getting-started':
      return <GettingStarted />;
    case 'staking':
      return <Staking />;
    case 'voting':
      return <Voting />;
    case 'privacy':
      return <Privacy />;
    case 'terms':
      return <Terms />;
  }
}

function GettingStarted() {
  return (
    <article className="mx-auto max-w-prose">
      <PageHeader
        title="Getting started"
        subtitle="Deploy your first market in under a minute."
      />
      <p>
        hopium.bet lets anyone create a short-term prediction market on TON.
        Every market runs on chain, settles automatically, and pays out through
        the user's wallet. You don't need an account.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Steps</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-fg-muted">
        <li>Connect a TON wallet (Tonkeeper, MyTonWallet, OpenMask…).</li>
        <li>Sign in with Telegram so the app can link your identity to stakes and payouts.</li>
        <li>
          Open <strong className="text-fg">Create</strong>, pick a tier, type a
          topic, and list 2–{ECON.MARKET_MAX_OUTCOMES} outcomes.
        </li>
        <li>
          Confirm the {ECON.CREATION_FEE_TON} TON creation fee. Your wallet pops
          up — sign, wait a few blocks, done.
        </li>
      </ol>
    </article>
  );
}

function Staking() {
  return (
    <article className="mx-auto max-w-prose">
      <PageHeader title="Staking" />
      <p>
        Staking turns TON into voting power. Stake at least{' '}
        <strong className="text-fg">{ECON.STAKING_MIN_AMOUNT_TON} TON</strong>{' '}
        and the global staking contract locks it for{' '}
        <strong className="text-fg">{ECON.STAKING_LOCK_DAYS} days</strong>.
      </p>
      <p className="mt-4">While you're staked, three things happen:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
        <li>
          You can vote on any market in its voting window. Your vote weight is
          your stake amount.
        </li>
        <li>
          If you voted for the winning outcome, you share 30% of the platform
          fee on that market.
        </li>
        <li>
          If you have{' '}
          <strong className="text-fg">{ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON</strong>{' '}
          staked at resolution time, every market you created pays you a 10%
          creator bonus on its platform fee.
        </li>
      </ul>
    </article>
  );
}

function Voting() {
  return (
    <article className="mx-auto max-w-prose">
      <PageHeader title="Voting & resolution" />
      <p>
        Every market has a{' '}
        <strong className="text-fg">{ECON.VOTING_WINDOW_HOURS}-hour</strong>{' '}
        voting window that opens when betting closes. Stakers cast a vote for
        one outcome; the outcome with the highest total stake weight wins.
      </p>
      <p className="mt-4">
        When the window ends, anyone can trigger resolution. The contract pays:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
        <li>Winning bettors, pro rata, from the winning-outcome sub-pool.</li>
        <li>Correct voters, pro rata, from 30% of the platform fee.</li>
        <li>Weekly leaderboard, from 20% of the platform fee.</li>
        <li>
          The market creator, if they have{' '}
          <strong className="text-fg">{ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON</strong>{' '}
          staked, from 10% of the platform fee.
        </li>
        <li>The platform treasury, from the remaining 40%.</li>
      </ul>
    </article>
  );
}

function Privacy() {
  return (
    <article className="mx-auto max-w-prose">
      <PageHeader title="Privacy" />
      <p>
        hopium.bet stores the bare minimum off chain. No passwords, no emails,
        no account profiles. The backend keeps:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted">
        <li>Your TON wallet address (public already).</li>
        <li>Your Telegram user id, linked after you sign in via Telegram.</li>
        <li>Your opaque session token, held for 30 days.</li>
      </ul>
      <p className="mt-4">
        Everything else — bets, stakes, votes, resolutions — is on chain. We
        index it into Postgres for fast reads, but the chain is the source of
        truth.
      </p>
    </article>
  );
}

function Terms() {
  return (
    <article className="mx-auto max-w-prose">
      <PageHeader title="Terms of use" />
      <p>
        hopium.bet is non-custodial software that interacts with public smart
        contracts on TON. You are responsible for the transactions you sign and
        the consequences of those transactions. We do not hold funds, we do not
        promise outcomes, and we cannot reverse on-chain actions.
      </p>
      <p className="mt-4">
        Using the app means you understand that. If any of the above surprises
        you, please stop and read the source.
      </p>
    </article>
  );
}
