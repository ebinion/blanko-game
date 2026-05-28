# Phase 0 Research — Fill-in-the-Blank Language Practice Game

**Feature**: 001-fill-blank-game
**Date**: 2026-05-28

This document resolves every open technical question identified during plan drafting. The feature spec itself carries no remaining `NEEDS CLARIFICATION` markers (all five clarification questions were answered in Session 2026-05-28). The decisions below cover the technology choices and patterns the spec leaves open.

---

## 1. Unicode word segmentation

**Decision**: Use the platform built-in `Intl.Segmenter` with `granularity: "word"`, then post-process its output to merge contractions and hyphenated compounds into single tokens.

**Rationale**:

- FR-021 mandates standard Unicode word-break behavior, contractions like `don't` as one token, hyphenated compounds like `well-known` as one token, and one-character-per-token for CJK.
- `Intl.Segmenter` is the only built-in API that implements Unicode UAX #29 word boundaries; it is shipped in all current evergreen browsers (Chrome 87+, Edge 87+, Firefox 125+, Safari 14.1+). All four are within our target window.
- It returns `{ segment, index, isWordLike }` per segment, which is exactly what we need to render the passage and identify candidates.
- For CJK characters it emits one segment per ideograph by default, satisfying the "one character per token" requirement.
- A small post-pass merges `["don", "'", "t"]` into `don't` and `["well", "-", "known"]` into `well-known` by detecting an apostrophe or hyphen immediately bracketed by `isWordLike` segments. This is ~20 lines of code, far simpler than adopting an ICU library.

**Alternatives considered**:

- **`unicode-segmenter` npm package** — pulls a polyfill we do not need; rejected by Principle IV (Simplicity).
- **Regex-based `\p{L}+` splitting** — fails on apostrophes and hyphens; would need its own merging anyway, and lacks proper CJK handling.
- **`Intl.Segmenter` with `granularity: "grapheme"` then custom word logic** — reinventing UAX #29; rejected.

---

## 2. Accent-sensitive, case-insensitive equality

**Decision**: Compare answers by `a.normalize("NFC").toLocaleLowerCase() === b.normalize("NFC").toLocaleLowerCase()`. Trim outer whitespace before comparison. Do not pass a locale tag to `toLocaleLowerCase()` — use the runtime default for predictable behavior across languages.

**Rationale**:

- FR-019 fixes the rule: case-insensitive, accent-sensitive, uniform across languages.
- Two strings can encode the same accented character differently (e.g., `é` as `U+00E9` vs. `e` + `U+0301`). NFC normalization collapses both to the canonical composed form so a learner who types either is judged on the visible glyph rather than the byte sequence.
- `toLocaleLowerCase()` (no locale arg) gives sensible lowering for the vast majority of scripts the spec lists (Latin, Cyrillic, Greek). Scripts without case (CJK, Arabic) are unaffected.
- FR-019's assumption section explicitly rules out language-specific equivalences (German `ß ↔ ss`, etc.), so a single comparator is correct.

**Alternatives considered**:

- **`Intl.Collator` with `sensitivity: "accent"`** — its "accent" sensitivity is actually accent-sensitive _and_ case-sensitive; flipping to `"variant"` is case-sensitive too. There is no built-in mode that matches our rule exactly. Custom normalization is simpler than fighting the collator's options.
- **Strip diacritics with NFD + filter combining marks** — wrong direction; we need accent sensitivity, not accent stripping.

---

## 3. Blank selection: difficulty mapping, cap, and spread

**Decision**: A pure function `selectBlanks(tokens, difficulty)` returns up to `blankCap[difficulty]` blank positions chosen from word-like tokens, with a difficulty-tuned length bias and a stratified spread across the passage.

Parameters (initial tuning, may be revisited via tests against SC-007):

| Difficulty | Target density     | Length filter                               | Per-round cap |
| ---------- | ------------------ | ------------------------------------------- | ------------- |
| Easy       | 10% of word tokens | length ≤ 5 (Latin chars; for CJK, length 1) | 8             |
| Medium     | 20% of word tokens | length 3 – 8                                | 14            |
| Hard       | 30% of word tokens | length ≥ 6                                  | 20            |

