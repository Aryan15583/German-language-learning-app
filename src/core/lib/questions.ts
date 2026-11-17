import { meaning, type Lang, type Word } from "../content/levels";
import { shuffle, type Rng } from "./util";

export type ChoiceQuestion = {
  kind: "choice";
  /** "de-x": German prompt, pick the meaning. "x-de": the reverse. */
  direction: "de-x" | "x-de";
  prompt: string;
  answer: string;
  options: string[];
  german: string;
  /** Which word this practises (for spaced repetition); defaults to `german`. */
  key?: string;
};

export type TypeQuestion = {
  kind: "type";
  prompt: string; // meaning in the learner's language
  answer: string; // German
  german: string;
  key?: string;
};

/** Hear it, then pick what you heard. */
export type ListenQuestion = { kind: "listen"; prompt: string; answer: string; options: string[]; german: string; key?: string };

/** Fill the gap in a real sentence. `prompt` has "___"; `hint` is its translation. */
export type ClozeQuestion = { kind: "cloze"; prompt: string; hint: string; answer: string; options: string[]; german: string; key?: string };

/** See it, hear it, say it out loud (self-checked). */
export type SayQuestion = { kind: "say"; prompt: string; answer: string; german: string; key?: string };

export type Question = ChoiceQuestion | TypeQuestion | ListenQuestion | ClozeQuestion | SayQuestion;

/** The word a question practises. */
export const questionKey = (q: Question) => q.key ?? q.german;

export type QuestionOptions = {
  count: number;
  /** Share of questions (0–1) that ask you to type the German. */
  typingShare?: number;
  /** Language the meanings are shown in (default English). */
  lang?: Lang;
  rng?: Rng;
  /** Force one direction (e.g. translation duels: German → your language). */
  direction?: "de-x" | "x-de";
};

/** Typing long sentences on a phone isn't fun; only short phrases become typing questions. */
export const MAX_TYPING_LENGTH = 24;

export const canType = (w: Word) => w.de.length <= MAX_TYPING_LENGTH && !w.de.includes("…");

/**
 * Build a quiz from a pool of words. Wrong options come from `distractors`
 * (usually the whole level) so they're plausible, and never duplicate the answer.
 */
export function makeQuestions(pool: readonly Word[], distractors: readonly Word[], opts: QuestionOptions): Question[] {
  const rng = opts.rng ?? Math.random;
  const lang = opts.lang ?? "en";
  const picked = shuffle(pool, rng).slice(0, opts.count);
  let typingLeft = Math.round(picked.length * (opts.typingShare ?? 0));

  return picked.map((w): Question => {
    if (typingLeft > 0 && canType(w)) {
      typingLeft--;
      return { kind: "type", prompt: meaning(w, lang), answer: w.de, german: w.de };
    }
    const coin = rng() < 0.5 ? "de-x" : "x-de";
    const direction = opts.direction ?? coin;
    const side = (x: Word) => (direction === "de-x" ? meaning(x, lang) : x.de);
    const answer = side(w);
    const wrong: string[] = [];
    for (const d of shuffle(distractors, rng)) {
      const text = side(d);
      if (text !== answer && !wrong.includes(text)) wrong.push(text);
      if (wrong.length === 3) break;
    }
    return {
      kind: "choice",
      direction,
      prompt: direction === "de-x" ? w.de : meaning(w, lang),
      answer,
      options: shuffle([answer, ...wrong], rng),
      german: w.de,
    };
  });
}
