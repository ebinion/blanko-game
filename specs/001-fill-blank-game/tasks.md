---
description: 'Task list for the Fill-in-the-Blank Language Practice Game feature'
---

# Tasks: Fill-in-the-Blank Language Practice Game

**Input**: Design documents from `/specs/001-fill-blank-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/storage-schema.md, contracts/game-engine.md, contracts/routes.md, quickstart.md

**Tests**: Required by the project constitution (Principle I — Test-First, NON-NEGOTIABLE). Every implementation task is preceded by a failing-test task that exercises the contract or acceptance criterion the implementation must satisfy.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

Single-project SPA (per plan.md `Structure Decision`):

- App code lives under `app/`
- Tests live under `tests/{unit,component,e2e}/`
- Specs/contracts live under `specs/001-fill-blank-game/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, install shadcn primitives the whole feature will consume, and create the directory skeleton.

- [x] T001 Install shadcn primitives the feature requires by running `pnpm dlx shadcn@latest add input textarea card alert label badge toggle-group separator sonner` so that `app/components/ui/` ends up containing `input.tsx`, `textarea.tsx`, `card.tsx`, `alert.tsx`, `label.tsx`, `badge.tsx`, `toggle-group.tsx`, `separator.tsx`, and `sonner.tsx` alongside the existing `button.tsx`.
- [x] T002 [P] Add the PWA dev dependency and component-test deps: `pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator @axe-core/playwright @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`. Verify the additions in `package.json`.
- [x] T003 [P] Configure `vite.config.ts` at the repository root to register `VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.ico'], manifest: { name: 'Blanko', short_name: 'Blanko', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#ffffff', icons: [{ src: '/pwa-icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/pwa-icons/icon-512.png', sizes: '512x512', type: 'image/png' }] } })` and ensure the existing React Router plugin is preserved.
- [x] T004 [P] Add Vitest jsdom configuration to `vite.config.ts` (or a new `vitest.config.ts` if Vitest needs a separate config) so component tests run under the `jsdom` environment with `@testing-library/jest-dom` matchers; create `tests/setup.ts` that imports `@testing-library/jest-dom`.
- [x] T005 [P] Add placeholder 192×192 and 512×512 icons at `public/pwa-icons/icon-192.png` and `public/pwa-icons/icon-512.png` so the PWA manifest validates (a solid-color PNG is acceptable for v1).
- [x] T006 [P] Create empty source directories with `.gitkeep` files: `app/engine/`, `app/storage/`, `tests/unit/engine/`, `tests/unit/storage/`, `tests/component/`, `tests/e2e/scripts/`.
- [x] T007 [P] Remove the React Router starter content: delete `app/welcome/` (logo SVGs and `welcome.tsx`) and replace the body of `app/routes/home.tsx` with a stub component that will be filled in during Phase 2 (or T039); this prevents the starter UI from confusing manual testing.
- [x] T008 [P] Add four multi-script e2e fixtures so SC-006 ("Latin with diacritics, Cyrillic, Greek, CJK, Arabic, etc.") is verifiable: `tests/e2e/scripts/latin-fr.txt` (French paragraph with `école`, `café`, `façon`), `tests/e2e/scripts/cyrillic-ru.txt` (Russian paragraph), `tests/e2e/scripts/cjk-zh.txt` (Chinese paragraph), and `tests/e2e/scripts/arabic-ar.txt` (Arabic paragraph, RTL). Each ≥ 60 words / characters so blank selection has room.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, the storage layer, the app shell, and the engine functions every user story depends on. Per the constitution, every engine and storage function is written test-first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Types

- [x] T009 Define every entity from data-model.md as a TypeScript interface in `app/engine/types.ts`: `Difficulty`, `Token`, `Blank`, `Session`, `Result`, `IncorrectEntry`, `Settings`, `Store`. Export each. No `any`; mark `result` optional on `Session`. This file is the single source of truth referenced by `contracts/game-engine.md`.

### Storage layer (test-first)

