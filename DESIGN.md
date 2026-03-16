# Hopium Web — Design System & Philosophy

## Design Context

### Users

Hopium Web users arrive via shared links, search, or direct URL. They're on laptops and desktops — larger screens, keyboard + mouse, longer sessions. Some are existing TMA users who want a richer experience. Others are new users who discovered Hopium outside Telegram. They want to browse markets, analyze odds, place bets, and track their portfolio with the comfort of a full browser.

Sessions are longer than TMA (2-10 minutes). Users tab between Hopium and their news sources, checking if their thesis holds. They want density — more bets visible, more data at a glance, faster navigation between markets.

**Job to be done:** "I want to scan markets, find conviction, stake fast, and track my positions — without switching apps."

### Brand Personality

Inherited from TMA. **Bold. Sharp. Unapologetic.**

The web version amplifies this with more room to breathe. Desktop real estate lets the data speak louder — bigger odds bars, richer detail panels, visible portfolio metrics. The confidence is quieter here because the density does the talking.

**Voice & Tone (web-specific adjustments):**
- Same directness. Labels are 1-3 words. Descriptions are 1 sentence max.
- Desktop users tolerate slightly more context — show resolution criteria inline, not behind a tap.
- Keyboard users expect snappy responses. Every action should feel like pressing Enter on a terminal command.

### Emotional Goals

Same as TMA. One addition:

| Moment | Target Emotion |
|--------|---------------|
| First visit (no account) | Intrigue + low friction ("I can see everything, I just need to log in to play") |
| Browsing on desktop | Command ("I can see 20 markets at once, I own this") |

### Anti-References

Inherited from TMA, plus:
- **Polymarket's blandness:** Hopium has a point of view. Not a neutral spreadsheet with a logo on top.
- **Crypto exchange dashboards:** No order books, no candlesticks, no depth charts. This is prediction markets, not trading.
- **Generic SaaS dashboards:** No sidebar with 30 nav items, no breadcrumbs, no settings icons everywhere.

---

## Design Principles

### 1. Desktop-Native, Mobile-Capable

The web app is designed for screens >=1024px first, then adapted down. This is the opposite of the TMA. Desktop gets the full experience. Mobile gets a focused experience that nudges toward the TMA for the best mobile UX.

- Use pointer-based interactions: hover states, right-click context, keyboard shortcuts.
- Leverage horizontal space: two-panel layouts, wide bet cards, inline detail views.
- Mobile <768px: redirect to TMA via `tg://` deep link. No mobile layout — the TMA is the mobile experience.
- No bottom tab bar. Desktop uses a left sidebar.

### 2. Speed Is Still the Feature

Same as TMA. Every interaction feels instant.

- **Optimistic UI everywhere.** Bet placement updates odds immediately.
- **Skeleton screens over spinners.** Content-shaped placeholders while loading.
- **URL-driven state.** Every view is a URL. Back button works. Deep links work. Sharing a bet link shows that bet.
- **Transitions under 200ms.** Panel opens, filters apply, tabs switch — all under 200ms.
- **Prefetch on hover.** When cursor enters a bet card, prefetch that bet's detail data.

### 3. Information Density, Amplified

Desktop has more space. Use it for density, not decoration.

- **Two-panel layout on desktop.** Left: scrollable bet list. Right: detail panel for the selected bet. No page navigation for the core flow.
- **Bet cards show more on desktop.** Add resolution criteria preview, total bettors count, and your position — all visible without clicking.
- **Tables where appropriate.** Leaderboard is a proper table on desktop, not stacked cards.
- **Filters are always visible.** No hamburger menu hiding the country/category filters. They sit in a persistent bar.

### 4. Confidence Through Clarity

Same as TMA. Real value at stake — the UI must never leave users uncertain.

- **Every action has feedback.** Visual confirmation for bets, animated balance changes, inline errors.
- **States are explicit.** Position indicators on every card. P&L always visible.
- **Auth state is clear.** Logged-out users can browse everything. Betting actions show a login prompt — never a dead end.
- **URLs are human-readable.** `/bet/btc-100k-july-2026` not `/bet/abc123`.

### 5. Bold Restraint

Same as TMA. The brand is edgy but the UI is disciplined.

