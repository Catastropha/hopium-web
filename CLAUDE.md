# Hopium Web

Parimutuel prediction market web client. Standalone website sharing the same backend and user accounts as the Telegram Mini App.

## Currency

All amounts from the API are in **nanotons** (integer, 1 TON = 1,000,000,000). Display as `X.XX TON` using `formatTon(nanotons)`. Compact display uses `formatTonCompact(nanotons)` (e.g. "15K TON"). Share text and OG tags use `formatPoolCompact(nanotons)` for pool sizes.

`NANOTON = 1_000_000_000`, `MIN_BET = 1_000_000_000` (1 TON), `MIN_DEPOSIT = 1_000_000_000` (1 TON), `MIN_WITHDRAWAL = 5_000_000_000` (5 TON). All in nanotons.

## Auth

Web users authenticate via **web-code** — a 6-character alphanumeric code generated in the TMA. Single-step flow: enter code → authenticated. The login flow renders **inline in the bet detail panel** when an unauthenticated user clicks an outcome, preserving context (selected outcome stays highlighted, stake section appears immediately after auth). The standalone `/login` page uses the same web-code flow.

The code is generated via `POST /v1/auth/web-code` (TMA-side, requires TMA auth) and validated via `POST /v1/auth/web-code/validate` (web-side, no auth required). Codes are 6 uppercase alphanumeric characters, single-use, expire in 5 minutes.

Mobile visitors see the full code input form (not a TMA redirect). A "On mobile? Open in Telegram" link appears at the bottom of the login card.

## Payments

- **Deposits:** TON deep link. `POST /v1/balance/deposit` returns `{ ton_deep_link, memo, amount_nanoton, expires_at }`. The deep link opens the user's TON wallet (Tonkeeper / Telegram Wallet). Deposit info (memo, expiry countdown) shown inline. Balance refreshed on `visibilitychange`.
- **Withdrawals:** Direct TON transfer. `POST /v1/balance/withdraw` with `{ amount, wallet_address }` returns `{ withdrawal_id, amount }`. User provides their TON wallet address (48-67 chars). `GET /v1/balance/withdraw/{id}` returns `ton_tx_hash` for explorer link.

## Notifications

Bell icon in sidebar with unread badge. `GET /v1/notification/` (paginated). `POST /v1/notification/read` marks all read. Unread count fetched on app load and stored in `store.unreadNotifications`.

## Design Context

### Users

Desktop-first audience on laptops and large screens. Mix of existing TMA users wanting a richer experience and new users discovering Hopium outside Telegram. Sessions are 2-10 minutes — they tab between Hopium and their news sources, scanning markets, finding conviction, staking fast, and tracking positions. They expect information density, keyboard navigation, and snappy interactions.

**Job to be done:** "Scan markets, find conviction, stake fast, track positions — without switching apps."

### Brand Personality

**Bold. Sharp. Unapologetic.** The web version amplifies the TMA brand with more room — bigger odds bars, richer detail panels, visible portfolio metrics. Confidence is quieter here because the density does the talking.

- Labels are 1-3 words. Descriptions are 1 sentence max.
- Desktop users get more inline context (resolution criteria visible, not behind a tap).
- Every action feels like pressing Enter on a terminal command.

### Aesthetic Direction

**Crypto-native with attitude** — clean data presentation with bold personality. Think Polymarket's data clarity but with a strong point of view. Not a neutral spreadsheet with a logo on top.

