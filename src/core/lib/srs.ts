// Spaced repetition: every word has a little "relationship" with you.
// Right answers push the next review further away (1 → 3 → 7 → 14 → 30 days);
// a wrong answer brings the word back today.

export type Memory = {
  /** Box 0–5: how well you know it. */
  b: number;
  /** Next review date (YYYY-MM-DD). */
  due: string;
  /** Times answered wrong. */
  w: number;
  /** Last time you saw it. */
  seen: string;
};

export const INTERVALS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = INTERVALS.length - 1;
/** Answers slower than this count as "still thinking" and don't move the word forward. */
export const SLOW_MS = 9000;

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);

/** Update a word's memory after a quiz answer. */
export function recall(m: Memory | undefined, correct: boolean, today: string, slow = false): Memory {
  const prev = m ?? { b: 0, due: today, w: 0, seen: today };
  if (!correct) return { b: 0, due: today, w: prev.w + 1, seen: today };
  const b = slow ? Math.max(1, prev.b) : Math.min(MAX_BOX, prev.b + 1);
  return { b, due: addDays(today, INTERVALS[b]), w: prev.w, seen: today };
}

/** First time you meet a word (flashcards): see it again tomorrow. */
export const meet = (m: Memory | undefined, today: string): Memory => m ?? { b: 1, due: addDays(today, 1), w: 0, seen: today };

export const isDue = (m: Memory, today: string) => m.due <= today;

/** Words to review now: the ones you get wrong most, then the most overdue. */
export function dueKeys(memory: Record<string, Memory>, today: string): string[] {
  return Object.entries(memory)
    .filter(([, m]) => isDue(m, today))
    .sort(([, a], [, b]) => b.w - a.w || a.due.localeCompare(b.due) || a.b - b.b)
    .map(([k]) => k);
}

export type Stage = { id: "seed" | "growing" | "strong" | "mastered"; emoji: string; label: string; share: number };

/** 🌱 Seed → 🌿 Growing → 🌳 Strong → ❤️ Mastered */
export function stage(m: Memory | undefined): Stage {
  const b = m?.b ?? 0;
  const share = b / MAX_BOX;
  if (b >= MAX_BOX) return { id: "mastered", emoji: "❤️", label: "Mastered", share };
  if (b >= 4) return { id: "strong", emoji: "🌳", label: "Strong", share };
  if (b >= 2) return { id: "growing", emoji: "🌿", label: "Growing", share };
  return { id: "seed", emoji: "🌱", label: "Seed", share };
}

export function nextReviewLabel(m: Memory | undefined, today: string): string {
  if (!m) return "Not learned yet";
  const d = daysBetween(today, m.due);
  return d <= 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`;
}