- **One accent color at a time.** Primary CTA gets the accent. Everything else stays neutral.
- **Motion with purpose.** Animate to communicate, never to decorate.
- **The data is the design.** Odds bars, P&L numbers, pool sizes — these are the visual interest. Don't compete with decorative elements.

---

## Theming

### Own System, No Telegram Dependency

The web app owns its own theme. Dark by default, matching the LP aesthetic.

### Color Tokens

```css
:root {
  /* Neutrals — cool blue-green tint (inherited from LP) */
  --bg-primary: #0c0d10;
  --bg-surface: #161820;
  --bg-elevated: #1c1e28;
  --bg-hover: #22242e;
  --border: #232530;
  --border-subtle: #1a1c26;

  /* Text */
  --text-primary: #e4e6eb;
  --text-secondary: #7d818a;
  --text-tertiary: #565860;
  --text-inverse: #0c0d10;

  /* Brand gradient */
  --grad: linear-gradient(135deg, #22C55E, #06B6D4);

  /* Outcome colors */
  --yes: #22C55E;
  --yes-soft: oklch(72% 0.15 152 / 0.10);
  --yes-hover: #1ea84f;
  --no: #EF4444;
  --no-soft: oklch(63% 0.2 25 / 0.10);
  --no-hover: #dc3535;

  /* Category accents */
  --cat-crypto: #F59E0B;
  --cat-sports: #3B82F6;
  --cat-politics: #8B5CF6;
  --cat-culture: #EC4899;
  --cat-tech: #06B6D4;

  /* Functional */
  --warning: #F59E0B;
  --error: #EF4444;
  --success: #22C55E;
  --info: #3B82F6;

  /* Interactive */
  --focus-ring: oklch(72% 0.15 152 / 0.5);

  /* Radii */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-pill: 999px;
}
```

### Light Mode

Not for launch. Dark-only matches the brand. Light mode is a future consideration — the token structure supports it via CSS custom properties swap, but don't build it until there's demand.

### Rules

- Semantic outcome colors (`--yes`, `--no`) are used only for data-carrying elements: odds, P&L, status badges.
- All structural UI (backgrounds, text, borders) uses neutral tokens.
- Category accents are used sparingly — small dots, chip text, not large fills.
- Never use `--bg-primary` for text. Never use `--text-primary` for backgrounds. Tokens are named for their role.
- Hover states darken toward `--bg-hover`, never lighten (dark theme).

---

## Typography

### System Font Stack

Same as TMA and LP. No custom fonts. System fonts load at zero cost and match OS conventions.

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale (Desktop-First)

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 28px | 700 | 1.15 | Hero numbers (total P&L, balance) |
| Title Large | 22px | 700 | 1.2 | Page titles |
| Title | 17px | 600 | 1.3 | Bet card titles, section headers |
| Body | 15px | 400 | 1.5 | Descriptions, detail text |
| Body Strong | 15px | 600 | 1.5 | Odds values, balances, key numbers |
| Caption | 13px | 400 | 1.4 | Timestamps, secondary labels, metadata |
| Caption Strong | 13px | 600 | 1.4 | Category tags, small badges, filter chips |
| Micro | 11px | 500 | 1.2 | Fine print, keyboard shortcut hints |

### Rules

- **Numbers are always `font-variant-numeric: tabular-nums`.** Odds, pools, balances, countdowns — all use tabular figures.
- **Titles truncate with ellipsis.** 2 lines max on cards, full display in detail panel.
- **No fluid type scaling.** Fixed sizes at each breakpoint. The type scale is small enough that `clamp()` adds complexity without benefit.
- **`letter-spacing: -0.02em` on Title Large and Display.** Tightens headings for the sharp, confident feel.

---

## Spacing & Layout

### Grid: 4px Base Unit

Same as TMA. All spacing is a multiple of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps (icon-to-label, inline elements) |
| `--space-sm` | 8px | Intra-component spacing |
| `--space-md` | 12px | Component padding, gaps between related items |
| `--space-lg` | 16px | Section padding, gaps between cards |
| `--space-xl` | 24px | Major section breaks |
| `--space-2xl` | 32px | Page-level padding, panel gaps |
| `--space-3xl` | 48px | Top-of-page breathing room |

### Desktop Layout (>=1024px)

