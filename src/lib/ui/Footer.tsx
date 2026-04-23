import { Link } from 'react-router-dom';

import { config } from '@/core/config';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-bg">
      <div className="mx-auto grid max-w-content gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent font-bold text-white">
              h
            </span>
            <span className="font-display text-lg font-semibold">hopium.bet</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-fg-muted">
            Decentralized prediction markets on TON. Create a market in under a
            minute.
          </p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            { to: '/markets', label: 'Markets' },
            { to: '/create', label: 'Create' },
            { to: '/leaderboard', label: 'Leaderboard' },
            { to: '/stake', label: 'Stake' },
          ]}
        />
        <FooterColumn
          title="Docs"
          links={[
            { to: '/docs', label: 'Overview' },
            { to: '/docs/getting-started', label: 'Getting started' },
            { to: '/docs/staking', label: 'Staking' },
            { to: '/docs/voting', label: 'Voting' },
          ]}
        />
        <FooterColumn
          title="Telegram"
          links={[
            { href: `https://t.me/${config.botUsername}`, label: `@${config.botUsername}` },
            { to: '/docs/privacy', label: 'Privacy' },
            { to: '/docs/terms', label: 'Terms' },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-4 text-xs text-fg-subtle">
          Built on TON · Non-custodial · No accounts
        </div>
      </div>
    </footer>
  );
}

interface LinkSpec {
  to?: string;
  href?: string;
  label: string;
}

function FooterColumn({ title, links }: { title: string; links: LinkSpec[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.to ? (
              <Link to={link.to} className="text-sm text-fg-muted hover:text-fg">
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-fg-muted hover:text-fg"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