- [x] T010 [P] Write failing Vitest unit tests in `tests/unit/storage/safe-storage.test.ts` covering: (a) read returns parsed JSON when valid; (b) read returns `EMPTY_STORE` when the key is missing; (c) read returns `EMPTY_STORE` when JSON.parse throws; (d) write succeeds and round-trips; (e) write throwing `QuotaExceededError` sets `saveDisabled = true` and does not re-throw; (f) write throwing `SecurityError` (Safari private mode) sets `saveDisabled = true`.
- [x] T011 Implement `app/storage/safe-storage.ts` exporting `readStore(): Store`, `writeStore(store: Store): void`, and `isSaveDisabled(): boolean` per the contract in `contracts/storage-schema.md` §Read/write rules. Wrap every `localStorage` access in try/catch. Use the storage key `blanko:v1`.
- [x] T012 [P] Write failing Vitest unit tests in `tests/unit/storage/schema.test.ts` covering: (a) `EMPTY_STORE` matches `{ schemaVersion: 1, settings: { lastDifficulty: 'medium' }, sessions: [] }`; (b) `validateStore` accepts a well-formed store; (c) `validateStore` rejects a store with `schemaVersion !== 1`; (d) `validateStore` rejects a store with duplicate session ids.
- [x] T013 Implement `app/storage/schema.ts` exporting `EMPTY_STORE: Store` and `validateStore(unknown): Store` (throws on invalid input). This is the only module that knows the wire format; all other modules go through it.
- [x] T014 [P] Write failing Vitest unit tests in `tests/unit/storage/session-store.test.ts` covering: (a) `create` appends a new session, updates `settings.lastDifficulty`, and persists; (b) `get(id)` returns the session or `undefined`; (c) `list()` returns sessions sorted by `createdAt` descending; (d) `update(id, patch)` merges and persists; (e) `delete(id)` removes the session; (f) `create` evicts the oldest completed session when the cap is hit (FR-024); (g) `create` throws `CapReachedError` when the cap is hit and no completed session exists.
- [x] T015 Implement `app/storage/session-store.ts` exporting `create`, `get`, `list`, `update`, `delete`, and `CapReachedError`. Uses `safe-storage.ts` for reads/writes and `schema.ts` for the empty store. Implements FR-024 cap eviction.

### Engine: tokenization & labels (test-first)

- [x] T016 [P] Write failing Vitest unit tests in `tests/unit/engine/tokenize.test.ts` covering: (a) ASCII passage tokenizes with words and spaces; (b) `tokens.map(t=>t.text).join('') === passage`; (c) `don't` is one `isWord: true` token; (d) `well-known` is one `isWord: true` token; (e) Chinese sample yields one token per ideograph each `isWord: true`; (f) French passage with `école` preserves the accented characters in the token text; (g) empty string returns `[]`; (h) tokens are sorted by `start`.
- [x] T017 Implement `app/engine/tokenize.ts` exporting `tokenize(passage: string): Token[]` using `Intl.Segmenter` with `granularity: 'word'` plus the contraction/hyphen merge post-pass described in research.md §1.
- [x] T018 [P] Write failing Vitest unit tests in `tests/unit/engine/label.test.ts` covering: (a) label is `"<first 4 words> · <YYYY-MM-DD>"` for a normal passage; (b) label is truncated to ≤ 80 chars; (c) entirely non-word passage yields `"(untitled) · <YYYY-MM-DD>"`.
- [x] T019 Implement `app/engine/label.ts` exporting `labelSession(passage: string, createdAt: Date): string` per `contracts/game-engine.md`.

### App shell

- [x] T020 Update `app/root.tsx` so the document body renders a `<main>` landmark wrapping the route outlet, with a skip-to-content link as the first focusable element. Keep existing `<html lang>` and font loading. The shell renders the shadcn `<Toaster />` (from `app/components/ui/sonner.tsx`) once at the top level so any route can call `toast(...)`.
- [x] T021 [P] Update `app/routes.ts` to register the five routes per `contracts/routes.md`: `/` → `routes/home.tsx`, `/play` → `routes/play.tsx`, `/play/:sessionId` → `routes/play.$sessionId.tsx`, `/results/:sessionId` → `routes/results.$sessionId.tsx`, `/sessions` → `routes/sessions.tsx`. Files can be empty stubs at this point.

**Checkpoint**: Foundation ready — engine tokenization, storage CRUD, types, shell, and routes table all exist and tests pass.

---

## Phase 3: User Story 1 — Practice spelling and recall using my own text (Priority: P1) 🎯 MVP

**Goal**: Deliver the entire core loop: paste a passage, generate blanks (at hardcoded Medium difficulty for this story), play the round, submit, see a score and review list. Multi-script support included so SC-006 passes for the MVP.