Spread is implemented by partitioning the passage into `N = min(targetCount, eligibleCount)` equal-width buckets by token index and picking one eligible word per bucket (the one closest to the bucket center). This satisfies FR-026 without requiring a randomness source.

**Rationale**:

- FR-004 + FR-005 require monotonically increasing blank count and average word length from Easy → Hard. The table above guarantees both by construction; the unit test `select-blanks.test.ts` asserts the SC-007 contrast (≥2× blanks, ≥2-char length difference) on a fixed paragraph.
- FR-025 fixes a per-round cap; FR-026 fixes the spread. A stratified one-per-bucket selection is the simplest known algorithm that gives both.
- Determinism (no randomness) makes the feature testable and gives the learner a stable experience on retry.

**Alternatives considered**:

- **Random uniform sampling** — would occasionally cluster blanks at one end of the passage, violating FR-026; non-deterministic, hard to test.
- **Pure top-k by length** — clusters blanks wherever long words happen to live; fails FR-026.
- **Information-theoretic "predictability" scoring** — out of scope for v1; the assumption section says "the exact threshold is a tuning detail," and stratified length filtering is the smallest thing that works.

---

## 4. Offline-after-first-load mechanism

**Decision**: Use `vite-plugin-pwa` (Workbox precaching, `registerType: "autoUpdate"`) to precache the built SPA shell and assets. No runtime caching of external resources is needed because no external resources are fetched.

**Rationale**:

- FR-032 requires the app to function after a network drop once assets are loaded. Browser HTTP cache is not reliable enough — it can be evicted by the OS, ignored in private mode, and offers no install prompt.
- `vite-plugin-pwa` is the de-facto Vite plugin for this. It is a single dev-dep, requires no runtime code we author, and emits a service worker plus web manifest from the existing Vite build output.
- React Router v7 SPA mode produces a fully static `dist/` tree, which Workbox precaches without configuration acrobatics.
- An update flow (`autoUpdate`) ensures learners receive new versions silently on next visit, without breaking offline use.

**Alternatives considered**:

- **No service worker, rely on `Cache-Control`** — fragile; an iOS user closing the tab can lose the cache; fails FR-032 in practice.
- **Workbox CLI standalone** — extra build orchestration without benefit over the Vite plugin.
- **Custom service worker** — substantially more code to maintain for no functional gain; violates Principle IV.

Constitution alignment: the dev-dep is justified directly by Principle V (Local-First Data) and FR-032. No Complexity Tracking entry needed — the principle anticipates this need.

---

## 5. Persistence layer: localStorage vs IndexedDB

**Decision**: Plain `localStorage` under a single versioned root key `blanko:v1`. The value is one JSON document containing all sessions, settings, and schema version.

**Rationale**:

- 20-session cap × typical passage size (~3 KB even for a 500-word passage) ≈ ~60 KB. Well below the 5 MB `localStorage` quota present in every browser we target.
- `localStorage` is synchronous, which means route loaders can return data without awaiting promises and components do not need loading states for persistence reads — markedly simpler than IndexedDB.
- A single root key makes save atomic in practice: every mutation writes the whole document. No locking, no cross-key consistency to worry about.
- The constitution's Principle V calls out `localStorage` as the default; IndexedDB is "if needed." We do not need it.

**Alternatives considered**:

- **One `localStorage` key per session** — risks split-brain if a write fails mid-batch; no measurable size benefit; rejected.
- **IndexedDB via Dexie / idb-keyval** — async API, extra dep, no benefit at this scale.
- **`navigator.storage` Persistent Storage prompt** — adds friction; we already tell the learner the data is local-only (FR-017).

---

## 6. Storage-quota and private-mode failure handling

