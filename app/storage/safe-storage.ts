import type { Store } from "~/engine/types";
import { EMPTY_STORE } from "./schema";

const STORAGE_KEY = "blanko:v1";
let saveDisabled = false;

export function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ...EMPTY_STORE, sessions: [] };
    return JSON.parse(raw) as Store;
  } catch {
    return { ...EMPTY_STORE, sessions: [] };
  }
}

export function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    saveDisabled = true;
  }
}

export function isSaveDisabled(): boolean {
  return saveDisabled;
}