**Independent Test**: Open the app at `/play`, paste a passage (French, Russian, or Chinese), click "Start round", fill in some inputs (deliberately get at least one wrong), click "Submit answers", and observe a score + review list of incorrect entries on `/results/:sessionId`.

### Tests for User Story 1 ⚠️ (write first, must fail before T030+)

- [x] T022 [P] [US1] Write failing Vitest unit tests in `tests/unit/engine/difficulty.test.ts` for `difficultyConfig`: returns distinct configs for `easy` / `medium` / `hard`; `blankCap` is 8/14/20; `density` is 0.10/0.20/0.30; Hard's `density` and `blankCap` strictly exceed Easy's (FR-004 monotonicity precondition).
- [x] T023 [P] [US1] Write failing Vitest unit tests in `tests/unit/engine/select-blanks.test.ts` covering: (a) returns `≤ blankCap[difficulty]` blanks; (b) every returned `tokenIndex` points at a token with `isWord: true`; (c) sorted by `tokenIndex` ascending, unique indexes; (d) deterministic across two calls with the same inputs; (e) returns `[]` when no eligible words exist (FR-013 precondition); (f) on a fixed paragraph, Hard produces ≥ 2× Easy's count AND average blanked-word length is ≥ 2 characters higher (SC-007); (g) positions are spread across passage thirds — at least one blank in each third when count ≥ 3 (FR-026).
- [x] T024 [P] [US1] Write failing Vitest unit tests in `tests/unit/engine/score.test.ts` covering every acceptance criterion of US1+US3 scoring: (a) all-correct → `correct === total`, `incorrect === []`; (b) all-wrong → `correct === 0`, every blank appears in `incorrect`; (c) `paris` matches `Paris` (FR-019 case-insensitive, Story 3 AC4); (d) `ecole` does NOT match `école` (FR-019 accent-sensitive, Story 3 AC5); (e) empty string answer counted as incorrect (FR-012, Story 3 AC3); (f) whitespace-only answer counted as incorrect; (g) `é` typed as `e + U+0301` matches `é` as `U+00E9` (NFC normalization).
- [x] T025 [P] [US1] Write a failing Vitest component test in `tests/component/passage-view.test.tsx` (using `@testing-library/react`) covering: (a) renders every token of `session.tokens` in order, including whitespace; (b) renders a shadcn `<Input>` at each `Blank.tokenIndex` and a text span everywhere else; (c) each `<Input>` has an `aria-label` that includes `"blank N of M"` (FR-029 precondition); (d) typing into a blank fires the `onChange` callback with `(blankId, value)`; (e) initial `value` for each input comes from `session.answers[blankId]` when present.
- [x] T026 [P] [US1] Write a failing Playwright e2e spec in `tests/e2e/core-round.spec.ts` (replacing the boilerplate `tests/example.spec.ts`) that: (a) loads `/play`, pastes the contents of `tests/e2e/scripts/latin-fr.txt`, clicks "Start round"; (b) on `/play/:id` types correct answers into all blanks except one, where it types a wrong answer; (c) clicks "Submit answers"; (d) lands on `/results/:id`; (e) sees a score reading `"<correct> of <total> correct"`; (f) sees the wrong answer paired with its correct spelling in the review list.
- [x] T027 [P] [US1] Add additional Playwright e2e spec scenarios inside `tests/e2e/core-round.spec.ts` that repeat step (a)–(f) with `tests/e2e/scripts/cyrillic-ru.txt`, with `tests/e2e/scripts/cjk-zh.txt`, and with `tests/e2e/scripts/arabic-ar.txt` (RTL), satisfying SC-006 for the MVP. The Arabic scenario also asserts no horizontal scroll on the exercise page at the default viewport (a basic RTL layout sanity check).
- [x] T027a [P] [US1] Write a failing Playwright e2e spec in `tests/e2e/no-eligible-words.spec.ts` covering FR-013 + US1 acceptance scenario 4: paste a passage that yields zero blanks at Hard (e.g., a short sentence of only 2-letter words like `"a is at it on or up"`), choose Hard, click "Start round", and assert (a) a shadcn `<Alert>` appears with text explaining why the text can't be used and (b) the pasted text is still present in the `<Textarea>` unchanged. (Note: the "Try Easy" affordance this alert exposes is verified later in T040's US2 wave; this test just locks in the error-without-data-loss behavior so US1 alone satisfies its acceptance scenario 4.)

### Implementation for User Story 1