```
+---+----------------------------------+--------------------+
| N |                                  |                    |
| A |  Main Content Area               |  Detail Panel      |
| V |  (bet list, leaderboard, etc.)   |  (selected bet)    |
|   |                                  |                    |
| S |  max-width: 640px                |  min-width: 380px  |
| I |  scrolls independently           |  scrolls independently
| D |                                  |                    |
| E |  Filter bar pinned to top        |                    |
| B |                                  |                    |
| A |                                  |                    |
| R |                                  |                    |
+---+----------------------------------+--------------------+
     60px                  flexible                flexible
```

- **Sidebar:** Fixed left, 60px wide (icons only, labels on hover/expanded state). Background: `--bg-primary`. Border-right: `--border`.
- **Main content:** Scrollable. Filter bar sticks to top on scroll. Bet cards stack vertically. Max-width 640px centered within available space.
- **Detail panel:** Slides in from right when a bet is selected. Takes ~40% of remaining width (min 380px, max 480px). Sticky position — stays visible while main content scrolls. Shows "Select a bet" empty state when nothing is selected.
- **Total layout:** `display: grid; grid-template-columns: 60px 1fr minmax(380px, 480px);`
- When detail panel is closed, main content centers in full remaining width.

### Tablet Layout (768px - 1023px)

- Sidebar collapses to a top bar (56px height, horizontal icon row).
- Two-panel layout collapses to single column.
- Clicking a bet opens detail as a full-width view with back navigation.

### Mobile Redirect (<768px)

No mobile layout. Mobile visitors are redirected to the Telegram Mini App.

- Detect via screen width (<768px) or mobile user-agent.
- Redirect to TMA deep link: `https://t.me/BOT_USERNAME/app` (opens the Mini App inside Telegram).
- Show a brief interstitial: "Hopium is best on Telegram" with the redirect link, in case auto-redirect fails or the user doesn't have Telegram installed.
- Share links (`/share/[id]`) and bet links (`/bet/[id]`) on mobile should redirect to the TMA with the relevant context preserved in the deep link.

### Content Width

- Bet cards: full width of main content area (max 640px).
- Detail panel content: full width of panel minus 24px padding.
- Leaderboard table: full width of main content, max 800px.
- Profile/wallet: centered column, max 480px.

---

## Navigation & Routing

### Sidebar Navigation (Desktop)

```
+--------+
|  LOGO  |   ← Hopium mark, links to /
|--------|
|  [🏠]  |   ← /           Home (Browse)
|  [📊]  |   ← /my-bets    My Bets
|  [🏆]  |   ← /leaders    Leaderboard
|  [👤]  |   ← /profile    Profile / Wallet
|--------|
|        |
|        |
|        |
|  [⚙]  |   ← /settings   (future)
+--------+
```

- 60px wide, icon-only by default.
- Active tab: icon tinted with `--yes` (brand green), left edge 2px accent bar.
- Inactive: icon in `--text-secondary`.
- Hover: background `--bg-hover`, tooltip with label appears after 400ms.
- Keyboard: arrow keys navigate between items. Enter activates.

### URL Structure

```
/                           → Home (browse all bets)
/bet/:slug                  → Bet detail (also opens in detail panel on desktop)
/my-bets                    → My Bets (active tab default)
/my-bets/resolved           → My Bets (resolved tab)
/leaders                    → Leaderboard
/leaders/:period            → Leaderboard with time filter (7d, 30d, all)
/profile                    → Profile / Wallet
/login                      → Login flow
```

- **Slug format:** Derived from bet title. `btc-100k-july-2026`, `trump-reelected-2028`. Human-readable, shareable.
- **Query params for filters:** `/?country=ru&category=crypto`. Filters persist in URL for shareability and back-button support.
- **Detail panel on desktop:** Clicking a bet card updates URL to `/bet/:slug` AND opens the detail panel. Direct URL visit loads the bet in the detail panel with the home feed as the main content.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `j` / `k` | Move selection down / up in bet list |
| `Enter` | Open selected bet in detail panel |
| `Escape` | Close detail panel, deselect |
| `1` - `4` | Switch to tab (Home, My Bets, Leaders, Profile) |
| `y` | Select YES on open bet |
| `n` | Select NO on open bet |
| `f` | Focus filter bar |
| `?` | Show keyboard shortcuts overlay |

- Shortcuts only fire when no input is focused.
- Show hint text in micro size next to relevant UI elements: `Press J/K to navigate`.

---

## Component Patterns

### Bet Card (Desktop)

Wider than TMA. More metadata visible inline.

