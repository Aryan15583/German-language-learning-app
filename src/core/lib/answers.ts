// Checking typed answers in a forgiving but honest way.

/**
 * Normalise German text for comparison: case, punctuation and spacing are
 * ignored, and umlauts/ß match their ASCII spellings (ä = ae, ß = ss), so
 * people without a German keyboard aren't punished.
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:…„“”"'‚‘’«»()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Classic edit distance (insertions, deletions, substitutions). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export type AnswerVerdict = "correct" | "typo" | "wrong";

/** How many typos we forgive, by answer length. */
export function allowedTypos(length: number): number {
  if (length >= 14) return 2;
  if (length >= 5) return 1;
  return 0;
}

/**
 * Compare a typed answer with the expected German.
 * "typo" counts as correct, but the app shows the right spelling.
 */
export function checkTypedAnswer(input: string, expected: string): AnswerVerdict {
  const given = normalizeAnswer(input);
  const target = normalizeAnswer(expected);
  if (!given) return "wrong";
  if (given === target) return "correct";
  return levenshtein(given, target) <= allowedTypos(target.length) ? "typo" : "wrong";
}

export const isAccepted = (v: AnswerVerdict) => v !== "wrong";
