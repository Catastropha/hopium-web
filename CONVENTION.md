# Conventions

**All code generated or modified by Claude must follow these conventions.**

## Design Philosophy

- **AI-first:** every file, function, and structure is designed to be read,
  understood, modified, and extended by AI agents without ambiguity.
- Prefer obvious over clever
- Prefer flat over nested
- Prefer explicit over implicit
- Prefer duplication over the wrong abstraction

**Simplicity is a hard product constraint, not just a code style.** Check
`CLAUDE.md` before proposing features — the product framing lives there.

## Code Style

- **TypeScript strict mode.** `strict: true`, `noUncheckedIndexedAccess: true`,
  `noImplicitOverride: true`. No `any` without an adjacent `// TODO` and a
  typed wrapper tracking it.
- **Named exports only.** No `export default`. The file name and export
  name stay in lockstep so grep finds callers.
- **Types for every public function signature.** Inference is fine for
  locals; never for exports.
- **One component per file.** File name = component name (`Button.tsx` →
  `export function Button(...)`). Hooks live next to their feature
  (`src/lib/{name}/hook.ts`), not in a generic `hooks/` directory.
- **No inline styles, no CSS modules, no styled-components.** Tailwind
  utility classes + CSS variables in `src/index.css` only. Complex
  one-offs get a `className` with `cn(...)` from `src/lib/_kit/cn.ts`.
- **No `React.FC`.** Use `function Name(props: Props) { ... }` form.
- **Logging via `console.warn` / `console.error` only** in production code;
  `console.log` is reserved for throwaway debug and must not ship.
- **No nesting deeper than 2 levels** in component JSX. Extract a
  sub-component when it grows.
- **500 LOC hard limit per `.ts` / `.tsx` file.** When you bump against it,
  split by responsibility.

## 3-Layer Architecture (core / lib / page)

The project follows a strict 3-layer structure. **Imports flow downward only.**

```
src/
├── App.tsx        composition root — wires providers around <Router/>
├── RootLayout.tsx composition root — outlet wrapper with top nav + footer
├── routes.tsx     composition root — defines the route → page map
├── main.tsx       composition root — ReactDOM bootstrap
├── index.css      global styles entry
├── core/      L0  Pure infrastructure (config, providers, error boundary, TON init)
├── lib/       L1  Reusable libraries — bounded contexts. Shared logic + UI primitives.
└── page/      L2  Route targets. One folder per page. No cross-page imports.
```

The composition root (files directly under `src/`) sits **above** the
3-layer rule. It's where `core/`, `lib/`, and `page/` are wired together —
same pattern as the backend's `app/main.py`. Those files may import from
any layer; no other file at that level is allowed.

### The rule (no exceptions)

| Layer | May import from | May NOT import from |
|---|---|---|
| `core/` | stdlib + 3rd-party | `src/lib`, `src/page` |
| `lib/{name}/` | stdlib + 3rd-party + `core/` + other `lib/{name}/` (acyclic) | `src/page/*` |
| `page/{name}/` | stdlib + 3rd-party + `core/` + `lib/` | other `page/{other}/*` (zero exceptions) |

This rule is **enforceable by grep**:

```sh
grep -r "from ['\"]@/page" src/lib/       # must be empty
grep -r "from ['\"]@/page" src/core/      # must be empty
grep -r "from ['\"]@/page/other" src/page/self/  # per page — must be empty
```

If you find yourself wanting to import from another page, the value belongs
in `lib/`. Promote it first; then both pages can use it.

### Page scaffold (strict — no other shapes allowed)

Every `page/{name}/` MUST follow one of these two shapes and **nothing else**:

**Default (small pages):**

```
page/{name}/
├── page.tsx                     # named export `<Name>Page` (CreatePage, StakePage…). No default exports.
├── type.ts                      # OPTIONAL — page-local types
└── {Component}.tsx              # OPTIONAL — page-local sub-components
```

**Split form (only when page-local sub-components proliferate):**

