// Slows down PIN guessing: after 5 wrong tries, wait 30 s, then 1 min, 2 min… (up to 1 hour).
const KEY = "zh-pin-fails";
type Fails = { n: number; until: number };

function read(): Fails {
  try {
    const f = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Fails | null;
    return f && typeof f.n === "number" && typeof f.until === "number" ? f : { n: 0, until: 0 };
  } catch {
    return { n: 0, until: 0 };
  }
}

/** Seconds to wait before the next try (0 = go ahead). */
export function pinWaitSeconds(now = Date.now()): number {
  return Math.max(0, Math.ceil((read().until - now) / 1000));
}

export function recordPinTry(ok: boolean, now = Date.now()) {
  const f = read();
  const next: Fails = ok ? { n: 0, until: 0 } : { n: f.n + 1, until: f.n + 1 >= 5 ? now + Math.min(3600, 30 * 2 ** (f.n + 1 - 5)) * 1000 : 0 };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked
  }
}
