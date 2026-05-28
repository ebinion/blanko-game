# Contract: Game engine module (`app/engine/`)

**Feature**: 001-fill-blank-game
**Scope**: Public TypeScript surface of the pure, framework-free game engine. These are the function signatures route loaders and components depend on. Anything not listed here is an implementation detail and may change without notice.

The engine has no dependency on React, the DOM, or `localStorage`. Every function below is deterministic given its inputs (no randomness, no clock reads).

---

## `tokenize`

```ts
function tokenize(passage: string): Token[]
```

Splits `passage` into `Token` objects per [../data-model.md](../data-model.md) using `Intl.Segmenter` with `granularity: "word"`, plus a post-pass merging:

- contractions: `["don", "'", "t"]` → `"don't"` (a single `isWord: true` token)
- hyphenated compounds: `["well", "-", "known"]` → `"well-known"` (a single `isWord: true` token)
- CJK ideographs: one `Token` per character (each with `isWord: true`)

**Postconditions**:

- `tokens.map(t => t.text).join("") === passage` (exhaustive coverage).
- Tokens are sorted by `start`.
- A token with `isWord: false` is whitespace, punctuation, numbers, or symbols; never a candidate for blanking.

**Throws**: never. Empty `passage` returns `[]`.

---

## `selectBlanks`

```ts
function selectBlanks(
  tokens: Token[],
  difficulty: Difficulty,
  options?: { sessionId: string },
): Blank[]
```

Picks blank positions deterministically from `tokens` per the rules in [../research.md](../research.md) §3.

**Postconditions**:

- `result.length ≤ blankCap[difficulty]` (Easy: 8, Medium: 14, Hard: 20).
- Every returned blank's `tokenIndex` refers to a token with `isWord === true`.
- `result` is sorted by `tokenIndex` ascending; `tokenIndex` values are unique.
- Positions are stratified across the passage (one per equal-width index bucket).
- For the same `tokens` and `difficulty`, the function returns equal output on every call.
- Higher difficulty produces at least as many blanks as a lower difficulty on the same passage (when eligible words exist).

**Error mode**: returns `[]` if no eligible words exist at the requested difficulty. Callers (route actions) detect this and surface the FR-013 error to the learner via a shadcn `<Alert>`.

---

## `scoreSession`

```ts
function scoreSession(session: Session): Result
```

Evaluates each blank in `session.blanks` against `session.answers[blankId]` using the case-insensitive, accent-sensitive rule (FR-019).

**Postconditions**:

- `result.score.total === session.blanks.length`.
- `result.score.correct + result.incorrect.length === result.score.total`.
- A blank with no entry in `session.answers`, or an entry whose `.trim()` is empty, is treated as incorrect (FR-012).
- The comparison is:
  ```ts
  const a = userAnswer.trim().normalize('NFC').toLocaleLowerCase()
  const b = correctWord.normalize('NFC').toLocaleLowerCase()
  const correct = a === b
  ```

**Throws**: never. Does not mutate `session`.

---

## `labelSession`

```ts
function labelSession(passage: string, createdAt: Date): string
```

Computes the human-readable auto-label per FR-022.

**Output shape**: `"<up to first 4 word-like tokens> · <YYYY-MM-DD>"`, truncated to ≤ 80 characters total. Example: `"La mer est calme · 2026-05-28"`.

**Throws**: never. An entirely non-word passage yields `"(untitled) · <YYYY-MM-DD>"`.

---

## `difficultyConfig`

```ts
interface DifficultyConfig {
  density: number // 0.10 | 0.20 | 0.30
  minWordLength: number
  maxWordLength?: number
  blankCap: number // 8 | 14 | 20
}

function difficultyConfig(difficulty: Difficulty): DifficultyConfig
```

Returns the tuning parameters for the difficulty per the table in research.md §3. Callers MUST go through this function rather than hard-coding parameters elsewhere.

---

## Type re-exports

`app/engine/types.ts` is the single source of truth for `Token`, `Blank`, `Session`, `Result`, `IncorrectEntry`, `Difficulty`, `Settings`, and `Store`. Every other module imports from there; no parallel definitions are allowed.

## Tests required against this contract

Each function above MUST have at least one Vitest unit test covering:

- the postconditions listed above (per-function),
- the spec acceptance criteria the function exists to satisfy:
  - `tokenize` → FR-021, plus the contraction/hyphen/CJK cases
  - `selectBlanks` → FR-003 – FR-005, FR-025, FR-026, SC-007 contrast
  - `scoreSession` → FR-009, FR-010, FR-012, FR-019, Story 3 acceptance scenarios 4 and 5
  - `labelSession` → FR-022 plus the empty-passage fallback
  - `difficultyConfig` → returns distinct configurations for each difficulty with the monotonicity FR-004 + FR-005 require

These tests are the failing-first artifacts required by the constitution's Test-First principle.
