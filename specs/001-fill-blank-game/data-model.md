# Phase 1 Data Model — Fill-in-the-Blank Language Practice Game

**Feature**: 001-fill-blank-game
**Date**: 2026-05-28

This data model is entirely client-side. All entities are TypeScript types living in `app/engine/types.ts` and persisted as JSON in `localStorage` under the key `blanko:v1` (see [contracts/storage-schema.md](./contracts/storage-schema.md)).

## Entity overview

```text
Store (root document in localStorage)
├── schemaVersion: 1
├── settings: { lastDifficulty }
└── sessions: Session[]
                   ├── practiceText: string                    (original passage, verbatim)
                   ├── difficulty: Difficulty
                   ├── tokens: Token[]                         (derived; cached on creation)
                   ├── blanks: Blank[]                         (chosen positions)
                   ├── answers: Record<blankId, string>        (in-progress)
                   ├── status: 'in_progress' | 'completed'
                   └── result?: Result                         (set when status='completed')
                                  ├── score: { correct, total }
                                  └── incorrect: IncorrectEntry[]
```

## Entities

### `Difficulty`

```ts
type Difficulty = 'easy' | 'medium' | 'hard';
```

The configured difficulty for a Session. Determines blank density and the bias toward longer words (see [contracts/game-engine.md](./contracts/game-engine.md)).

### `Token`

```ts
interface Token {
  /** The exact substring from the original passage. */
  text: string;
  /** Codepoint offset into the original passage where this token starts. */
  start: number;
  /** Codepoint offset (exclusive) where this token ends. */
  end: number;
  /** Whether this is a candidate for blanking. False for whitespace, punctuation, numbers. */
  isWord: boolean;
}
```

**Source of truth**: produced by `tokenize(passage: string): Token[]` (see contracts/game-engine.md). The full token array is cached on the Session so re-rendering the passage on resume does not require re-tokenization.

**Validation**:
- `text.length > 0`
- `start < end` and they fall within the passage bounds
- Tokens cover the passage exhaustively: `tokens[i].end === tokens[i+1].start`
- Token order matches passage order (`tokens` is sorted by `start`)

### `Blank`

```ts
interface Blank {
  /** Stable identifier (e.g., a UUID or `${sessionId}-${tokenIndex}`). */
  id: string;
  /** Index into Session.tokens — the word being blanked. */
  tokenIndex: number;
  /** The original word at that position. Cached so we can score without re-tokenizing. */
  correctWord: string;
}
```

**Validation**:
- `tokenIndex` refers to a token whose `isWord` is `true`.
- `correctWord === session.tokens[tokenIndex].text`.
- `blanks` are sorted by `tokenIndex` ascending and `tokenIndex` is unique within a session.

### `Session`

```ts
interface Session {
  /** Stable identifier (UUID). */
  id: string;
  /** ISO 8601 instant when the session was created. */
  createdAt: string;
  /** Human-readable auto-label: "<first 4 words> · <YYYY-MM-DD>". */
  label: string;
  /** Original passage verbatim. */
  practiceText: string;
  /** Configured difficulty. */
  difficulty: Difficulty;
  /** Cached tokenization of practiceText. */
  tokens: Token[];
  /** Chosen blank positions and their correct words. */
  blanks: Blank[];
  /** Learner's typed answers, keyed by Blank.id. Missing keys treated as empty. */
  answers: Record<string, string>;
  /** Lifecycle. */
  status: 'in_progress' | 'completed';
  /** Final result, present iff status === 'completed'. */
  result?: Result;
}
```

**State transitions**:

```text
[create]
   │
   ▼
in_progress  ── (learner submits) ──▶  completed
   │                                       │
   │                                       │
   └── (learner deletes) ─────┐    ┌──────┘
                              ▼    ▼
                          [removed from store]
```

Auto-eviction (FR-024): when adding a new session would push the count above 20, the **oldest completed session** by `createdAt` is removed first. If none exists, the create is refused and the learner is told to delete or finish an existing in-progress session.

**Validation**:
- `label` is non-empty and ≤ 80 characters.
- `practiceText` is non-empty after `.trim()`.
- `tokens` validates per the rules above; `blanks` validates per its rules.
- If `status === 'completed'`, `result` is defined; otherwise it is absent.
- The total token count is unlimited at the storage layer, but `blanks.length ≤ blankCap[difficulty]` from the difficulty config.

### `Result`

```ts
interface Result {
  score: {
    /** Number of blanks the learner answered correctly. */
    correct: number;
    /** Total number of blanks in the session. */
    total: number;
  };
  /** One entry per blank the learner answered incorrectly (including blanks left empty). */
  incorrect: IncorrectEntry[];
}

interface IncorrectEntry {
  /** Blank.id this entry refers to. */
  blankId: string;
  /** Learner's typed answer, verbatim. May be empty string. */
  userAnswer: string;
  /** Correct spelling for the blank (mirrors Blank.correctWord). */
  correctWord: string;
}
```

**Validation**:
- `score.correct + incorrect.length === score.total`.
- `score.total === session.blanks.length`.
- Every `blankId` in `incorrect` refers to a real Blank in the parent session.

### `Settings`

```ts
interface Settings {
  /** The difficulty to default to on the start screen. Updated whenever a round is started. */
  lastDifficulty: Difficulty;
}
```

### `Store` (root persisted document)

```ts
interface Store {
  schemaVersion: 1;
  settings: Settings;
  sessions: Session[];
}
```

**Validation**:
- `schemaVersion === 1`. Any other value triggers a migration slot (none in v1; future versions will branch here).
- `sessions.length ≤ 20`.
- Session `id`s are unique within the array.

## Derivations and invariants

- **Auto-label** (FR-022): computed once at session creation from `practiceText` and `createdAt`. Stored on the Session so we never need to re-derive it later (and so deleting words at the start of the passage does not — and cannot — happen in v1 anyway).
- **`tokens` is derived from `practiceText`** but is stored so we do not re-tokenize on every render. The tokenizer is deterministic, so a Session reloaded from storage and re-tokenized would produce an identical array.
- **Resume invariant**: a session is fully resumable from `{ practiceText, difficulty, tokens, blanks, answers, status }`. No transient render state is needed.
- **Storage atomicity**: every mutation rewrites the entire `Store` JSON document under the single key `blanko:v1`. There is never a partial write across keys.

## Relationship to spec entities

| Spec entity | Implementation |
|---|---|
| Practice Text | `Session.practiceText` (verbatim original) + `Session.tokens` (derived) |
| Difficulty Level | `Session.difficulty` of type `Difficulty` |
| Blank | `Blank` interface (one per blanked position) |
| Session (Round) | `Session` interface |
| Result | `Result` interface |
