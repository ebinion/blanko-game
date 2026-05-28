# Contract: localStorage schema

**Feature**: 001-fill-blank-game
**Scope**: Wire format of the single `localStorage` key the app reads and writes.

## Key

A single key under the origin's `localStorage`:

```text
blanko:v1
```

The `v1` suffix encodes the major schema version. A future incompatible change becomes `blanko:v2` (and the migration code in `app/storage/schema.ts` is responsible for transferring `blanko:v1` → `blanko:v2` on first read).

## Value

The value is a JSON string. After `JSON.parse`, it conforms to the `Store` shape defined in [../data-model.md](../data-model.md):

```jsonc
{
  "schemaVersion": 1,
  "settings": {
    "lastDifficulty": "medium",
  },
  "sessions": [
    {
      "id": "01J9X7P2QC8Y6P3N4F6KZTQAN6",
      "createdAt": "2026-05-28T14:21:09.103Z",
      "label": "La mer est calme · 2026-05-28",
      "practiceText": "La mer est calme et le ciel est bleu.",
      "difficulty": "medium",
      "tokens": [
        { "text": "La", "start": 0, "end": 2, "isWord": true },
        { "text": " ", "start": 2, "end": 3, "isWord": false },
        { "text": "mer", "start": 3, "end": 6, "isWord": true },
        /* ... */
      ],
      "blanks": [
        {
          "id": "01J9X7P2QC8Y6P3N4F6KZTQAN6-4",
          "tokenIndex": 4,
          "correctWord": "calme",
        },
        {
          "id": "01J9X7P2QC8Y6P3N4F6KZTQAN6-10",
          "tokenIndex": 10,
          "correctWord": "bleu",
        },
      ],
      "answers": {
        "01J9X7P2QC8Y6P3N4F6KZTQAN6-4": "calme",
      },
      "status": "in_progress",
    },
    {
      "id": "01J9X1ABXCAEY7Q9HJ52F3P2RH",
      "createdAt": "2026-05-27T19:05:42.000Z",
      "label": "The quick brown fox · 2026-05-27",
      "practiceText": "The quick brown fox jumps over the lazy dog.",
      "difficulty": "easy",
      "tokens": [
        /* ... */
      ],
      "blanks": [
        /* ... */
      ],
      "answers": {
        /* ... */
      },
      "status": "completed",
      "result": {
        "score": { "correct": 5, "total": 6 },
        "incorrect": [
          {
            "blankId": "01J9X1ABXCAEY7Q9HJ52F3P2RH-7",
            "userAnswer": "lasy",
            "correctWord": "lazy",
          },
        ],
      },
    },
  ],
}
```

## Read/write rules

- **Atomic document**: every write replaces the entire string under `blanko:v1`. Callers never compose partial writes.
- **Synchronous reads**: route loaders read this key directly with `JSON.parse`. A read that fails to parse is treated as "no store yet" and the loader returns a freshly initialized empty `Store`.
- **Quota / private mode**: writes that throw `QuotaExceededError` or `SecurityError` set an in-memory `saveDisabled` flag. The UI displays a shadcn `<Alert variant="destructive">` explaining sessions won't be saved (FR-017). The current round still plays through in memory.

## Invariants enforced by `app/storage/session-store.ts`

1. `schemaVersion === 1`. A different value triggers the migration slot (no migrations in v1).
2. `sessions.length ≤ 20` (FR-024). On overflow, the oldest `completed` session is evicted; if none exists, the write is rejected with a typed error consumed by the route action.
3. `id` is unique across `sessions`.
4. `settings.lastDifficulty ∈ { "easy", "medium", "hard" }`.
5. For every session: `result` is present iff `status === "completed"`.

## Initial value

On first ever load, the store is initialized to:

```json
{
  "schemaVersion": 1,
  "settings": { "lastDifficulty": "medium" },
  "sessions": []
}
```

This default lives in `app/storage/schema.ts` as `EMPTY_STORE` and is also the value returned by the safe-storage adapter when reading fails.

## What lives OUTSIDE this key

Nothing. This feature does not write to any other `localStorage` key, `sessionStorage`, `IndexedDB`, cookies, the URL hash, or any other client-side store.