- [x] T028 [P] [US1] Implement `app/engine/difficulty.ts` exporting `difficultyConfig(d: Difficulty): DifficultyConfig` per the table in research.md §3, satisfying T022.
- [x] T029 [P] [US1] Implement `app/engine/select-blanks.ts` exporting `selectBlanks(tokens, difficulty, options?): Blank[]` using the stratified-one-per-bucket algorithm from research.md §3, satisfying T023. `Blank.id` is generated as `${options?.sessionId ?? 'preview'}-${tokenIndex}` for stability.
- [x] T030 [P] [US1] Implement `app/engine/score.ts` exporting `scoreSession(session: Session): Result` using the NFC + `toLocaleLowerCase()` comparator from research.md §2, satisfying T024.
- [x] T031 [US1] Implement `app/components/passage-view.tsx` — the single bespoke component. Walks `session.tokens`, renders a text span for non-blanked tokens, and for each blank renders a shadcn `<Input>` sized to fit inline (Tailwind `inline-block w-auto min-w-[6ch]`) with an `aria-label` like `"Blank N of M: word after '<prev word>'"`. Accepts an `onAnswerChange(blankId, value)` prop. Satisfies T025.
- [x] T032 [US1] Implement `app/routes/play.tsx` (Start screen): `clientLoader` returns `{ lastDifficulty: store.settings.lastDifficulty, saveDisabled: isSaveDisabled() }`; the page renders a shadcn `<Textarea>` (with `<Label>`), a `<Button type="submit">` "Start round", and (US1 scope) reads `lastDifficulty` from the loader but does NOT render a picker yet — that comes in US2. The `clientAction` calls `tokenize` → `selectBlanks(_, lastDifficulty, { sessionId })` → `sessionStore.create(...)` → `redirect('/play/' + id)`. On `selectBlanks` returning `[]`, returns `{ error: 'no_eligible_words' }` and the page renders a shadcn `<Alert>`.
- [x] T033 [US1] Implement `app/routes/play.$sessionId.tsx` (Exercise screen): `clientLoader` reads the session via `sessionStore.get`; if missing or already `completed`, redirect appropriately per `contracts/routes.md`. Render `<PassageView session={session} onAnswerChange={...} />` and a `<Button>` "Submit answers" inside a `<Form method="post">`. The `clientAction` supports two intents: `save_answer` (writes `answers[blankId]`) and `submit` (calls `scoreSession`, sets `status = 'completed'` + `result`, persists, redirects to `/results/:id`).
- [x] T034 [US1] Implement `app/routes/results.$sessionId.tsx` (Results screen) for the MVP: render a shadcn `<Card role="status" aria-live="polite">` showing `"<correct> of <total> correct"`, and a `<ul>` listing each `IncorrectEntry` with `userAnswer` and `correctWord` as plain text rows. (Polish — Badges, icons, perfect-score state — comes in US3.) Add `<Button>` "Start new round" → `/play`.
- [x] T035 [US1] Wire `app/routes/home.tsx` to a `clientLoader` that returns `redirect('/play')` if there is no in-progress session, otherwise `redirect('/play/' + mostRecentInProgress.id)`. This is the minimum behavior US1 needs; T050 in US4 expands the loader to use the real `sessionStore.list()` query once the persistence story lands.

**Checkpoint**: User Story 1 fully functional. T026 + T027 (the multi-script e2e) pass. MVP shippable.

---

## Phase 4: User Story 2 — Choose a difficulty level before each round (Priority: P1)

**Goal**: Surface the Easy / Medium / Hard picker on the start screen, persist the last choice, and verify the difficulty actually changes the resulting round in user-visible ways (more blanks, longer words at Hard).

**Independent Test**: Paste the same passage twice — once at Easy, once at Hard — and confirm Hard produces strictly more blanks AND the average blanked-word length is noticeably greater than at Easy.

### Tests for User Story 2 ⚠️

- [x] T036 [P] [US2] Write a failing Playwright e2e spec in `tests/e2e/difficulty.spec.ts` that pastes the French fixture, runs the round at Easy, records the count of `<input>` elements + their `aria-label` token lengths (parsed from the label), then repeats at Hard and asserts Hard's count ≥ 2× Easy's count AND average blanked-word length at Hard is ≥ 2 characters greater (SC-007 acceptance live).
- [x] T037 [P] [US2] Extend `tests/component/passage-view.test.tsx` (or add `tests/component/difficulty-picker.test.tsx`) with a failing assertion that the start route renders a `role="group"` element with three child `<button role="radio">` items labelled "Easy", "Medium", "Hard", and that clicking one sets it as the visually-selected option.
- [x] T038 [P] [US2] Write a failing Vitest unit test in `tests/unit/storage/session-store.test.ts` (extension) asserting that `create` updates `settings.lastDifficulty` to the difficulty of the new session (FR-002 carry-over).