```
page/{name}/
├── page.tsx                     # thin orchestrator — composes sub-components
├── type.ts                      # local types
├── {SectionA}.tsx               # page-local sub-component
├── {SectionB}.tsx               # page-local sub-component
└── {SectionC}.tsx               # page-local sub-component
```

**Forbidden inside a page:**
- `utils.ts`, `helpers.ts`, `service.ts`, `hook.ts`, `index.ts`
- Any file named after a HTTP verb (`get.ts`, `post.ts`)
- Subdirectories (pages are flat)

If you need a helper, it goes in `lib/`. If you need a hook, it goes in
`lib/{feature}/hook.ts`. If you need a service call, it goes in
`lib/{feature}/service.ts`. The page stays a thin rendering layer.

### One page = one bounded surface

The page's responsibility must be statable in a single sentence. If you need
"and" or "also", split it.

- ✅ `page/markets/` — "list live markets + AI-suggested topics"
- ✅ `page/stake/` — "stake TON, view lock, cast votes"
- ❌ `page/dashboard/` — "markets, bets, stakes, leaderboard all in one"

### lib/ scaffold (recommended shape per bounded context)

```
lib/{name}/
├── type.ts                      # TypeScript types / interfaces
├── service.ts                   # API calls, pure service functions
├── hook.ts                      # React Query / React hooks wrapping service.ts
└── {Component}.tsx              # OPTIONAL — feature-scoped UI (rare; prefer lib/ui/)
```

`lib/ui/` is shared presentational primitives — Button, Card, Modal,
Spinner, TonAmount, AddressChip. **No domain knowledge** inside `lib/ui/`.

`lib/_kit/` is for **pure utility functions only** — no API calls, no React
state, no domain types. `cn()`, `sleep()`, `invariant()`, etc.

## Core (`src/core/`)

Infrastructure. Not a domain — it provides foundational services that every
domain depends on. Auth is **not** in `core/` — it lives in `src/lib/auth/`
because auth is a domain, not infrastructure.

```
src/core/
├── config.ts                    # Env vars + derived constants
├── telegram.ts                  # Telegram Login Widget loader + callback
├── tonconnect.tsx               # TonConnectUIProvider wiring
├── query.tsx                    # TanStack Query client + provider
└── error.tsx                    # Root ErrorBoundary
```

Everything in `src/core/` is stateless infrastructure — it holds no
domain logic and never imports from `src/lib/` or `src/page/`. Route
definitions and layout shells are not infrastructure; they live in the
composition root (`src/routes.tsx`, `src/RootLayout.tsx`).

### `config.ts` — env vars

Read from `import.meta.env.VITE_*`. Never read `import.meta.env` elsewhere.

## HTTP Client — `src/lib/api/`

Single `fetch`-backed client. No axios, no ky, no wrapper libs.

- Injects `Authorization: Bearer <session>` when a session exists.
- Parses `{detail: {code}}` error envelopes into `ApiError` (code preserved
  for UI mapping).
- JSON in, JSON out.

## TypeScript Types

Types follow the **Base / Create / Read / Update** pattern, mirroring the
backend's Pydantic models. `lib/{name}/type.ts`:

