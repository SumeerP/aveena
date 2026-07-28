// Date + time helpers
/* ---------- Date helpers ---------- */

export const DAY = 24 * 60 * 60 * 1000;
export const now = () => Date.now();
export const daysAgo = (n) => Date.now() - n * DAY;
export const daysBetween = (a, b) => Math.max(0, Math.round((b - a) / DAY));
export const fmtDate = (t) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtDateTime = (t) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
  " · " +
  new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function act(at, by, text) {
  return { at, by, text };
}