### Implementation for User Story 2

- [x] T039 [US2] Extend `app/routes/play.tsx` to render a shadcn `<ToggleGroup type="single" value={difficulty} defaultValue={lastDifficulty}>` containing three `<ToggleGroupItem>`s (Easy / Medium / Hard) with a visible `<Label>` "Difficulty". The selected value is posted alongside the passage in the form. The `clientAction` now reads the posted `difficulty` instead of `lastDifficulty` and passes it to `selectBlanks`.
- [x] T040 [US2] Extend `app/routes/play.tsx`'s error rendering so the `no_eligible_words` shadcn `<Alert>` includes a "Try Easy instead" affordance (a `<Button>` that re-submits the form with `difficulty=easy`) per Story 2 acceptance scenario 4 and FR-013.

**Checkpoint**: Difficulty picker visible and persisted; SC-007 contrast verified live. US1 + US2 deliver the full P1 scope.

---

## Phase 5: User Story 3 — Review my mistakes after the round (Priority: P2)

**Goal**: Promote the bare-bones results screen from US1 to a fully presentable, accessible review experience with proper shadcn primitives, non-color cues, perfect-score handling, and a screen-reader-readable announcement.

**Independent Test**: Complete a round with one or more wrong answers; on the results screen each incorrect blank shows the typed answer next to the correct spelling, marked "Incorrect" via both a text badge and a non-color icon. Complete a perfect-score round and observe the results screen says nothing needs review.

### Tests for User Story 3 ⚠️

- [x] T041 [P] [US3] Write a failing Playwright e2e spec in `tests/e2e/review.spec.ts` covering: (a) wrong-answer rows render a shadcn `<Badge>` with text "Incorrect" AND an SVG icon (lucide `XCircle`) inside it; (b) perfect-score round renders a shadcn `<Alert>` with text "Perfect score — nothing to review" and no `<ul>` review list (Story 3 AC2); (c) the score `<Card>` has `role="status"` and `aria-live="polite"` (FR-029); (d) leaving a blank empty produces an `IncorrectEntry` with the empty `userAnswer` rendered as a visible "(no answer)" placeholder (Story 3 AC3, with a non-empty rendering for sighted users).
- [x] T042 [P] [US3] Extend `tests/unit/engine/score.test.ts` with explicit assertions for the case-insensitive (`paris === Paris`) and accent-sensitive (`ecole !== école`) paths against passages drawn from `tests/e2e/scripts/latin-fr.txt`, locking in Story 3 AC4 + AC5 alongside the existing T024 coverage.

### Implementation for User Story 3

- [x] T043 [US3] Replace the plain results UI from T034 in `app/routes/results.$sessionId.tsx` with the polished shadcn composition: score block as a `<Card role="status" aria-live="polite">`; perfect-score branch renders `<Alert>` "Perfect score — nothing to review"; otherwise a `<ul>` of rows, each row a shadcn `<Card>` containing the learner's answer (or `"(no answer)"` placeholder for empty strings), a shadcn `<Separator orientation="vertical">`, and the correct spelling, plus a `<Badge variant="destructive">` with `<XCircle aria-hidden="true" />` + the text "Incorrect" so the cue is non-color.
- [x] T044 [US3] Ensure the results page renders the score `<Card>` _before_ the review list in the DOM, so screen-reader users hear the outcome before the per-item details (FR-029); verify via `tests/e2e/review.spec.ts`.

**Checkpoint**: Review experience meets FR-027 (non-color cues), FR-029 (live-region score), Story 3 AC1–AC5.

---

## Phase 6: User Story 4 — Pick up where I left off across browser visits (Priority: P2)

**Goal**: The session list (`/sessions`) exists, resumes from home navigate to the most recent in-progress session, answers persist on blur so closing the tab mid-round preserves work, the cap enforces at create with appropriate UI feedback, and deletion is exposed in the list.

**Independent Test**: Start a round, type partial answers, close the tab, reopen the app, and confirm the round resumes with the same passage / difficulty / answers. Then visit `/sessions` and confirm both in-progress and completed sessions are listed with auto-labels and delete actions.