- **Dark theme only** (dark by default, no light mode at launch). `--bg-primary: #0c0d10`.
- **System font stack** — zero load cost, OS-native feel.
- **4px base unit** spacing grid. All spacing is a multiple of 4px.
- **Green (#22C55E) = YES/positive.** **Red (#EF4444) = NO/negative.** These are semantic — used only for data-carrying elements.
- **Brand gradient:** `linear-gradient(135deg, #22C55E, #06B6D4)`.
- Category accents used sparingly (dots, chip text — not large fills).
- Motion is purposeful: 100-300ms, expo-out enters, ease-in exits. Respect `prefers-reduced-motion`.

**Anti-references:**
- Polymarket's blandness — Hopium has a point of view.
- Crypto exchange dashboards — no order books, no candlesticks. This is prediction markets, not trading.
- Generic SaaS dashboards — no sidebar with 30 nav items, no breadcrumbs, no settings icons everywhere.

**References:**
- Polymarket's data clarity and information hierarchy (but with more visual personality).
- The confidence and density of a Bloomberg terminal (but accessible and not intimidating).

### Design Principles

1. **Desktop-first, mobile-accessible.** Designed for >=1024px with pointer interactions, hover states, and keyboard shortcuts. Mobile visitors see the full site with a responsive layout and a dismissable Telegram CTA banner. The TMA remains the primary mobile experience, but shared links and browsing work on any device.

2. **Speed is the feature.** Optimistic UI everywhere. Skeleton screens over spinners. URL-driven state. Transitions under 200ms. Prefetch on hover.

3. **Information density, amplified.** Two-panel layout on desktop (list + detail). Bet cards show more inline. Tables where appropriate. Filters always visible — never behind a hamburger.

4. **Confidence through clarity.** Every action has feedback. States are explicit. Auth state is clear. URLs are human-readable.

5. **Bold restraint.** One accent color at a time. The data IS the design — odds bars, P&L numbers, pool sizes provide the visual interest. Don't compete with decoration.

### Accessibility

Target **WCAG 2.1 AAA** where feasible, with AA as the hard floor.

- All semantic colors must meet **4.5:1 contrast** against surfaces (7:1 preferred for AAA).
- Secondary visual cues beyond color for all color-coded information (YES/NO labels, +/- prefixes, text labels alongside status colors).
- Focus ring: `2px solid var(--focus-ring)`, visible on `:focus-visible` only.
- Full keyboard operability: j/k navigation, Enter to open, Escape to close, number keys for tabs, y/n for outcomes.
- Skip link as first focusable element. Logical tab order: sidebar -> filters -> bet list -> detail panel.
- `aria-live="polite"` for odds updates, balance changes, payout previews, toasts.
- Odds bar uses `role="meter"` with proper ARIA attributes.
- Route changes announced to screen readers.
- All animations inside `@media (prefers-reduced-motion: no-preference)`.
- Use `margin-inline-start` over `margin-left` (RTL-ready).
- Modals (keyboard shortcuts overlay) have focus traps, `role="dialog"`, `aria-modal="true"`, and restore focus on close.
- Login code input uses `aria-label` for accessibility.
- Form inputs use `aria-labelledby` pointing to section headings.

### Z-Index Scale

Defined as tokens in `tokens.css`:

| Token | Value | Usage |
|---|---|---|
| `--z-dropdown` | 30 | Filter bar country dropdown |
| `--z-panel` | 40 | Detail panel overlay on tablet/mobile |
| `--z-tooltip` | 60 | Sidebar tooltips |
| `--z-banner` | 100 | Telegram CTA banner |
| `--z-overlay` | 300 | Keyboard shortcuts overlay |
| `--z-share-menu` | 1000 | Share popover menu |

### Tech Stack

- **Vanilla JS + Vite** — no framework, matching the TMA stack.
- **CSS custom properties** for theming (tokens defined in `src/styles/tokens.css`).
- **System font stack** — no custom fonts.
- **JS bundle < 80KB gzipped, CSS < 10KB gzipped.**
- **No large dependencies.** `Intl` for formatting, native `fetch`, no UI framework, no state management library.

### Key Patterns

- **Cleanup pattern:** Page handlers return a cleanup function. Event listeners, store subscriptions, and timers are pushed to a `cleanups` array and executed on route change.
- **Inline HTML:** `html` template literal from `dom.js` creates DOM elements. User data always escaped with `escapeHtml()`.
- **Store reactivity:** `store.on(key, fn)` returns an unsubscribe function. Auth state (token, refresh token, user ID, username, photo URL) persisted to localStorage.
- **TON formatting:** All `formatTon*` functions take nanotons. Input fields accept TON and convert with `Math.round(parseFloat(value) * 1_000_000_000)`.

### Deployment

Builds with Vite, syncs to S3, invalidates CloudFront. Requires AWS CLI with a named profile.

```bash
# Live
export AWS_PROFILE=live-hopium && _devops/deploy.sh live

# Dev
export AWS_PROFILE=dev-hopium && _devops/deploy.sh dev
```

### Lambda@Edge — OG Tag Injection

A Lambda@Edge function serves server-rendered HTML with Open Graph meta tags to social media crawlers. This is necessary because the SPA sets meta tags client-side via JS, which crawlers (Twitter, Facebook, Telegram, Discord, etc.) don't execute.

**Source:** `hopium-tf/projects/web/lambda/og-tags/index.mjs` (lives in the Terraform repo, not this repo).

**How it works:** Attached to the CloudFront distribution's `origin-request` event. When a request for `/bet/:id` or `/share/:id` arrives with a crawler User-Agent, the Lambda fetches bet data from the Hopium API and returns minimal HTML with OG/Twitter Card/JSON-LD tags. Non-crawler requests pass through to S3 unchanged.

**Drift risk:** The Lambda has its own copies of `localize()`, `buildDescription()`, `esc()`, and the OG meta tag template. These mirror logic in `src/utils/seo.js` and `src/components/share-menu.js`. If you change the OG tag format, share text structure, TON formatting, or localization fallback logic on the web side, **update the Lambda too** — it's a separate Node.js runtime and cannot import from the Vite bundle. The Lambda needs to be updated to use TON formatting (pool amounts are now nanotons).