**Decision**: Wrap every `localStorage` access in a `safeStorage` adapter that catches `QuotaExceededError` and `SecurityError` (Safari private mode throws this on write). On failure, the adapter sets an in-memory "session save disabled" flag that the UI reads to display the FR-017 message ("sessions won't be saved") via a shadcn `<Alert variant="destructive">`. The current round continues fully in memory.

**Rationale**:

- FR-017 + the "Local storage full or disabled" edge case both require the round to keep playing while informing the learner.
- A wrapper isolates the try/catch from every call site, keeping the storage module testable (we can inject a failing storage in unit tests).
- Detecting private mode by attempting a probe write at startup is reliable across Safari, Firefox, and Chrome.

**Alternatives considered**:

- **Feature-detect by checking `localStorage !== undefined`** — passes in Safari private mode, then throws on actual write; insufficient.
- **Best-effort, swallow silently** — violates FR-017's transparency requirement.

---

## 7. UI primitive strategy (shadcn-first)

**Decision**: Every on-screen element is a shadcn primitive installed into `app/components/ui/` via `pnpm dlx shadcn@latest add <name>`. The only bespoke component is `PassageView`, because no shadcn primitive renders text tokens with interleaved inputs.

Shadcn components to install for this feature (current state: only `button` exists):

| Component      | Used by                                 | Purpose                                                     |
| -------------- | --------------------------------------- | ----------------------------------------------------------- |
| `textarea`     | Start screen                            | Paste-passage input                                         |
| `input`        | `PassageView`, Sessions search (future) | Inline blank inputs                                         |
| `label`        | Start, Exercise                         | Form labeling for a11y                                      |
| `card`         | Sessions screen, Results score block    | Session rows + score frame                                  |
| `alert`        | Start, Exercise, Sessions               | Errors ("no eligible words", "storage disabled", quota hit) |
| `badge`        | Review list, Sessions                   | Correct/incorrect badges, difficulty pill, status pill      |
| `toggle-group` | Start screen                            | Easy / Medium / Hard difficulty picker                      |
| `separator`    | Results, Sessions                       | Visual separation between blocks                            |
| `sonner`       | Global                                  | Toast for ephemeral notifications (session deleted, etc.)   |

Custom (bespoke) components:

- `PassageView` — renders the array of `Token` objects produced by the engine, swapping word tokens at blank positions with a shadcn `<Input>`. This is the only place we author non-shadcn JSX of substance; every leaf inside it (the input itself) is still a shadcn primitive.

Feature compositions (difficulty picker layout, review list, score display, session card layout, empty-state banners) live inline in their route files using shadcn primitives + Tailwind utilities. They are not promoted to standalone components unless they are reused across 2+ routes or exceed ~80 lines (Principle III).

**Rationale**:

- Constitution Principle III names shadcn/`@base-ui/react` as the primitive layer; user feedback during planning explicitly asked for shadcn-first.
- Shadcn primitives ship with accessible defaults (focus rings, `aria-*`, keyboard handlers from `@base-ui/react` under the hood) that we would otherwise have to reimplement and re-test, satisfying FR-027 – FR-029 with much less code.
- Keeping compositions inline in routes (instead of pre-building "ScoreCard", "DifficultyPicker", etc.) defers abstraction until reuse is real, per Principle IV.

**Alternatives considered**:

- **Build a `Blanko` component library wrapping every shadcn primitive** — premature abstraction; rejected by Principle IV.
- **Use `@base-ui/react` directly without shadcn** — possible but loses the styled, theme-integrated defaults shadcn provides; the project already opted into shadcn via `components.json` and the existing `button.tsx`.

---

## 8. WCAG 2.1 AA implementation pattern

**Decision**:

- Use semantic HTML landmarks: `<main>`, `<nav>`, `<section aria-labelledby=...>`. The shell in `app/root.tsx` adds a single `<main>` per route.
- Every blank uses a shadcn `<Input>` with an `aria-label` like "blank 3 of 14: word after 'in the'" derived from surrounding context tokens, so screen-reader users hear which blank they are on without visual reference. Shadcn `<Input>` already forwards refs and supports `aria-*` props.
- Focus order is the DOM order, which already matches reading order because `<PassageView>` renders tokens in passage order with blanks inline.
- The score on the results screen is wrapped in `<div role="status" aria-live="polite">` (a shadcn `<Card>` with the role attribute set) so it is announced on mount. The review list is a semantic `<ul>` with each item structured as "your answer X, correct answer Y" using shadcn `<Badge>` for the correct/incorrect indicator.
- Correct/incorrect state in the review list is conveyed by both text ("Incorrect") and a non-color icon (lucide `XCircle` / `CheckCircle`) inside a shadcn `<Badge>`, satisfying the non-color-cue clause of FR-027.
- Color tokens come from Tailwind v4's existing palette (already wired by shadcn's `components.json`), with a deliberate contrast pass against the shadcn defaults. Axe-core under Playwright (`@axe-core/playwright`) runs against each screen as part of the e2e accessibility test.

**Rationale**: WCAG 2.1 AA at this scope is mostly a discipline of semantic HTML + tested keyboard order + announced state. Shadcn primitives already supply the keyboard behavior and ARIA wiring we would otherwise have to write ourselves; combining them with semantic landmarks and live regions satisfies the spec.

**Alternatives considered**:

- **`react-aria` / `react-aria-components`** — useful library, but shadcn (built on `@base-ui/react`) already covers the same primitive set with accessibility built in. Adding another primitive lib doubles the surface area.
- **Only automated axe checks** — insufficient; the spec demands a manual screen-reader pass (SC-009).

---

## 9. Routing model

**Decision**: Four screens map to four routes in React Router v7 SPA mode:

- `/` → redirects to `/play` if no in-progress session exists, else to `/play/:sessionId` (most recent in-progress).
- `/play` → Start screen.
- `/play/:sessionId` → Exercise screen for an in-progress session.
- `/results/:sessionId` → Results screen for a completed session.
- `/sessions` → Saved-session list.

Each route's `clientLoader` reads the relevant slice of `localStorage` synchronously and returns it. `clientAction` handles writes (create session, submit answers, delete session) and then `redirect`s.

**Rationale**: Stable URLs let the browser back/forward buttons work intuitively (e.g., from a results page back to the session list). Route-level loaders concentrate storage reads in one well-tested place rather than scattering them across components.

**Alternatives considered**:

- **Single route + internal state machine** — loses the URL contract for back-button navigation and deep links to a specific session; complicates persistence on reload (FR-015 resume).
- **Hash routing** — unnecessary given SPA mode handles client-side routing cleanly.

---

## 10. Difficulty persistence across rounds

**Decision**: Store the last-used difficulty in the same `blanko:v1` document under a `settings.lastDifficulty` field. The start screen reads it as the default value of the shadcn `<ToggleGroup>` difficulty picker.

**Rationale**: FR-002 + Story 2 acceptance scenario 1 require the chosen difficulty to be remembered as the next round's default. This is one field on one already-persisted document — no separate setting store needed.

---

## 11. Test fixtures for multi-script coverage

**Decision**: Add three fixture passages under `tests/e2e/scripts/`:

- `latin-fr.txt` — French paragraph with accented characters (école, café, façon), used by `a11y-keyboard.spec.ts` and `core-round.spec.ts`.
- `cyrillic-ru.txt` — Russian paragraph (Cyrillic), used by `core-round.spec.ts`.
- `cjk-zh.txt` — Chinese paragraph (one-char-per-token coverage), used by `core-round.spec.ts`.

Unit tests in `tests/unit/engine/tokenize.test.ts` add inline fixtures for contractions (`don't`), hyphenated compounds (`well-known`), and mixed scripts in one passage.

**Rationale**: SC-006 explicitly requires verification across the listed scripts. Three fixtures plus the inline unit-test cases cover the spec's coverage matrix without expensive setup.

---

## Summary of open questions

None remaining. All decisions above are local to this feature and reversible if implementation surfaces a constraint we missed.