### Tests for User Story 4 ⚠️

- [x] T045 [P] [US4] Write a failing Playwright e2e spec in `tests/e2e/persistence.spec.ts` covering: (a) start a round, type into 2 blanks, reload the page → answers persist in those blanks; (b) navigate to `/`, get redirected to `/play/:id` for the most recent in-progress session; (c) navigate to `/sessions` → see both an in-progress and a completed session, each showing an auto-label and a delete button; (d) delete a session → it disappears from the list and a shadcn Sonner toast confirms; (e) third browser context (`browser.newContext()`) sees no sessions, satisfying Story 4 AC3.
- [x] T046 [P] [US4] Write a failing Playwright e2e spec scenario inside `tests/e2e/persistence.spec.ts` covering FR-024: pre-seed 20 completed sessions in `localStorage` via `page.evaluate`, then start a 21st round and assert that (a) the new round is created and (b) the oldest completed session is gone from `/sessions`.
- [x] T047 [P] [US4] Write a failing Playwright e2e spec scenario covering FR-024 cap-with-no-completed: pre-seed 20 in-progress sessions, then attempt to start a new round → assert a shadcn `<Alert>` appears explaining the learner must finish or delete an existing session before starting a new one.
- [x] T047a [P] [US4] Write a failing Playwright e2e spec in `tests/e2e/storage-disabled.spec.ts` covering FR-017 + the "Local storage full or disabled" edge case: use `page.addInitScript` to monkey-patch `window.localStorage.setItem` to throw `DOMException("QuotaExceededError")`, then (a) load `/play`, paste a passage, start a round; (b) play through and submit; (c) assert the results screen renders the correct score, AND a shadcn `<Alert variant="destructive">` appears at the top of `/play`, `/play/:id`, and `/sessions` informing the learner sessions won't be saved.

### Implementation for User Story 4

- [x] T048 [P] [US4] Implement `app/routes/sessions.tsx`: `clientLoader` returns `{ sessions: sessionStore.list(), saveDisabled: isSaveDisabled() }`. Renders either an empty-state shadcn `<Alert>` with a `<Button>` to `/play`, or a list of shadcn `<Card>` rows. Each row shows `session.label`, a `<Badge>` for difficulty, a `<Badge variant="secondary">` for status, a `<Button asChild>` Resume/Review link, and a `<Button variant="ghost">` Delete inside a `<Form method="post">` with `intent=delete`. The `clientAction` performs the delete and triggers a `toast.success("Session deleted")`.
- [x] T049 [US4] Add an `onBlur` handler in `app/components/passage-view.tsx` (or in the parent exercise route) that calls a `save_answer` `<Form method="post">` submission (via `useFetcher`) when a blank loses focus, persisting `answers[blankId]` to `localStorage` immediately. This keeps closed-tab recovery faithful.
- [x] T050 [US4] Update `app/routes/home.tsx`'s loader to use `sessionStore.list()` and redirect to `/play/:id` of the most recent in-progress session if one exists, else `/play`. (T035's stub gets the real lookup here.)
- [x] T051 [US4] Update `app/routes/play.tsx`'s `clientAction` to catch `CapReachedError` from `sessionStore.create` and return `{ error: 'cap_reached' }`, which the page renders as a shadcn `<Alert variant="destructive">` instructing the learner to finish or delete an existing session.
- [x] T052 [US4] Add `data-saveDisabled` rendering on `/play`, `/play/:sessionId`, and `/sessions` so when `isSaveDisabled()` returns `true`, a shadcn `<Alert variant="destructive">` reading "Your browser isn't allowing saved sessions — this round will play through but won't be saved" appears at the top of the page (FR-017). The Exercise-screen variant matters because storage can become unavailable mid-round (quota change, user revoking permission), and the learner needs to see the notice without leaving the round.

**Checkpoint**: Persistence story complete. Tab-close resume works, sessions list works, deletion works, cap eviction and cap-block both behave per FR-024.

---

## Phase 7: User Story 5 — Start a fresh round with different text (Priority: P3)

**Goal**: From the results screen, the learner can clearly restart with a clean start screen, without disturbing saved sessions.

**Independent Test**: Complete a round; click "Start new round" on results; observe an empty start screen at `/play`; complete a second round; verify both sessions are listed in `/sessions`.

### Tests for User Story 5 ⚠️