```
+--------------------------------------------------------------+
|  [●] Crypto                              2d 14h remaining    |
|                                                               |
|  Will Bitcoin reach $100k by July 2026?                       |
|                                                               |
|  [=========GREEN==========|=====RED=====]                     |
|  YES 65% · 9,750 staked       NO 35% · 5,250 staked          |
|                                                               |
|  ⭐ 15,000 pool    247 bettors    [Your bet: 500 → YES]      |
+--------------------------------------------------------------+
```

**Composition:**
- **Top row:** Category dot + label left, countdown right. Both `Caption` size, `--text-secondary`.
- **Title:** 2 lines max, `Title` size (17px/600).
- **Odds bar:** Same as TMA — 6px height, fully rounded, green/red proportional split. Width transitions on odds change.
- **Odds labels:** Below bar. YES% and stake left, NO% and stake right. `Body Strong` size.
- **Bottom row:** Pool with star icon, bettor count, user's position badge (if any). `Caption` size.

**States:**
- **Default:** As above.
- **Hover:** `--bg-hover` background. Subtle lift — no shadow, just background shift.
- **Selected (detail panel open):** Left border 2px `--yes` or `--no` depending on user's position, or `--text-secondary` if no position. Background `--bg-elevated`.
- **User has position:** "Your bet: 500 → YES" badge in the outcome's color.
- **Resolved (won):** Left border 2px `--yes`. "Won +300 ⭐" badge.
- **Resolved (lost):** Opacity 0.6. "Lost" badge in `--text-secondary`.
- **Skeleton:** Pulsing rectangles matching layout.
- **Keyboard-focused:** Focus ring `--focus-ring`, 2px solid, 2px offset.

### Detail Panel

The right-side panel on desktop. Full-screen overlay on mobile.

```
+--------------------------------------------+
|  [✕ Close]                                  |
|                                             |
|  [Image — if available, 200px max-height]   |
|                                             |
|  CRYPTO                                     |
|  Will Bitcoin reach $100k by                |
|  July 2026?                                 |
|                                             |
|  ⏱ 107d 14h    ⭐ 15,000 pool    247 bets   |
|                                             |
|  [Full description text]                    |
|                                             |
|  Resolution criteria                        |
|  ┌─────────────────────────────────────┐    |
|  │ BTC/USD spot price on Coinbase at   │    |
|  │ market close on July 31, 2026.      │    |
|  └─────────────────────────────────────┘    |
|                                             |
|  PICK YOUR SIDE                             |
|  ┌────────────────┐  ┌────────────────┐     |
|  │     YES        │  │      NO        │     |
|  │     65%        │  │      35%       │     |
|  │  ⭐ 9.7k · 1.5x │  │  ⭐ 5.2k · 2.9x │     |
|  └────────────────┘  └────────────────┘     |
|                                             |
|  ── After picking a side: ──                |
|                                             |
|  HOW MUCH?                                  |
|  ┌─────────────────────────────────┐        |
|  │  ⭐  |      [100]       | MAX  │        |
|  └─────────────────────────────────┘        |
|  [10]  [50]  [100]  [500]                   |
|                                             |
|  ┌─────────────────────────────────┐        |
|  │ Potential payout       ⭐ 150    │        |
|  └─────────────────────────────────┘        |
|                                             |
|  [██████ PLACE BET ██████████████]          |
+--------------------------------------------+
```

**Flow (same progressive disclosure as TMA):**
1. User sees question + two outcome buttons.
2. Clicks one → selected fills solid, other dims to 40% opacity.
3. Stake section slides in (200ms ease-out).
4. Quick amounts for one-click entry. MAX fills balance.
5. Payout preview updates live as they type.
6. Place Bet button matches selected side's color.
7. On success: green toast + odds update. Stay on panel (desktop users may want to bet again).
8. On error: red toast with specific message.

**Desktop difference from TMA:** No auto-return to home. User stays on the detail panel. They can immediately see their position update on the card in the main list.

### Odds Bar

Same spec as TMA:
- Full width minus padding. Green/red proportional split.
- Height: 6px. Border radius: 3px.
- No gap between segments.
- `transition: width 300ms ease-out`.

### Filter Bar (Desktop)

Pinned to top of main content area on scroll.

