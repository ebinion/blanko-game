# Implementation Plan: Fill-in-the-Blank Language Practice Game

**Branch**: `001-fill-blank-game` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fill-blank-game/spec.md`

## Summary

Deliver a fully-offline, browser-only fill-in-the-blank language practice game. The learner pastes a passage in any language, picks Easy/Medium/Hard, and is presented with the passage with a bounded set of words turned into input blanks (biased toward longer words at higher difficulty, positions spread across the passage). On submit, the system scores answers case-insensitively but accent-sensitively, then shows a score plus a review list pairing each wrong answer with its correct spelling. Sessions (in-progress and completed) persist in `localStorage` with an auto-label, a 20-session cap that evicts the oldest completed entry, and screens that meet WCAG 2.1 AA with full keyboard navigation and screen-reader-readable results. After first load no data leaves the device, and a service worker keeps the app usable offline.

The implementation is a single React Router v7 SPA. A pure TypeScript "game engine" module owns Unicode-aware tokenization (via `Intl.Segmenter`), blank selection, scoring, and difficulty math, with no React or DOM coupling so it can be unit-tested directly under Vitest. **UI is built shadcn-first**: every screen composes shadcn primitives (`Button`, `Input`, `Textarea`, `Card`, `Alert`, `Label`, `Badge`, `ToggleGroup`, `Separator`, `Sonner`) — installed via `pnpm dlx shadcn@latest add <name>` into `app/components/ui/` — and only one genuinely custom component (`PassageView`, which interleaves inputs with text tokens) is introduced because no shadcn primitive covers that interleaving pattern. A storage module abstracts `localStorage` access behind a versioned schema. Playwright covers the end-to-end keyboard-only round flow including a Cyrillic and a CJK passage to satisfy SC-006 and the accessibility acceptance.

## Technical Context

**Language/Version**: TypeScript 5.9 in `strict` mode, React 19.2, ES2022 target.

**Primary Dependencies**: React Router v7.15 (SPA mode), `@base-ui/react`, shadcn-generated components, Tailwind CSS v4 (via `@tailwindcss/vite`), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`. Browser built-ins: `Intl.Segmenter` (tokenization), `String.prototype.normalize` (NFC for comparison), `localStorage`, Service Worker API.

**New runtime dependency**: `vite-plugin-pwa` (with Workbox) for the offline-after-first-load requirement (FR-032). Justified in [research.md](./research.md); no Complexity Tracking entry required because the constitution's "Local-First Data" principle (V) explicitly calls out offline as a first-class requirement and `vite-plugin-pwa` is the smallest viable mechanism (single dev-dep, zero runtime code we author).

**Storage**: Browser `localStorage` only. Versioned JSON schema under a single root key `blanko:v1`. No IndexedDB, no server.

**Testing**: Vitest (unit + component) for the game engine, storage adapter, and React components; `@testing-library/react` and `@testing-library/user-event` for component tests; Playwright for end-to-end keyboard-only round flows and offline reload.

**Target Platform**: Modern evergreen browsers (Chrome/Edge/Firefox/Safari current minus two) on desktop and mobile. `Intl.Segmenter` is supported in all targets as of 2024.

**Project Type**: Single-project web SPA. No backend.

**Performance Goals**: Generate and render a fresh exercise for a 500-word passage in under 2 seconds on a mid-range laptop/phone (SC-003). Token segmentation and blank selection are O(n) over passage length; we expect well below 50 ms for 500 words.

**Constraints**:

- Fully offline after first load: no `fetch` / `XHR` / `WebSocket` / `sendBeacon` / `navigator.sendBeacon` / image-pixel calls to any host post-boot (FR-030, FR-031, FR-032).
- WCAG 2.1 AA across all four screens, including focus order matching reading order of the passage and live-region announcement of the score (FR-027 – FR-029).
- Case-insensitive, accent-sensitive equality after NFC normalization (FR-019).
- Hard cap of 20 saved sessions with oldest-completed eviction (FR-024).
- Per-round blank cap with positions spread across the passage (FR-025, FR-026).

