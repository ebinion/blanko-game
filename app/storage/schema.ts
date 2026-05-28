import type { Store } from "~/engine/types";

export const EMPTY_STORE: Store = {
  schemaVersion: 1,
  settings: { lastDifficulty: "medium" },
  sessions: [],
};

export function validateStore(data: unknown): Store {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid store: not an object");
  }
  const obj = data as Record<string, unknown>;
  if (obj.schemaVersion !== 1) {
    throw new Error(`Invalid store: schemaVersion must be 1, got ${obj.schemaVersion}`);
  }
  const sessions = obj.sessions;
  if (!Array.isArray(sessions)) {
    throw new Error("Invalid store: sessions must be an array");
  }
  const ids = sessions.map((s) => (s as { id: string }).id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new Error("Invalid store: duplicate session ids");
  }
  return data as Store;
}