```ts
export interface MarketBase {
  address: string;
  creator_wallet: string;
  tier: number;
  outcome_count: number;
  topic_hash: string;
}

export interface MarketRead extends MarketBase {
  topic_text: string | null;
  phase: 0 | 1 | 2;
  betting_deadline: string;   // ISO 8601
  voting_deadline: string;
  winning_outcome: number | null;
  total_pool: string;         // Decimal string — never parse to number
  prize_pool: string;
  staker_reward_pool: string;
  creator_bonus_eligible: boolean;
  creation_tx_hash: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Rules

- **Decimal amounts stay as strings.** `MarketRead.total_pool: string`. Never
  `parseFloat`. Format for display via `src/lib/format/ton.ts`.
- **Dates as ISO strings.** `string`, not `Date`. Parse to `Date` only at
  the rendering boundary.
- **Addresses as raw strings.** Shape depends on source — raw form
  `"wc:hex64"` from the API, friendly form `"EQ..."` from TON Connect.
  Converters in `src/lib/format/address.ts`.
- **Interfaces over types for object shapes.** `type` for unions, tuples,
  mapped types.
- **Literal unions for enums** — `phase: 0 | 1 | 2`, not `enum Phase`.

## State — TanStack Query only

- **Server state:** TanStack Query. One hook per read (`useMarkets`,
  `useMarket(address)`, `useStake()`).
- **Client state:** `useState` / `useReducer` / `useContext`. **No Redux,
  no Zustand, no Jotai.**
- **Query keys** are arrays starting with the lib name:
  `['market', 'list']`, `['market', 'detail', address]`, `['bet', 'me']`.
  Invalidations match the array prefix.

## TON Connect

All chain writes go through TON Connect via `@tonconnect/ui-react`:

1. User clicks an action button.
2. Frontend POSTs to `/v1/<domain>/tx` → backend returns a tx intent
   (`{to, amount_nano, op, ...fields}`).
3. Frontend builds a `SendTransactionRequest` using `@ton/core` `beginCell()`
   to encode the op + fields.
4. `tonConnectUI.sendTransaction(req)` opens the user's wallet for approval.
5. On confirmation, the indexer in hopium-api picks up the event and the
   UI refetches via TanStack Query invalidation.

**Never bypass the `/tx` intent endpoint.** The backend is the authority on
amounts (gas, fees, rounding) and opcodes.

## Telegram Login Widget

Because this app runs outside Telegram, Telegram identity is collected via
the [Login Widget](https://core.telegram.org/widgets/login). The widget is
loaded on demand by `src/core/telegram.ts` and calls a global callback that
surfaces the HMAC-signed user blob to `src/lib/auth/hook.ts`. The blob is
forwarded to `/v1/auth/telegram` with `source: 'web'`.

The widget is a fixed iframe — no custom styling. Place it inside a
`<ConnectGate>` or "Connect" dialog; do not spread its invocation across
multiple pages.

## Styling

- Tailwind CSS 3, desktop-first.
- Palette defined in `tailwind.config.ts` (`bg`, `fg`, `accent`, `border`,
  …). Dark-mode default; light mode gated on `.dark` removal from `<html>`.
- Break at `md` (tablet) and `lg` (desktop) — the dashboard assumes a
  minimum of 768 px for the primary layout and reflows below that.
- Icons: `lucide-react`. Pick a single style; don't mix with FontAwesome.

## Folder naming

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for components.
- Folders: `kebab-case` **except** inside `src/page/` and `src/lib/`, where
  the folder name is the bounded context in `lowercase` (matches the
  backend convention): `src/page/mybets/`, `src/lib/market/`.
- Paths use the `@/` alias rooted at `src/`. Never relative paths deeper
  than `../`.

## Checklist

When creating or modifying code, verify:

- [ ] **Layering**: imports flow downward only — `page/X/` never imports from
      `page/Y/`; `lib/` never imports from `page/`; `core/` imports nothing
      from `lib/` or `page/`
- [ ] **Page shape**: `page/{name}/` contains only `page.tsx`, optional
      `type.ts`, and optional page-local components — nothing else
- [ ] **500-LOC limit**: no `.ts` / `.tsx` file exceeds 500 lines
- [ ] **Bounded context**: the page's responsibility is one sentence with no
      "and" / "also"
- [ ] If you reached for `page/X/utils.ts`, **stop** — it goes in `lib/`
- [ ] Types follow `Base / Create / Read / Update` naming
- [ ] Decimal amounts are `string`, not `number`
- [ ] Dates are ISO `string`, not `Date`
- [ ] Mutations call the `/tx` intent endpoint; never bypass with client-side
      opcode construction
- [ ] API calls go through `src/lib/api/client.ts`; no direct `fetch()`
- [ ] Query keys start with the lib name (`['market', ...]`, `['bet', ...]`)
- [ ] Named exports only; no `export default`
- [ ] Tailwind classes only; no inline styles, no CSS modules
- [ ] Tests under `test/{domain}/*.test.ts` mirror the `src/` layout
