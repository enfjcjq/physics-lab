// ============================================================
// Unified localStorage persistence helpers.
//
// Why this exists: five stores each had their own copy of
// try/catch + JSON.parse/stringify boilerplate. One change
// (e.g. adding a storage prefix, or swapping the backend)
// would have to be made five times. Now it is made once.
//
// Domain-specific logic (migrations, Set<->Array conversion)
// stays in each store — this module only owns the mechanics.
// ============================================================

/** Load and JSON-parse a value from localStorage. Returns `fallback` on missing/corrupt data. */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringify and save a value to localStorage. Never throws (quota/denied -> silent). */
export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — persistence is best-effort
  }
}

/** Remove a key from localStorage. Never throws. */
export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
