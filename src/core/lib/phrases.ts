// "Write what you feel" → German. No AI: we match your words against a phrasebook.
import { JOURNEY, SECRET_PHRASES } from "../content/berlin";
import { PHRASEBOOK } from "../content/extras";
import { allWords, NOTE_PARTS, type Word } from "../content/levels";
import { romanizeMarathi } from "./romanize";

const STOP = new Set(["i", "you", "a", "the", "to", "me", "my", "is", "am", "are", "it", "so", "and", "of", "for", "your", "be", "do", "very", "much", "really"]);

const words = (t: string) =>
  t
    .toLowerCase()
    .split(/[^\p{L}\p{M}]+/u)
    .filter((w) => w.length > 1 && !STOP.has(w));

let book: Word[] | null = null;
export function lovePhrases(): Word[] {
  if (book) return book;
  const map = new Map<string, Word>();
  const add = (w: Word) => !map.has(w.de) && map.set(w.de, w);
  PHRASEBOOK.forEach(add);
  SECRET_PHRASES.forEach(add);
  NOTE_PARTS.middles.forEach((m) => add({ ...m, de: m.de.charAt(0).toUpperCase() + m.de.slice(1) }));
  JOURNEY.find((s) => s.id === "date")?.words.forEach(add);
  allWords().filter((w) => /\s/.test(w.de)).forEach(add);
  book = [...map.values()];
  return book;
}

/** The best German phrases for what you typed (English, मराठी or Marathi in English letters). */
export function suggestPhrases(text: string, n = 3, pool: Word[] = lovePhrases()): Word[] {
  const q = words(text);
  if (!q.length) return [];
  const asked = text.trim().toLowerCase();
  const scored = pool.map((w) => {
    const hay = new Set([...words(w.en), ...words(w.mr), ...words(romanizeMarathi(w.mr)), ...words(w.de)]);
    let hits = 0;
    for (const t of q) if (hay.has(t) || [...hay].some((h) => h.length > 3 && t.length > 3 && (h.startsWith(t) || t.startsWith(h)))) hits++;
    const exact = w.en.toLowerCase().replace(/[.!?]/g, "") === asked.replace(/[.!?]/g, "") ? 2 : 0;
    // Prefer phrases that cover the query, and don't drag in lots of extra words.
    const score = hits / q.length + exact - Math.max(0, hay.size - q.length) * 0.02;
    return { w, score, hits };
  });
  return scored
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.w);
}
