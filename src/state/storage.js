// Persistence layer. Uses localStorage so it works in any browser build.
// Swap this module for an API client when a backend is added — the rest of
// the app only depends on load/persist/clear.
const STORE_KEY = "bbc-workflow-v1";

export function loadPersisted() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persist(state) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ opportunities: state.opportunities }));
  } catch (e) {
    console.error("persist failed", e);
  }
}

export function clearPersisted() {
  try {
    if (typeof window !== "undefined" && window.localStorage) window.localStorage.removeItem(STORE_KEY);
  } catch {}
}