**Scale/Scope**: Four screens (Start, Exercise, Results, Sessions). Up to 20 saved sessions per browser. Passages up to ~500 words target; tested up to ~2 000 words. Five P1–P3 user stories, 32 functional requirements, 9 success criteria.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-evaluated after Phase 1 design._

Evaluated against `.specify/memory/constitution.md` v1.0.0.

| #   | Principle                   | Evaluation                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Verdict |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I   | Test-First (NON-NEGOTIABLE) | Every task in the upcoming tasks.md will be written as "(a) failing test → (b) implementation → (c) refactor". Engine logic (segmentation, blank selection, scoring) and storage are pure modules — trivially unit-testable. UI flows covered by Playwright keyboard-only specs.                                                                                                                                                                                          | PASS    |
| II  | Type Safety End-to-End      | Project already has `strict: true` and ESLint with `jsx-a11y` and `react-hooks`. New code will define explicit types for `Session`, `Blank`, `Token`, `Result`, `DifficultyConfig`. No `any`; `unknown` + narrowing for `JSON.parse`. React Router typegen runs in `typecheck`.                                                                                                                                                                                           | PASS    |
| III | Component-Driven UI         | **Shadcn-first**: every screen is composed from shadcn primitives installed into `app/components/ui/` (`Button`, `Input`, `Textarea`, `Card`, `Alert`, `Label`, `Badge`, `ToggleGroup`, `Separator`, `Sonner`). The only bespoke component is `PassageView` (interleaves inputs with text tokens — no shadcn primitive covers that). All other "feature components" are thin compositions of shadcn primitives, not new primitives. Variants via `cva`. No inline styles. | PASS    |
| IV  | Simplicity & YAGNI          | No state-management library (route loaders/actions + local component state suffice). No backend. One new dev-dep (`vite-plugin-pwa`) directly mapped to FR-032; alternative ("rely on HTTP cache") rejected in research as unreliable across browsers. No premature abstractions over `localStorage`.                                                                                                                                                                     | PASS    |
| V   | Local-First Data            | All session data persists in `localStorage` under one versioned root key. App boots and plays a full round with the network disconnected after first load (verified by a Playwright offline test). No server round-trip exists.                                                                                                                                                                                                                                           | PASS    |

**Result**: No violations. Complexity Tracking table is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-fill-blank-game/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── storage-schema.md   # localStorage shape + versioning
│   ├── game-engine.md      # Public TS signatures for the pure engine module
│   └── routes.md           # URL map and per-route UI contract
└── tasks.md             # Phase 2 output (created by /speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── routes.ts                       # Route table
├── root.tsx                        # Shell, error boundary, a11y landmarks
├── app.css                         # Tailwind entry
├── routes/
│   ├── home.tsx                    # "/" — redirects to /play or /sessions
│   ├── play.tsx                    # "/play" — Start screen (paste text + pick difficulty)
│   ├── play.$sessionId.tsx         # "/play/:sessionId" — Exercise screen
│   ├── results.$sessionId.tsx      # "/results/:sessionId" — Results screen
│   └── sessions.tsx                # "/sessions" — Saved-session list
├── components/
│   ├── ui/                         # shadcn primitives — install via `pnpm dlx shadcn@latest add`
│   │                               #   existing: button
│   │                               #   to add:   input, textarea, card, alert, label,
│   │                               #             badge, toggle-group, separator, sonner
│   └── passage-view.tsx            # ONLY bespoke component: renders tokens and
│                                   # interleaves shadcn <Input> elements for each blank.
│                                   # No shadcn primitive covers token-interleaved inputs.
│                                   #
│                                   # The other "feature views" (difficulty picker, score
│                                   # display, review list, session list rows, empty/error
│                                   # states) live INLINE in their route files as thin
│                                   # compositions of shadcn primitives — they are not new
│                                   # components. If any composition is reused across 2+
│                                   # routes or exceeds ~80 lines (Principle III), promote
│                                   # it to a file here at that point, not before.
├── engine/                         # Pure, framework-free game engine
│   ├── tokenize.ts                 # Intl.Segmenter wrapper, contraction & hyphen handling
│   ├── select-blanks.ts            # Difficulty-aware selection, spread positions, caps
│   ├── score.ts                    # Case-insensitive / accent-sensitive equality
│   ├── difficulty.ts               # Difficulty -> { density, lengthBias, blankCap }
│   ├── label.ts                    # Auto-label from passage + date
│   └── types.ts                    # Token, Blank, Session, Result, Difficulty
├── storage/                        # Persistence boundary
│   ├── session-store.ts            # CRUD over localStorage, cap + eviction
│   ├── schema.ts                   # Versioned JSON schema + migrations slot
│   └── safe-storage.ts             # Guards quota / private-mode errors
└── lib/
    └── utils.ts                    # Existing cn() helper

