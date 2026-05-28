# Quickstart — Fill-in-the-Blank Language Practice Game

**Feature**: 001-fill-blank-game

This document gets a contributor from a fresh clone to a running app exercising the feature.

## Prerequisites

- Node.js ≥ 20 LTS
- `pnpm` ≥ 9
- A modern browser with `Intl.Segmenter` support (Chrome / Edge / Firefox / Safari current)

## First-time setup

```bash
pnpm install

# One-time: install the shadcn primitives this feature needs.
# (Existing: button. To add:)
pnpm dlx shadcn@latest add input textarea card alert label badge toggle-group separator sonner

# Add the offline-after-first-load dev dependency.
pnpm add -D vite-plugin-pwa
```

After those installs:

- Verify `app/components/ui/` now contains `button.tsx` plus `input.tsx`, `textarea.tsx`, `card.tsx`, `alert.tsx`, `label.tsx`, `badge.tsx`, `toggle-group.tsx`, `separator.tsx`, and `sonner.tsx`.
- Verify `vite.config.ts` has `VitePWA({ registerType: 'autoUpdate' })` registered (added during implementation).

## Run the app

```bash
pnpm dev
```

Opens at `http://localhost:5173` by default. Workflow to exercise the feature manually:

1. Land on `/`; you should be redirected to `/play` (no sessions yet).
2. Paste a passage in any language. Example: `La mer est calme et le ciel est bleu.`
3. Pick a difficulty (defaults to Medium).
4. Click "Start round" — you should land on `/play/:sessionId` with the passage rendered and a subset of words replaced by inputs.
5. Fill in some answers (leave at least one blank to verify FR-012 / FR-019).
6. Click "Submit answers" — you should land on `/results/:sessionId`. The score is announced via screen reader; the review list shows each wrong answer next to the correct spelling.
7. Click "Back to sessions"; verify the completed session appears at `/sessions`.
8. Click "Start your first round" / "Start new round"; verify the previous session is still listed.

## Run the checks

```bash
pnpm lint          # ESLint (strict; warnings fail CI)
pnpm typecheck     # React Router typegen + tsc strict
pnpm ci:test       # Vitest unit + component tests, single-run
pnpm e2e           # Playwright (headless by default)
```

Every one of these MUST be green before opening a PR. The constitution treats warnings as failures.

## Test the offline guarantee (FR-032)

In Chrome devtools:

1. `pnpm build && pnpm start` (production build serves a real service worker).
2. Open the app, complete one round so assets are precached.
3. In devtools → Network, toggle "Offline".
4. Refresh the page. The app MUST load. Start a new round. The full round MUST play through and score without any network request.

The Playwright spec `tests/e2e/offline.spec.ts` automates this using `context.setOffline(true)`.

## Inspect persisted state

In devtools → Application → Local Storage → origin → `blanko:v1`. The value is a JSON document conforming to [contracts/storage-schema.md](./contracts/storage-schema.md). Pretty-printing it is the fastest way to debug a misbehaving session.

To reset:

```js
// In devtools console
localStorage.removeItem('blanko:v1');
location.reload();
```

## Layout map for navigating the code

| Concern | Location |
|---|---|
| Routes / page-level orchestration | `app/routes/` |
| Pure game logic (tokenize, select, score) | `app/engine/` |
| `localStorage` persistence | `app/storage/` |
| Shadcn primitives (the entire UI vocabulary) | `app/components/ui/` |
| The single bespoke component | `app/components/passage-view.tsx` |
| Vitest unit tests | `tests/unit/` |
| Vitest component tests | `tests/component/` |
| Playwright e2e | `tests/e2e/` |
| Multi-script fixtures | `tests/e2e/scripts/` |

## When in doubt

- The feature spec is the contract: [`spec.md`](./spec.md).
- The plan and research notes are at [`plan.md`](./plan.md), [`research.md`](./research.md).
- The data shape is at [`data-model.md`](./data-model.md); the public TS surface is at [`contracts/game-engine.md`](./contracts/game-engine.md); the URL surface is at [`contracts/routes.md`](./contracts/routes.md); the persisted JSON shape is at [`contracts/storage-schema.md`](./contracts/storage-schema.md).
- The constitution overrides anything else when they disagree: [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
