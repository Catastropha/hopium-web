# Hopium Web

Parimutuel prediction market web client. Standalone website sharing the same backend and user accounts as the Telegram Mini App.

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

1. **Desktop-only — mobile redirects to TMA.** Designed for >=1024px. Pointer interactions, hover states, keyboard shortcuts. Mobile visitors (screen width <768px or mobile user-agent) are redirected to the Telegram Mini App via `tg://` deep link. No mobile layout needed — the TMA IS the mobile experience.

2. **Speed is the feature.** Optimistic UI everywhere. Skeleton screens over spinners. URL-driven state. Transitions under 200ms. Prefetch on hover.

3. **Information density, amplified.** Two-panel layout on desktop (list + detail). Bet cards show more inline. Tables where appropriate. Filters always visible — never behind a hamburger.

4. **Confidence through clarity.** Every action has feedback. States are explicit. Auth state is clear. URLs are human-readable.

5. **Bold restraint.** One accent color at a time. The data IS the design — odds bars, P&L numbers, pool sizes provide the visual interest. Don't compete with decoration.

### Accessibility

Target **WCAG 2.1 AAA** where feasible, with AA as the hard floor.

- All semantic colors must meet **4.5:1 contrast** against surfaces (7:1 preferred for AAA).
- Secondary visual cues beyond color for all color-coded information (YES/NO labels, +/- prefixes, text labels alongside status colors).
- Focus ring: `2px solid var(--focus-ring)`, visible on `:focus-visible` only.
- Full keyboard operability: j/k navigation, Enter to open, Escape to close, number keys for tabs.
- Skip link as first focusable element. Logical tab order: sidebar -> filters -> bet list -> detail panel.
- `aria-live="polite"` for odds updates, balance changes, toasts.
- Odds bar uses `role="meter"` with proper ARIA attributes.
- Route changes announced to screen readers.
- All animations inside `@media (prefers-reduced-motion: no-preference)`.
- Use `margin-inline-start` over `margin-left` (RTL-ready).

### Tech Stack

- **Vanilla JS + Vite** — no framework, matching the TMA stack.
- **CSS custom properties** for theming (tokens defined in DESIGN.md).
- **System font stack** — no custom fonts.
- **JS bundle < 80KB gzipped, CSS < 10KB gzipped.**
- **No large dependencies.** `Intl` for formatting, native `fetch`, no UI framework, no state management library.
