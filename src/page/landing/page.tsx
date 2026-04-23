import { ArrowRight, Bolt, Coins, ShieldCheck, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import { config } from '@/core/config';
import { ECON } from '@/lib/chain/opcode';
import { Button } from '@/lib/ui/Button';

export function LandingPage() {
  return (
    <div className="mx-auto max-w-content px-6 py-16 md:py-24">
      <Hero />
      <Features />
      <EconomyCallout />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-fg-muted">
          <Bolt size={14} /> Live on TON testnet
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-hero">
          Predict anything.
          <br />
          Resolved in <span className="text-accent">60 seconds</span>.
        </h1>
        <p className="mt-5 max-w-prose text-lg text-fg-muted">
          hopium.bet is a decentralized prediction market factory on TON. Spin up
          a market in a minute, place bets, and earn a cut of every resolved pool
          — all from Telegram or your browser.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/markets">
            <Button size="lg" rightIcon={<ArrowRight size={18} />}>
              Browse markets
            </Button>
          </Link>
          <a
            href={`https://t.me/${config.botUsername}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Button variant="secondary" size="lg">
              Open in Telegram
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="mt-24 grid gap-4 md:grid-cols-3">
      <FeatureCard
        icon={Bolt}
        title="60-second markets"
        body={`Pick a tier (1 / 3 / 7 / 14 days), pay ${ECON.CREATION_FEE_TON} TON, and your
        market is live on chain. ${ECON.MARKET_SEED_AMOUNT_TON} TON seeds the pool so
        you're never betting against an empty book.`}
      />
      <FeatureCard
        icon={Coins}
        title="Earn on every pool"
        body={`Stake ${ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON and take 10% of every
        market you create. Correct voters share 30% of the platform fee on each
        resolved market.`}
      />
      <FeatureCard
        icon={ShieldCheck}
        title="Non-custodial by design"
        body="No accounts, no emails, no passwords. Your wallet signs every
        transaction; the app never holds a custodial balance."
      />
      <FeatureCard
        icon={Trophy}
        title="Climb the leaderboard"
        body="Weekly and all-time ranks. The top of the weekly board shares 20%
        of the platform's fee pool."
      />
      <FeatureCard
        icon={Bolt}
        title="Bot-native flows"
        body="Every write in the web app has a Telegram equivalent via
        @hopiumbet_bot — create, bet, vote, claim without leaving chat."
      />
      <FeatureCard
        icon={Coins}
        title="Open source, auditable"
        body="Tolk contracts, Python indexer, typed React — every line public.
        No trusted off-chain resolution."
      />
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Bolt;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-6">
      <Icon size={22} className="text-accent" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{body}</p>
    </div>
  );
}

function EconomyCallout() {
  return (
    <section className="mt-24 rounded-2xl border border-border bg-bg-elevated p-8 md:p-12">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Every resolved market pays four ways.
      </h2>
      <p className="mt-3 max-w-prose text-fg-muted">
        Ten percent of every pool becomes platform fee on resolution. Here's where
        it goes — same rule, every market, on chain.
      </p>
      <dl className="mt-8 grid gap-4 md:grid-cols-4">
        <Split pct="30%" label="Correct voters" />
        <Split pct="20%" label="Weekly leaderboard" />
        <Split pct="10%" label={`Creator (${ECON.CREATOR_BONUS_THRESHOLD_TON}+ TON staked)`} />
        <Split pct="40%" label="Platform + ops" />
      </dl>
    </section>
  );
}

function Split({ pct, label }: { pct: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle p-4">
      <dt className="text-3xl font-semibold tracking-tight text-accent">{pct}</dt>
      <dd className="mt-1 text-sm text-fg-muted">{label}</dd>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="mt-24 flex flex-col items-center gap-4 rounded-2xl border border-accent/30 bg-accent-subtle p-10 text-center">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Your first market is one click away.
      </h2>
      <p className="max-w-prose text-fg-muted">
        Connect your TON wallet, pick a topic, and you'll be live before this
        page finishes loading.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link to="/create">
          <Button size="lg" rightIcon={<ArrowRight size={18} />}>
            Create a market
          </Button>
        </Link>
        <Link to="/docs/getting-started">
          <Button variant="secondary" size="lg">
            Read the docs
          </Button>
        </Link>
      </div>
    </section>
  );
}