```
+--------------------------------------------------------------+
| [🌍 Global ▾]  [All] [Crypto] [Sports] [Politics] [Culture] [Tech] |
+--------------------------------------------------------------+
```

- **Country selector:** Dropdown (not horizontal scroll). Shows flag + name. Click to open, select one.
- **Category chips:** Same pill pattern as TMA. Selected = category accent at 12% opacity background + accent text. Unselected = `--bg-surface` + `--text-secondary`.
- **Sticky behavior:** `position: sticky; top: 0;` with `--bg-primary` background and bottom border when stuck.

### My Bets Screen

```
+--------------------------------------------------------------+
|  ┌──────────────────────────────────────────────────────┐    |
|  │         Total P&L                                     │    |
|  │        +⭐ 1,250                                      │    |
|  │ ───────────────────────────────────────────────────── │    |
|  │ Staked         Returned        Pending                │    |
|  │ ⭐ 5,000       ⭐ 6,250        ⭐ 800                  │    |
|  └──────────────────────────────────────────────────────┘    |
|                                                               |
|  [  Active (3)  |  Resolved (7)  ]                            |
|                                                               |
|  [Bet card with your position highlighted]                    |
|  [Bet card with your position highlighted]                    |
|  [Bet card with your position highlighted]                    |
+--------------------------------------------------------------+
```

- **P&L card:** Display size for total P&L. Green or red. Breakdown in `Caption` below.
- **Segmented control:** Same as TMA — Active / Resolved with counts.
- **Cards:** Same bet card component, but every card shows user's position prominently.
- **Empty state:** "No bets yet. Browse markets and find your conviction." + CTA button to home.
- Clicking a card opens it in the detail panel (desktop) or full-screen (mobile).

### Leaderboard Screen

Desktop uses a proper table. Mobile uses stacked cards.

**Desktop:**

```
+--------------------------------------------------------------+
|  [ 7 days | 30 days | All time ]                              |
|                                                               |
|       🥈           🥇           🥉                            |
|      user2        user1        user3                          |
|     +⭐ 8k       +⭐ 50k       +⭐ 3k                         |
|                                                               |
|  Rank   User          Win Rate   Streak   Profit              |
|  ─────────────────────────────────────────────────            |
|  4      user4         65%        🔥 3     +⭐ 2,100            |
|  5      user5         58%        🔥 1     +⭐ 1,400            |
|  6      user6         52%        —        +⭐ 800              |
|  7      user7         49%        —        +⭐ 350              |
+--------------------------------------------------------------+
```

- **Podium:** Same visual as TMA — 2nd-1st-3rd layout with avatar circles, names, profit.
- **Table rows (rank 4+):** Proper `<table>` with columns: Rank, User (avatar + name), Win Rate, Streak, Profit. Sortable by profit (default), win rate, streak.
- **Time tabs:** Segmented control, same pattern.
- **Your row:** Highlighted with `--bg-elevated` background. Always visible — if you're rank 847, show your row pinned at the bottom of the visible table with a separator.

### Profile / Wallet Screen

```
+--------------------------------------------------------------+
|  ┌──────────────────────────────────────────┐                |
|  │         Balance                           │                |
|  │        ⭐ 1,500                            │                |
|  │                                           │                |
|  │  [██ Deposit ██]    [ Withdraw ]          │                |
|  └──────────────────────────────────────────┘                |
|                                                               |
|  TRANSACTIONS                                                 |
|  ─────────────────────────────────────────────                |
|  ↓  Deposit       Mar 10, 2026        +⭐ 1,000              |
|  🎯 Bet placed    Mar 12, 2026         -⭐ 500               |
|  💰 Payout        Mar 14, 2026        +⭐ 750                |
|  ↑  Withdraw      Mar 15, 2026         -⭐ 200               |
+--------------------------------------------------------------+
```

- **Balance card:** `Display` size for the number. Green Deposit button (filled), outlined Withdraw button.
- **Deposit flow:** Click Deposit → inline expand below the button showing amount input + quick amounts + confirm. Same progressive disclosure pattern as bet placement.
- **Withdraw flow:** Same inline expand. Amount input + confirm.
- **Payment methods:** Web version supports Telegram Stars (via redirect to Telegram) and potentially card payments (future). Show available methods in the deposit flow.
- **Transaction history:** Table on desktop (Date, Type, Description, Amount). Stacked rows on mobile.
- Centered in main content area, max-width 480px.