- [x] T053 [P] [US5] Write a failing Playwright e2e spec in `tests/e2e/restart.spec.ts` covering: (a) complete a round; (b) from `/results/:id` click "Start new round"; (c) land on `/play` with the `<Textarea>` empty and no error; (d) complete a second round; (e) `/sessions` shows both sessions distinguishable by their auto-labels.

### Implementation for User Story 5

- [x] T054 [US5] Confirm the "Start new round" link on `/results/:sessionId` (added in T034) routes to `/play` and does not pre-fill state. If T034's implementation already does this (it should, the route is purely link-based), no code change is needed — verify by passing T053 and document the verification in the task's commit message. If a code change is needed, add it to `app/routes/results.$sessionId.tsx`.

**Checkpoint**: Five user stories implemented; all P1–P3 scope shipped.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, offline guarantee, and the final pieces that span all stories.

- [x] T055 [P] Write `tests/e2e/a11y-keyboard.spec.ts` that: (a) navigates `/play` → `/play/:id` → `/results/:id` → `/sessions` using only `Tab`/`Shift+Tab`/`Enter`; (b) at each step asserts the focused element is logical (within reading order); (c) runs `@axe-core/playwright` on each page and asserts zero `critical` or `serious` violations (SC-009).
- [x] T056 [P] Write `tests/e2e/offline.spec.ts` that (a) loads the app with the network online, completes a full round; (b) calls `context.setOffline(true)`; (c) reloads, starts a new round, plays it through, lands on the results page — all with no network activity recorded by `page.on('request')` (FR-030, FR-032).
- [x] T056a [P] Write `tests/unit/engine/performance.test.ts` (Vitest) that locks in SC-003: build a 500-word synthetic passage (e.g., the word "lorem" repeated, separated by spaces), then assert `tokenize(passage)` + `selectBlanks(tokens, 'hard')` together complete in under 200 ms on the CI runner (a 10× safety margin against the SC-003 budget of 2 s). Fails the suite if the budget is exceeded.
- [x] T056b [P] Write `tests/e2e/mobile-viewport.spec.ts` covering FR-025's "usable on a single screen (including on a phone)" clause: configure a Playwright project with `viewport: { width: 390, height: 844 }` (iPhone 13), paste the French fixture, run a Hard round to completion, and assert (a) no horizontal scrollbar on the exercise page (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`), (b) every blank `<input>` is visible without horizontal scrolling, (c) the results review list renders without horizontal overflow.
- [x] T057 [P] Run `pnpm typecheck` and resolve any remaining strict-mode errors across `app/**/*.ts(x)` so React Router's typegen + `tsc` both pass clean.
- [x] T058 [P] Run `pnpm lint` and resolve any remaining ESLint warnings (including `eslint-plugin-jsx-a11y` findings); per the constitution, warnings count as failures.
- [x] T059 Walk through `specs/001-fill-blank-game/quickstart.md` end to end on a clean clone and update any drift between the document and the implemented behavior. Verify the offline-via-service-worker section actually demonstrates the round playing offline.
- [x] T060 Delete `tests/example.spec.ts` (the Playwright starter) once at least one real e2e spec is green so it does not run alongside the feature specs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** — no dependencies; T002–T008 can run in parallel after T001 completes (T001 must run first because shadcn writes to `components.json` non-concurrently).
- **Phase 2 (Foundational)** — depends on Phase 1; types (T009) gate every subsequent task in the phase.
- **Phase 3 (US1)** — depends on Phase 2.
- **Phase 4 (US2)** — depends on Phase 3 (extends the start and exercise routes).
- **Phase 5 (US3)** — depends on Phase 3 (replaces the bare results screen built in T034).
- **Phase 6 (US4)** — depends on Phase 3 (uses the session-store wiring that US1 establishes through the routes). Can run in parallel with US3 if staffed.
- **Phase 7 (US5)** — depends on Phase 3 (results screen's "Start new round" link) and ideally Phase 6 (so the saved-sessions check in T053 is meaningful).
- **Phase 8 (Polish)** — depends on every prior phase.

### Within Each User Story

- Failing tests MUST be written before their corresponding implementation (Constitution Principle I).
- Models / engine functions before route / UI integration.
- Route loaders/actions before the component code they pass data to (the route contract is what the components consume).

### Parallel Opportunities

- **Setup**: T002–T008 are all `[P]` once T001 has installed the shadcn primitives.
- **Foundational tests**: T010, T012, T014, T016, T018 can all be written in parallel (each in its own test file).
- **Foundational implementations**: T011, T013, T015 are sequential within the storage layer (depend on each other); T017 and T019 are `[P]` with the storage chain and with each other.
- **US1 tests**: T022, T023, T024, T025, T026, T027, T027a are all `[P]` (different files, no impl dependencies).
- **US1 engine implementations**: T028, T029, T030 are `[P]` (independent engine files).
- **US4 tests**: T045, T046, T047, T047a are all `[P]` (T047a lives in its own spec file).
- **US3 + US4** can be staffed in parallel after US1 is checkpointed (different files).
- **Polish**: T055, T056, T056a, T056b, T057, T058 are `[P]`; T059 and T060 run last.

---

## Parallel Example: User Story 1 test wave

```bash
# All US1 failing tests, written in parallel before any US1 implementation lands:
Task: "Vitest difficulty config tests in tests/unit/engine/difficulty.test.ts"      # T022
Task: "Vitest selectBlanks tests in tests/unit/engine/select-blanks.test.ts"       # T023
Task: "Vitest scoreSession tests in tests/unit/engine/score.test.ts"               # T024
Task: "Component test for PassageView in tests/component/passage-view.test.tsx"    # T025
Task: "Playwright core-round.spec.ts (latin-fr fixture)"                           # T026
Task: "Playwright core-round.spec.ts extra scenarios (cyrillic-ru, cjk-zh, ar)"    # T027
Task: "Playwright no-eligible-words.spec.ts (FR-013)"                              # T027a
```

Then in parallel for implementation:

```bash
Task: "Implement difficultyConfig in app/engine/difficulty.ts"                     # T028
Task: "Implement selectBlanks in app/engine/select-blanks.ts"                      # T029
Task: "Implement scoreSession in app/engine/score.ts"                              # T030
```

Routes (T032–T035) and `PassageView` (T031) are sequential after the engine because they consume it.

---

## Implementation Strategy

### MVP First (Phases 1–3 → ship User Story 1)

1. Complete Phase 1 (Setup) — primitives, deps, fixtures.
2. Complete Phase 2 (Foundational) — types, storage, tokenize, label, shell, routes table.
3. Complete Phase 3 (User Story 1) — paste → blanks → score → review (bare-bones) across French, Russian, and Chinese fixtures.
4. **STOP AND VALIDATE**: run `pnpm lint && pnpm typecheck && pnpm ci:test && pnpm e2e`. Demo `core-round.spec.ts` passing on all three scripts. This is a shippable MVP that already satisfies SC-001, SC-002, SC-003, SC-006 for one difficulty.

### Incremental Delivery After MVP

1. Phase 4 (US2 — difficulty picker) → ship: SC-007 contrast verified, P1 fully delivered.
2. Phase 5 (US3 — polished review) → ship: review UX meets FR-027 + FR-029.
3. Phase 6 (US4 — persistence list & resume) → ship: tab-close recovery works, sessions list works, cap behavior works.
4. Phase 7 (US5 — clean restart) → ship: restart loop confirmed.
5. Phase 8 (Polish) → ship: a11y audit clean, offline guarantee verified, lint/typecheck clean.

### Parallel Team Strategy

After Phase 2 is green:

- Developer A: Phase 3 (US1).
- Once US1 is checkpointed:
  - Developer A: Phase 4 (US2) + Phase 5 (US3) in sequence (both touch the same routes from US1).
  - Developer B: Phase 6 (US4) in parallel (sessions/persistence work, different files).
  - Either developer: Phase 7 (US5) + Phase 8 (Polish) after US3 + US4 converge.

---

## Notes

- The constitution makes test-first non-negotiable; every implementation task is preceded by a failing-test task. Do not invert this order even when it feels redundant.
- `[P]` tasks operate on different files and have no incomplete-task dependencies. When in doubt, do not mark `[P]`.
- The single bespoke component (`PassageView`) is the only place outside `app/components/ui/` where non-trivial JSX lives; every other UI piece composes shadcn primitives inline in its route file.
- Commit after each task (Constitution: small, focused commits). The repo's `after_*` hooks auto-commit, so manual commits should be redundant in practice.
- Stop at the end of any phase to validate the increment independently — every phase ends at a `Checkpoint` line.
- Avoid: inventing new UI primitives (use shadcn), adding state-management libraries (Principle IV), accepting ESLint warnings (Principle II treats warnings as failures), or skipping the test-first ordering (Principle I).
