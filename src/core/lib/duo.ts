// Super-easy, Duolingo-style lessons: a few new words at a time, tiny steps,
// lots of tapping and very little typing. Mistakes come back at the end.
import { meaning, type Lang, type Word } from "../content/levels";
import { tokens } from "./sentences";
import { shuffle, type Rng } from "./util";

export type DuoStep =
  | { kind: "intro"; word: Word }
  | { kind: "pick"; word: Word; dir: "de-x" | "x-de"; prompt: string; options: string[]; answer: string }
  | { kind: "match"; pairs: { de: string; x: string }[] }
  | { kind: "listen"; word: Word; options: string[]; answer: string }
  | { kind: "build"; word: Word; tiles: string[]; answer: string[] }
  | { kind: "spell"; word: Word; prompt: string; answer: string; hint: string }
  | { kind: "say"; word: Word };

/** How a unit's words are split into small lessons: at most 4 new words each, as even as possible. */
export function chunks(n: number, size = 4): number[][] {
  if (n <= 0) return [];
  const count = Math.ceil(n / size);
  const per = Math.ceil(n / count);
  return Array.from({ length: count }, (_, c) => Array.from({ length: Math.min(per, n - c * per) }, (_, k) => c * per + k)).filter((x) => x.length);
}

/** The next small lesson in a unit: the first one with words you don't know yet. */
export function nextChunk(n: number, known: readonly number[]): { part: number; parts: number; indexes: number[] } | null {
  const all = chunks(n);
  const k = all.findIndex((c) => c.some((i) => !known.includes(i)));
  return k < 0 ? null : { part: k + 1, parts: all.length, indexes: all[k] };
}

/** Short enough to type comfortably (with a first-letter hint). */
const spellable = (w: Word) => w.de.length <= 14 && !/[.!?…,]/.test(w.de);

const isPhrase = (w: Word) => tokens(w.de).length >= 2 && tokens(w.de).length <= 7;

/** The first letter of each word, the rest as dots: "S · · · · ·". */
export function spellHint(de: string): string {
  return de
    .split(" ")
    .map((w) => w[0] + " ·".repeat(Math.max(0, w.length - 1)))
    .join("   ");
}

function options(answer: string, from: readonly string[], n: number, rng: Rng): string[] {
  const wrong = shuffle(
    from.filter((x) => x !== answer),
    rng,
  ).filter((x, i, a) => a.indexOf(x) === i);
  return shuffle([answer, ...wrong.slice(0, n - 1)], rng);
}

/**
 * One small lesson. `words` are the new words; `others` give extra wrong answers.
 * Order: meet each word (+ a 2-choice check) → match the pairs → listen / build / spell each → say one.
 */
export function duoLesson(words: readonly Word[], others: readonly Word[], lang: Lang, rng: Rng = Math.random): DuoStep[] {
  const m = (w: Word) => meaning(w, lang);
  const pool = [...words, ...others];
  const steps: DuoStep[] = [];
  for (const w of words) {
    steps.push({ kind: "intro", word: w });
    steps.push({ kind: "pick", word: w, dir: "de-x", prompt: w.de, answer: m(w), options: options(m(w), pool.map(m), 2, rng) });
  }
  if (words.length >= 2) steps.push({ kind: "match", pairs: shuffle(words, rng).slice(0, 4).map((w) => ({ de: w.de, x: m(w) })) });
  shuffle(words, rng).forEach((w, k) => {
    if (k % 2 === 0) steps.push({ kind: "listen", word: w, answer: w.de, options: options(w.de, pool.map((x) => x.de), 3, rng) });
    if (isPhrase(w)) {
      const answer = tokens(w.de);
      const extra = shuffle(
        pool.flatMap((x) => tokens(x.de)).filter((t) => !answer.includes(t)),
        rng,
      ).filter((t, i, a) => a.indexOf(t) === i);
      steps.push({ kind: "build", word: w, answer, tiles: shuffle([...answer, ...extra.slice(0, 2)], rng) });
    } else if (spellable(w)) {
      steps.push({ kind: "spell", word: w, prompt: m(w), answer: w.de, hint: spellHint(w.de) });
    } else {
      steps.push({ kind: "pick", word: w, dir: "x-de", prompt: m(w), answer: w.de, options: options(w.de, pool.map((x) => x.de), 3, rng) });
    }
  });
  if (words.length) steps.push({ kind: "say", word: words[Math.floor(rng() * words.length)] });
  return steps;
}

/** Steps that count as questions (intro and say don't). */
export const isQuestion = (s: DuoStep) => s.kind !== "intro" && s.kind !== "say";
