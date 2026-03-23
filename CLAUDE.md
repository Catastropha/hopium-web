# Hopium Web

Parimutuel prediction market web client. Standalone website sharing the same backend and user accounts as the Telegram Mini App.

## Currency

All amounts from the API are in **cents** (integer). Display as `$X.XX` using `formatDollars(cents)`. Compact display uses `formatDollarsCompact(cents)` (e.g. "$15K"). Share text and OG tags use `formatPoolCompact(cents)` for pool sizes.

`MIN_BET = 100` ($1.00), `MIN_DEPOSIT = 100` ($1.00), `MIN_WITHDRAWAL = 1000` ($10.00). All in cents.

## Auth

Web users authenticate via **email OTP** — no Telegram Login Widget. Two-step flow: email input → 6-digit code. The login flow renders **inline in the bet detail panel** when an unauthenticated user clicks an outcome, preserving context (selected outcome stays highlighted, stake section appears immediately after auth). The standalone `/login` page uses the same OTP flow.

TMA users who want web access connect an email via the profile page. The `/v1/auth/email/connect` endpoint links an email to an existing TMA account.

Mobile visitors see the full email OTP form (not a TMA redirect). A "On mobile? Open in Telegram" link appears at the bottom of the login card.

## Payments

- **Deposits:** Onramper fiat-to-crypto widget. `POST /v1/balance/deposit` returns `{ widget_config }`. The widget opens in an iframe modal (`src/components/onramper-widget.js`) with focus trap, scroll lock, and focus restoration.
- **Withdrawals:** MoonPay off-ramp. `POST /v1/balance/withdraw` returns `{ withdrawal_id, moonpay_widget_url }`. Opens in a new tab.
- **Pay with Card:** When placing a bet with insufficient balance, a "Pay with card $X.XX" button appears. `POST /v1/position/card` returns `{ widget_config }` for Onramper.

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
- Modals (Onramper widget, keyboard shortcuts overlay) have focus traps, `role="dialog"`, `aria-modal="true"`, and restore focus on close.
- OTP inputs use `aria-describedby` linking to the email confirmation text.
- Form inputs use `aria-labelledby` pointing to section headings.

### Z-Index Scale

Defined as tokens in `tokens.css`:

| Token | Value | Usage |
|---|---|---|
| `--z-panel` | 40 | Detail panel overlay on tablet/mobile |
| `--z-banner` | 100 | Telegram CTA banner |
| `--z-share-menu` | 1000 | Share popover menu |
| `--z-modal` | 2000 | Onramper payment modal |

### Tech Stack

- **Vanilla JS + Vite** — no framework, matching the TMA stack.
- **CSS custom properties** for theming (tokens defined in `src/styles/tokens.css`).
- **System font stack** — no custom fonts.
- **JS bundle < 80KB gzipped, CSS < 10KB gzipped.**
- **No large dependencies.** `Intl` for formatting, native `fetch`, no UI framework, no state management library.

### Key Patterns

- **Cleanup pattern:** Page handlers return a cleanup function. Event listeners, store subscriptions, and timers are pushed to a `cleanups` array and executed on route change.
- **Inline HTML:** `html` template literal from `dom.js` creates DOM elements. User data always escaped with `escapeHtml()`.
- **Store reactivity:** `store.on(key, fn)` returns an unsubscribe function. Auth state persisted to localStorage including `email` field.
- **Code splitting:** Onramper widget is dynamically imported (`import('./onramper-widget.js')`) only when needed.
- **Dollar formatting:** All `formatDollars*` functions take cents. Input fields accept dollars and convert with `Math.round(parseFloat(value) * 100)`.

### Lambda@Edge — OG Tag Injection

A Lambda@Edge function serves server-rendered HTML with Open Graph meta tags to social media crawlers. This is necessary because the SPA sets meta tags client-side via JS, which crawlers (Twitter, Facebook, Telegram, Discord, etc.) don't execute.

**Source:** `hopium-tf/projects/web/lambda/og-tags/index.mjs` (lives in the Terraform repo, not this repo).

**How it works:** Attached to the CloudFront distribution's `origin-request` event. When a request for `/bet/:id` or `/share/:id` arrives with a crawler User-Agent, the Lambda fetches bet data from the Hopium API and returns minimal HTML with OG/Twitter Card/JSON-LD tags. Non-crawler requests pass through to S3 unchanged.

**Drift risk:** The Lambda has its own copies of `localize()`, `buildDescription()`, `esc()`, and the OG meta tag template. These mirror logic in `src/utils/seo.js` and `src/components/share-menu.js`. If you change the OG tag format, share text structure, dollar formatting, or localization fallback logic on the web side, **update the Lambda too** — it's a separate Node.js runtime and cannot import from the Vite bundle. The Lambda still needs to be updated to use dollar formatting (pool amounts changed from Stars to cents).
