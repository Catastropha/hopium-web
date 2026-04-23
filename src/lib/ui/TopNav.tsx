import { TonConnectButton } from '@tonconnect/ui-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/_kit/cn';

const ITEMS = [
  { to: '/markets', label: 'Markets' },
  { to: '/create', label: 'Create' },
  { to: '/mine', label: 'My bets' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/stake', label: 'Stake' },
  { to: '/docs', label: 'Docs' },
] as const;

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent font-bold text-white">
            h
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">hopium.bet</span>
        </NavLink>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'text-fg'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
}