### Toast Notifications

```
+------------------------------------------+
|  ✓  Bet placed: 100 ⭐ on YES    [✕]     |
+------------------------------------------+
```

- Appears at top-right of viewport (desktop) or top-center (mobile).
- Slide in from top, 200ms ease-out.
- Auto-dismiss after 4 seconds. Manual dismiss via close button.
- Colors: green background at 10% + green text for success. Red for error. Amber for warning.
- Max-width 400px. `Caption Strong` size text.

### Login Prompt

When a logged-out user tries to place a bet:

```
+------------------------------------------+
|                                          |
|  Log in to place your bet                |
|                                          |
|  [██ Continue with Telegram ██]          |
|                                          |
|  Browse freely. Log in when you're       |
|  ready to play.                          |
|                                          |
+------------------------------------------+
```

- Appears inline where the stake input would be — not a modal, not a full-page redirect.
- Single auth method: Telegram Login Widget.
- After auth: return to the exact bet they were viewing, side already selected.

---

## Authentication

### Strategy: Telegram Login Widget

No custom auth system. Users authenticate via Telegram's Login Widget, which provides verified Telegram identity without needing the TMA SDK.

**Flow:**
1. User browses freely (all bets, odds, leaderboard are public).
2. User clicks an outcome button → login prompt appears inline.
3. User clicks "Continue with Telegram" → Telegram Login Widget opens.
4. Telegram verifies identity → callback with user data + hash.
5. Backend verifies hash → issues JWT (same token format as TMA).
6. JWT stored in `httpOnly` cookie (not localStorage). Refresh via `/auth/refresh`.
7. User returns to the bet they were viewing, side pre-selected, stake input ready.

**Session:**
- JWT expires after 24 hours. Refresh token lasts 30 days.
- Logged-in state shown via avatar in sidebar (desktop) or top bar (mobile).
- Logout: clear cookie + redirect to home.

---

## Animation & Motion

### Principles

Same as TMA. Purposeful, fast, respectful of reduced motion.

- **Duration range:** 100-300ms for UI transitions. Nothing slower.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo out) for enters. `ease-in` for exits. `ease-out` for state changes.
- **Respect reduced motion.** All animations inside `@media (prefers-reduced-motion: no-preference)`. Instant state changes as fallback.

### Animation Map

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Detail panel open | Click bet card | Slide from right + fade | 200ms expo-out |
| Detail panel close | Click close / Escape | Slide right + fade | 150ms ease-in |
| Stake section appear | Side picked | Height reveal via grid-template-rows | 200ms ease-out |
| Odds bar | Odds change | Width transition | 300ms ease-out |
| Filter bar stick | Scroll past threshold | No animation — instant stick | 0ms |
| Bet card hover | Mouse enter | Background color shift | 100ms ease-out |
| Toast in | Success/error | Slide down from top | 200ms expo-out |
| Toast out | Auto-dismiss / close | Fade out | 150ms ease-in |
| Skeleton shimmer | Loading | Horizontal gradient sweep | 1.5s linear loop |
| Balance change | Deposit/withdraw/payout | Number counter animation | 400ms ease-out |
| Page transition | Route change | Fade in content | 150ms ease-out |
| Keyboard selection | J/K navigation | Outline moves to new card | Instant (no transition) |

### No Haptics

Web has no haptic feedback. Rely on visual + audio (optional, future) feedback instead.

---

## Accessibility

### Requirements

- **WCAG 2.1 AA** as baseline.
- All custom semantic colors (green, red, accents) must meet **4.5:1 contrast** against `--bg-surface` and `--bg-primary`.
- Secondary visual cues beyond color for all color-coded information (same as TMA):
  - Odds: green/red + "YES"/"NO" labels.
  - P&L: green/red + "+"/"-" prefix.
  - Status: color + text label.

### Focus & Keyboard

- All interactive elements focusable and keyboard-operable.
- Focus ring: `2px solid var(--focus-ring)`, `2px offset`. Visible on `:focus-visible` only (no focus ring on mouse click).
- Logical tab order: sidebar → filter bar → bet list → detail panel.
- Skip link: "Skip to main content" as first focusable element.
- Keyboard shortcuts documented in `?` overlay and announced to screen readers.

### Screen Readers

