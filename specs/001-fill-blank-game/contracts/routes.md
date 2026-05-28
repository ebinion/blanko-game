# Contract: Routes (`app/routes/`)

**Feature**: 001-fill-blank-game
**Scope**: URL map of the SPA and the data each route loads / writes. React Router v7 in SPA mode.

All routes are client-rendered. `clientLoader` reads `localStorage` synchronously; `clientAction` performs the relevant mutation and `redirect`s to the next URL.

---

## `/` — Home (redirect)

**Component**: `routes/home.tsx`

**Loader behavior**:

- If at least one session has `status === "in_progress"`, redirect to `/play/:id` for the most recent in-progress session by `createdAt`.
- Otherwise redirect to `/play`.

**Renders**: nothing (always redirects).

---

## `/play` — Start screen

**Component**: `routes/play.tsx`

**Loader returns**: `{ lastDifficulty: Difficulty, saveDisabled: boolean }`.

**Renders** (composed entirely from shadcn primitives + the bespoke `PassageView`):

- A shadcn `<Textarea>` for the passage paste area, with a shadcn `<Label>` "Paste a passage in your target language".
- A shadcn `<ToggleGroup type="single">` with three `<ToggleGroupItem>`s (Easy / Medium / Hard), defaulted to `lastDifficulty`.
- A shadcn `<Button>` "Start round".
- If `saveDisabled`: a shadcn `<Alert variant="destructive">` explaining sessions won't be saved.
- A link to `/sessions`.

**Action** (`POST /play`):

- Inputs: `{ passage: string, difficulty: Difficulty }`.
- Calls `tokenize`, then `selectBlanks`. If `selectBlanks` returns `[]`, returns a 422-style action result `{ error: "no_eligible_words" }` consumed by the page (rendered in a shadcn `<Alert>`).
- Otherwise creates a new `Session`, persists it via `session-store.create`, updates `settings.lastDifficulty`, then `redirect`s to `/play/:sessionId`.
- If the session cap is reached and no completed session exists to evict (FR-024), returns `{ error: "cap_reached" }`.

---

## `/play/:sessionId` — Exercise screen

**Component**: `routes/play.$sessionId.tsx`

**Loader returns**: `{ session: Session, saveDisabled: boolean }`. If the session does not exist or is already completed, the loader `redirect`s to `/sessions`.

**Renders**:

- `<PassageView session={session} />` — the bespoke component that walks `session.tokens` and renders text spans for non-blanked tokens and a shadcn `<Input>` per blank, with `aria-label` describing the blank.
- A shadcn `<Button>` "Submit answers".
- A shadcn `<Button variant="outline">` "Save and exit" (just navigates to `/sessions`; answers are persisted on every keystroke via the action below).

**Action** (`POST /play/:sessionId`):

- Two intents (via a hidden `intent` field):
  - `"save_answer"`: `{ blankId, value }` → writes `session.answers[blankId] = value` and returns `null` (called from each `<Input>`'s `onBlur` for cheap persistence).
  - `"submit"`: runs `scoreSession`, marks the session `completed`, stores the `Result`, then `redirect`s to `/results/:sessionId`.

---

## `/results/:sessionId` — Results screen

**Component**: `routes/results.$sessionId.tsx`

**Loader returns**: `{ session: Session }`. If the session is not completed, the loader `redirect`s to `/play/:sessionId`. If the session does not exist, redirect to `/sessions`.

**Renders**:

- Score block: a shadcn `<Card>` with `role="status"` and `aria-live="polite"` containing the text "X of Y correct".
- Review list (if `session.result.incorrect.length > 0`): a semantic `<ul>` of rows, each row containing the learner's answer and the correct spelling, with a shadcn `<Badge>` marked "Incorrect" plus a lucide `XCircle` icon (non-color cue).
- If `incorrect.length === 0`: a shadcn `<Alert>` "Perfect score — nothing to review".
- A shadcn `<Button>` "Start new round" → links to `/play`.
- A shadcn `<Button variant="outline">` "Back to sessions" → links to `/sessions`.

**No action** — this route is read-only.

---

## `/sessions` — Saved-session list

**Component**: `routes/sessions.tsx`

**Loader returns**: `{ sessions: Session[], saveDisabled: boolean }` sorted by `createdAt` descending.

**Renders**:

- If `sessions.length === 0`: a shadcn `<Alert>` empty-state with a `<Button>` "Start your first round" → `/play`.
- Otherwise a list of shadcn `<Card>` rows, each row showing:
  - `session.label` as the row title.
  - A shadcn `<Badge>` for the difficulty (`session.difficulty`).
  - A shadcn `<Badge variant="secondary">` for status ("In progress" / "Completed: X/Y").
  - A `<Button asChild>` "Resume" → `/play/:id` (if in-progress) or "Review" → `/results/:id` (if completed).
  - A `<Button variant="ghost">` "Delete".
- If `saveDisabled`: a shadcn `<Alert variant="destructive">` explaining new sessions won't be saved.

**Action** (`POST /sessions`):

- Intent: `"delete"` with `{ sessionId }` → removes the session, triggers a shadcn `<Sonner>` toast confirming deletion, and re-renders the list.

---

## Accessibility expectations (apply to every route)

- The route's root element is a `<main>` landmark with an `aria-labelledby` heading.
- Focus on navigation lands on the route's `<h1>` (managed by React Router's default behavior; verified by `a11y-keyboard.spec.ts`).
- All interactive elements are reachable in DOM order with `Tab` / `Shift+Tab` (FR-028).
- The Results route's score `<Card role="status" aria-live="polite">` is announced on mount (FR-029).

## Routing contract for tests

The Playwright e2e specs target these URLs directly (e.g., `await page.goto('/play')`). The URLs above are stable for the lifetime of v1; any change requires updating both this contract and the e2e specs in the same commit.
