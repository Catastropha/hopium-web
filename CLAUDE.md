# hopium-web — Claude context

## Product concept

hopium.bet is a Telegram-first decentralized prediction market factory on TON.
This repo is the **public web app** — a static Vite + React + TS + Tailwind
SPA that runs outside Telegram. It serves two overlapping audiences:

1. **Visitors** landing from organic search / social — see the pitch, read
   the docs, click "Open in Telegram" to launch `@hopiumbet_bot` / the TMA.
2. **Logged-in users** — same feature surface as the Telegram Mini App
   (browse markets, place bets, stake, vote, view leaderboard) rendered
   desktop-first with a top nav + main column layout.

It talks to:

1. **hopium-api** (`../hopium-api`) — REST backend over `VITE_API_BASE_URL`.
2. **TON Connect 2.0** — wallet connection + signed proofs + transaction
   sending.
3. **Telegram Login Widget** (`telegram.org/js/telegram-widget.js`) — for
   binding a Telegram identity to the session when the user is not inside
   the TMA.

The web never holds secrets, never talks to RPC directly, and never writes
to a database. It is a rendering + action layer: read materialized state
from the API, push signed transactions via TON Connect.

## Surfaces

Public (no auth):

1. `/` — Landing: hero, features, how-it-works, CTA to open TMA
2. `/docs` — Docs index
3. `/docs/getting-started` — First-market walkthrough
4. `/docs/staking` — Stake mechanics + 500 TON creator bonus
5. `/docs/voting` — Voting and resolution flow
6. `/docs/privacy` — Privacy policy
7. `/docs/terms` — Terms of use

Dashboard (reads public, writes require session):

8. `/markets` — Live markets list + AI-suggested topics
9. `/create` — Create Market: tier picker, outcome editor, 19 TON confirm
10. `/market/:address` — Market detail: outcomes, betting card, vote panel
11. `/mine` — My Bets / My Markets tabs
12. `/leaderboard` — Weekly + all-time ladder
13. `/stake` — Stake / withdraw / vote history

Desktop-first; the layout degrades gracefully to tablet / phone widths.

## Auth model

Same two-factor identity as the TMA (matches hopium-api's identity contract):

1. **Telegram identity** — via the Telegram Login Widget when outside the
   TMA. The widget returns an HMAC-signed blob `{id, first_name, ...,
   auth_date, hash}` which we forward to `/v1/auth/telegram` with
   `source: 'web'`. The backend must treat the widget signature and
   Mini-App `initData` signature as equivalent identity proofs.
2. **TON Connect proof** — wallet signs `ton-proof-item-v2/...` payload.

Both are POSTed to `/v1/auth/telegram` → backend returns `session_token`
(opaque, 30-day TTL). Token goes in the `Authorization: Bearer <token>`
header on every subsequent API call. Stored in `localStorage` keyed on
`wallet_address`.

Visitors who don't complete this flow can still browse public reads:
markets list, market detail, leaderboard, docs. Writes require both
Telegram Login *and* wallet proof.

## Source tag

Every session the web creates declares `source: 'web'` (vs. `'tma'` for the
Telegram Mini App and `'bot'` for bot-originated sessions). Part of the
wire contract — see hopium-api CLAUDE.md.

## Error envelope

Every non-2xx response from hopium-api is `{'detail': {'code':
'<ns>:<slug>-<digit>'}}`. The api client in `src/lib/api/client.ts` parses
this into an `ApiError` carrying the `code`. UI renders a code-specific
message. **Never surface the raw code to users** — map to a user-readable
string via `src/lib/api/error.ts`.

## Chain constants

Mirror `../hopium-contracts/wrappers/opcodes.ts` into `src/lib/chain/opcode.ts`.
The web builds TON Connect messages with the canonical OP / TIER / PHASE
values. Any opcode drift breaks transactions silently — treat this mirror
as wire-locked.

Economic constants (`CREATION_FEE_TON = 19`, `STAKING_MIN_AMOUNT_TON = 10`,
`CREATOR_BONUS_THRESHOLD_TON = 500`) are surfaced in UI text and must stay
in lockstep with the contract constants.

## Env vars

Frontend env vars are read from Vite's `import.meta.env` with the `VITE_`
prefix. See `.env.example`:

- `VITE_API_BASE_URL` — hopium-api root, e.g. `https://api.hopium.bet`
- `VITE_TONCONNECT_MANIFEST_URL` — URL the wallet fetches to learn the app
  identity. The manifest itself is served from `public/tonconnect-manifest.json`.
- `VITE_TON_NETWORK` — `mainnet` / `testnet`
- `VITE_FACTORY_ADDRESS` — deployed Factory address (friendly form)
- `VITE_STAKING_ADDRESS` — deployed Staking address (friendly form)
- `VITE_BOT_USERNAME` — `hopiumbet_bot` — used for Telegram Login Widget +
  share / "Open in Telegram" deeplinks
- `VITE_SENTRY_DSN` — optional error reporting

## Running locally

```
npm install
npm run dev        # Vite dev server on :5174
npm run build      # outputs static dist/
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

## What NOT to do

- Do **not** call TON RPC from the frontend. All chain reads go through
  hopium-api; all writes go through TON Connect.
- Do **not** store session tokens anywhere besides `localStorage`. No
  cookies, no IndexedDB, no third-party storage.
- Do **not** add a second auth path. Telegram identity + TON proof is the
  only way in — matches the backend contract.
- Do **not** depend on Telegram WebApp features (theme vars, `MainButton`,
  haptics). Those belong to hopium-tma; this repo renders in a normal
  browser without that runtime.
- Do **not** use a third-party UI kit (MUI, Chakra, shadcn). Tailwind +
  small hand-written primitives in `src/lib/ui/` only.
- Do **not** import from `src/page/*` into `src/lib/*` or `src/core/*`.
  See CONVENTION.md §3-Layer Architecture.
