// Real sentences from the course, for word-order, listening, cloze and couple games.
import { JOURNEY } from "../content/berlin";
import { CHATS } from "../content/chats";
import { COMPARISONS, PHRASEBOOK } from "../content/extras";
import { DIALOGUES, LEVEL_IDS, type LevelId, type Word } from "../content/levels";
import { shuffle, type Rng } from "./util";

export type Sentence = { de: string; en: string; mr: string; level: LevelId };

/** One sentence (no full stop in the middle), at least two words. */
const isSentence = (de: string) => /[.!?]$/.test(de.trim()) && !/[.!?]\s/.test(de.trim()) && de.trim().split(/\s+/).length >= 2;

let cache: Sentence[] | null = null;
/** Every German sentence the app has, with its translation and level. Deduplicated. */
export function sentencePool(): Sentence[] {
  if (cache) return cache;
  const out = new Map<string, Sentence>();
  const add = (s: Sentence) => {
    if (isSentence(s.de) && !out.has(s.de)) out.set(s.de, s);
  };
  for (const d of DIALOGUES) for (const l of d.lines) add({ de: l.de, en: l.en, mr: l.mr, level: d.level });
  for (const c of CHATS)
    for (const st of c.steps) {
      add({ ...st.bot, level: c.level });
      for (const rep of st.replies) if (rep.ok) add({ de: rep.de, en: rep.en, mr: rep.mr, level: c.level });
    }
  for (const s of JOURNEY) for (const w of s.words) add({ ...w, level: s.level });
  // Short everyday comparisons ("Ich habe Hunger.") are A1 material; longer ones A2.
  for (const c of COMPARISONS) add({ de: c.de, en: c.en, mr: c.mr, level: c.de.split(/\s+/).length <= 5 ? "A1" : "A2" });
  for (const p of PHRASEBOOK) add({ ...p, level: "A2" });
  cache = [...out.values()];
  return cache;
}

/** Words of a sentence, without punctuation: tiles for the word builder. */
export const tokens = (de: string) =>
  de
    .replace(/[„“"«»]/g, "")
    .split(/\s+/)
    .map((t) => t.replace(/[.,!?;:…]+$/g, ""))
    .filter(Boolean);

/** The sentence's closing punctuation, shown after the tiles. */
export const endMark = (de: string) => de.trim().match(/[.!?]$/)?.[0] ?? "";

/** Sentences up to a level, with a sensible number of words. */
export function sentencesFor(maxLevel: LevelId, minWords = 3, maxWords = 9): Sentence[] {
  const max = LEVEL_IDS.indexOf(maxLevel);
  return sentencePool().filter((s) => {
    const n = tokens(s.de).length;
    return LEVEL_IDS.indexOf(s.level) <= max && n >= minWords && n <= maxWords;
  });
}

export const pickSentences = (pool: Sentence[], n: number, rng: Rng = Math.random) => shuffle(pool, rng).slice(0, n);

/** Tiles in a shuffled order that isn't already the answer (when that's possible). */
export function shuffledTiles(de: string, rng: Rng = Math.random): string[] {
  const t = tokens(de);
  if (new Set(t).size < 2) return t;
  for (let k = 0; k < 8; k++) {
    const s = shuffle(t, rng);
    if (s.join(" ") !== t.join(" ")) return s;
  }
  return [...t].reverse();
}

export const orderCorrect = (built: readonly string[], de: string) => built.join(" ") === tokens(de).join(" ");

const ARTICLE = /^(der|die|das|den|dem|des|ein|eine|einen)\s+/i;
const core = (de: string) => de.replace(ARTICLE, "").replace(/[.,!?;:…]+$/g, "").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type Cloze = { prompt: string; answer: string; sentence: Sentence };

/** A real sentence that uses this word, with the word blanked out: "Ich habe meinen Schlüssel ___." */
export function clozeFor(word: Word, pool: Sentence[] = sentencePool()): Cloze | null {
  const c = core(word.de);
  if (!c || c.length < 3) return null;
  const re = new RegExp(`(^|[\\s„"(])(${escapeRe(c)})(?=$|[\\s.,!?;:“"])`, "i");
  for (const s of pool) {
    if (core(s.de).toLowerCase() === c.toLowerCase()) continue;
    const m = s.de.match(re);
    if (m && m.index !== undefined) {
      const start = m.index + m[1].length;
      return { prompt: s.de.slice(0, start) + "___" + s.de.slice(start + m[2].length), answer: m[2], sentence: s };
    }
  }
  return null;
}

/** Blank out one meaningful word of a sentence (for listening and "complete my sentence"). */
export function blankWord(de: string, rng: Rng = Math.random): { prompt: string; answer: string; index: number } {
  const t = tokens(de);
  const candidates = t.map((w, i) => ({ w, i })).filter(({ w, i }) => w.length >= 3 && (i > 0 || t.length < 3));
  const pick = candidates.length ? candidates[Math.floor(rng() * candidates.length)] : { w: t[0], i: 0 };
  const shown = t.map((w, i) => (i === pick.i ? "___" : w)).join(" ") + endMark(de);
  return { prompt: shown, answer: pick.w, index: pick.i };
}

/** Other words to choose from, taken from other sentences. */
export function wordOptions(answer: string, pool: Sentence[], rng: Rng = Math.random, n = 3): string[] {
  const seen = new Set([answer.toLowerCase()]);
  const out: string[] = [];
  for (const s of shuffle(pool, rng))
    for (const w of tokens(s.de)) {
      if (out.length >= n) break;
      if (w.length >= 3 && !seen.has(w.toLowerCase())) {
        seen.add(w.toLowerCase());
        out.push(w);
        break;
      }
    }
  return shuffle([answer, ...out], rng);
}