- Bet cards: `aria-label` combining title, odds, pool, position.
- Odds bar: `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
- Detail panel: `role="complementary"` with `aria-label="Bet details"`.
- Live regions: `aria-live="polite"` for odds updates, balance changes, toast notifications.
- Route changes: announce new page title to screen readers.

### Color Contrast Verification

| Color | Against `--bg-surface` (#161820) | Against `--bg-primary` (#0c0d10) |
|-------|----------------------------------|----------------------------------|
| `--yes` #22C55E | 5.8:1 | 6.9:1 |
| `--no` #EF4444 | 4.6:1 | 5.5:1 |
| `--text-primary` #e4e6eb | 12.2:1 | 14.5:1 |
| `--text-secondary` #7d818a | 4.5:1 | 5.3:1 |
| `--cat-crypto` #F59E0B | 5.9:1 | 7.1:1 |

All pass AA. `--text-secondary` sits at the minimum — don't use it on `--bg-elevated` backgrounds without checking.

---

## Internationalization

### Same System as TMA

Two i18n systems:
1. **API content** — `localize(dict)` for multi-language fields from API.
2. **UI strings** — `t(key)` for static interface text.

**Supported languages:** `en`, `ru`, `uk`, `pt`, `hi`, `ro`.

### Web-Specific Considerations

- **`<html lang>` attribute** must match the active language.
- **URL structure for i18n:** No path-based locale (`/ru/bet/...`). Language is a user preference stored in cookie/localStorage. Content is the same URL regardless of language.
- **`<meta>` description** should be localized for SEO (future, when SSR is added).
- **Number/date formatting:** Same `Intl.NumberFormat` and `Intl.DateTimeFormat` as TMA.
- **RTL:** Same as TMA — not required for launch languages, but don't hardcode `text-align: left` or directional margins. Use `margin-inline-start` over `margin-left`.

---

## Performance

### Budgets

| Metric | Target |
|--------|--------|
| Total JS bundle (gzipped) | < 80KB |
| Total CSS bundle (gzipped) | < 10KB |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| CLS | < 0.1 |

### Strategies

- **Vanilla JS + Vite.** Same stack as TMA. No framework.
- **Single bundle.** App is small enough that code splitting adds complexity without benefit.
- **Skeleton screens.** Every view shows content-shaped placeholders while API data loads.
- **Prefetch on hover.** Bet detail data fetched when cursor enters a card. By the time they click, data is ready.
- **Hashed assets.** Content-hashed filenames, cached forever at CDN. Short TTL on `index.html`.
- **Images optional.** Bet cards work without images. Detail panel loads images lazily, HTTPS-only via `safeImageUrl()`.
- **No large dependencies.** `Intl` for formatting, native `fetch`, no UI framework, no state management library.

---

## Shared Infrastructure

### API

Same API as TMA. Base URL via `VITE_API_BASE` env var. Same endpoints, same auth headers (JWT in `Authorization: Bearer`).

The web app and TMA share a single backend. A user's account, bets, balance, and positions are the same regardless of which client they use.

### Assets

Logo, category icons, and OG images shared across TMA, LP, and web. Stored in a shared S3 bucket or referenced by URL.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stack | Vanilla JS + Vite | Same as TMA. Consistency, simplicity, tiny bundle |
| Theme | Own dark theme, no Telegram vars | Web app must work outside Telegram |
| Layout | Two-panel (list + detail) on desktop | Leverages screen real estate, no page navigation for core flow |
| Navigation | Left sidebar (desktop), top bar (mobile) | Desktop-native pattern, keeps content area uninterrupted |
| Auth | Telegram Login Widget | Same identity as TMA, no custom auth to maintain |
| Routing | URL-based with human-readable slugs | Shareable, bookmarkable, SEO-ready |
| Keyboard | Full shortcut system (j/k, y/n, 1-4) | Desktop power users expect it |
| Mobile strategy | Redirect to TMA | No mobile layout — TMA is the mobile experience |
| Light mode | Not for launch | Brand is dark. Token structure supports future addition |
| Color system | Same semantic colors as TMA + LP | Brand consistency across all surfaces |
| Typography | System font stack | Zero load cost, OS-native feel |
| i18n | Same 6 languages, same `t()` system | Shared translations where possible |
| Detail panel behavior | Stay open after bet (desktop) | Desktop users browse faster, don't want auto-redirect |
| Public access | Full browse without login | Reduces friction, lets users see value before committing |
