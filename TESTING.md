# Testing

**All test code generated or modified by Claude must follow these rules.**

## Stack

- **Vitest** — test runner, Jest-compatible API
- **@testing-library/react** — component render + user-event
- **@testing-library/jest-dom** — DOM matchers (`toBeInTheDocument`, etc.)
- **happy-dom** — DOM implementation (faster than jsdom, sufficient for SPA)
- **msw** — request interception for API-level tests

No Cypress, no Playwright in this repo. End-to-end is handled upstream in
hopium-api (pytest).

## Layout

Tests mirror `src/` under `test/`:

```
src/lib/format/ton.ts            →  test/lib/format/ton.test.ts
src/lib/api/client.ts            →  test/lib/api/client.test.ts
src/page/markets/page.tsx        →  test/page/markets/page.test.tsx
```

**Rule:** if `src/lib/foo/bar.ts` exists, its tests are at
`test/lib/foo/bar.test.ts`. Never co-locate tests with source.

## Environment

Tests boot via `test/setup.ts` (referenced from `vitest.config.ts`):

1. Sets `import.meta.env.VITE_*` values for all required env vars.
2. Imports `@testing-library/jest-dom/vitest` for DOM matchers.
3. Installs msw handlers (`server.listen()` in `beforeAll`,
   `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`).

No test in this repo ever talks to a real hopium-api, a real Telegram, or
a real wallet. All HTTP goes through msw handlers under `test/_mocks/`.
TON Connect is mocked via a manual stub when needed.

## What to test

### Pure functions (`lib/format/`, `lib/_kit/`, `lib/api/error.ts`)

Full coverage expected. These are trivial to test and the highest-leverage
wins — a broken formatter silently corrupts every displayed amount.

### API client (`lib/api/client.ts`)

Wire-format assertions: status codes, error envelope parsing, bearer header
injection, request body shape.

### React components

Only test components that contain branching logic. Presentational leaves
(Button, Card) are covered indirectly by page tests and don't need their
own specs.

Prefer user-visible assertions (text, ARIA role) over implementation
details (internal state, class names).

### Hooks (`lib/{name}/hook.ts`)

Use `renderHook` from `@testing-library/react`. Wrap with TanStack Query
provider via a `TestProviders` helper.

## What NOT to test

- **Tailwind class names.** Test behavior, not utility-class presence.
- **TON Connect internals.** We mock the sender; trust the library.
- **Telegram Login Widget.** Mock the callback, don't drive the iframe.
- **Routing animations.** Static rendering is enough.

## Layering guard test

`test/layering.test.ts` greps the source tree and fails on:

1. `src/core/` importing from `src/lib/` or `src/page/`
2. `src/lib/` importing from `src/page/`
3. One `src/page/{a}/` importing from another `src/page/{b}/`
4. Files at the top of `src/` that aren't in the composition-root
   allow-list (`App.tsx`, `RootLayout.tsx`, `routes.tsx`, `main.tsx`)

Runs as part of `npm test`. Fast — pure filesystem scan.

## Running

```
npm test                  # watch mode
npm run test:run          # single pass, CI-style
npm run test:coverage     # v8 coverage report
```