tests/
├── unit/                           # Vitest
│   ├── engine/
│   │   ├── tokenize.test.ts
│   │   ├── select-blanks.test.ts
│   │   ├── score.test.ts
│   │   ├── difficulty.test.ts
│   │   └── label.test.ts
│   └── storage/
│       ├── session-store.test.ts
│       └── safe-storage.test.ts
├── component/                      # Vitest + @testing-library/react
│   └── passage-view.test.tsx       # Only bespoke component → only one component test;
│                                   # the rest of the UI is shadcn primitives (already
│                                   # tested upstream) wired up in routes — verified by
│                                   # e2e specs below, not by per-route component tests.
└── e2e/                            # Playwright (replaces tests/example.spec.ts)
    ├── core-round.spec.ts          # P1: paste -> play -> score
    ├── difficulty.spec.ts          # P1: Easy vs Hard contrast (SC-007)
    ├── review.spec.ts              # P2: review list semantics
    ├── persistence.spec.ts         # P2: resume + sessions list
    ├── restart.spec.ts             # P3: start fresh round
    ├── offline.spec.ts             # FR-032: round plays with network blocked
    ├── a11y-keyboard.spec.ts       # FR-028: keyboard-only completion
    └── scripts/                    # CJK / Cyrillic / accented fixtures

public/
└── pwa-icons/                      # Manifest icons for installability

vite.config.ts                      # Add vite-plugin-pwa registration
```

**Structure Decision**: Single-project SPA layout, matching the existing repo. The engine (`app/engine/`) and storage (`app/storage/`) modules are deliberately framework-free so they can be unit-tested without rendering. Route files act as thin orchestrators that call the engine, persist to storage, and render shadcn primitives directly. The only custom component is `PassageView` — every other on-screen element is a shadcn primitive (`Button`, `Input`, `Textarea`, `Card`, `Alert`, `Label`, `Badge`, `ToggleGroup`, `Separator`, `Sonner`), installed via the shadcn CLI into `app/components/ui/` and used in routes without bespoke wrappers. New tests sit alongside the existing `tests/` directory in `unit/`, `component/`, and `e2e/` subfolders.

## Constitution Re-check (post Phase 1)

After producing `research.md`, `data-model.md`, `contracts/*`, and `quickstart.md`, the design still satisfies every principle:

| #   | Principle                   | Post-design evidence                                                                                                                                                                                                  | Verdict |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I   | Test-First (NON-NEGOTIABLE) | `contracts/game-engine.md` enumerates the per-function test obligations; the project tree carves out `tests/unit/`, `tests/component/`, and `tests/e2e/` matching those obligations.                                  | PASS    |
| II  | Type Safety End-to-End      | `data-model.md` defines explicit interfaces for every entity; `app/engine/types.ts` is named as the single source of truth; no `any` introduced.                                                                      | PASS    |
| III | Component-Driven UI         | The route contracts in `contracts/routes.md` describe each screen as a composition of named shadcn primitives plus the single bespoke `PassageView`. No new primitives invented.                                      | PASS    |
| IV  | Simplicity & YAGNI          | One dev-dep added (`vite-plugin-pwa`) and justified by Principle V + FR-032. No state library, no backend, no ORM, no parallel type defs. Feature compositions live inline until promotion is warranted.              | PASS    |
| V   | Local-First Data            | `contracts/storage-schema.md` defines one versioned `localStorage` key; `quickstart.md` documents the offline verification step; service worker precaches the shell so the round flow works with the network blocked. | PASS    |

**Result**: No new violations introduced by design. Complexity Tracking table remains empty.

## Complexity Tracking

_No violations to track — the Constitution Check passed all five gates both before and after design._
