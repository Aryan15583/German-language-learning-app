// See it → hear it → say it → type it → use it.
// One exercise per word, rotating through the ways of practising, so every lesson
// makes you retrieve and use the words — not just recognise them.
import { meaning, type Lang, type Word } from "../content/levels";
import { canType, makeQuestions, type Question } from "./questions";
import { clozeFor, sentencePool, type Sentence } from "./sentences";
import { shuffle, type Rng } from "./util";

const germanOptions = (w: Word, others: readonly Word[], rng: Rng) => {
  const wrong: string[] = [];
  for (const d of shuffle(others, rng)) {
    if (d.de !== w.de && !wrong.includes(d.de)) wrong.push(d.de);
    if (wrong.length === 3) break;
  }
  return shuffle([w.de, ...wrong], rng);
};

export function listenQuestion(w: Word, others: readonly Word[], rng: Rng): Question {
  return { kind: "listen", prompt: w.de, answer: w.de, options: germanOptions(w, others, rng), german: w.de, key: w.de };
}

/** A gap-fill in a real sentence, if the course has one for this word. */
export function clozeQuestion(w: Word, lang: Lang, others: readonly Word[], rng: Rng, pool: Sentence[] = sentencePool()): Question | null {
  const c = clozeFor(w, pool);
  if (!c) return null;
  const wrong: string[] = [];
  for (const d of shuffle(others, rng)) {
    const t = d.de.replace(/^(der|die|das)\s+/i, "").replace(/[.!?]$/, "");
    if (t.toLowerCase() !== c.answer.toLowerCase() && !wrong.includes(t) && !t.includes(" ")) wrong.push(t);
    if (wrong.length === 3) break;
  }
  return { kind: "cloze", prompt: c.prompt, hint: meaning(c.sentence, lang), answer: c.answer, options: shuffle([c.answer, ...wrong], rng), german: c.sentence.de, key: w.de };
}

/** One exercise per word: listen, say, type, use — in turn. */
export function practiceSet(words: readonly Word[], others: readonly Word[], lang: Lang, rng: Rng = Math.random): Question[] {
  const kinds = ["listen", "say", "type", "use"] as const;
  return shuffle(words, rng).map((w, k): Question => {
    const kind = kinds[k % kinds.length];
    if (kind === "say") return { kind: "say", prompt: meaning(w, lang), answer: w.de, german: w.de, key: w.de };
    if (kind === "type" && canType(w)) return { kind: "type", prompt: meaning(w, lang), answer: w.de, german: w.de, key: w.de };
    if (kind === "use") {
      const c = clozeQuestion(w, lang, others, rng);
      if (c) return c;
      return { ...makeQuestions([w], others, { count: 1, lang, rng, direction: "x-de" })[0], key: w.de };
    }
    return listenQuestion(w, others, rng);
  });
}

/** Smart review: test due words in a new way each time — in context when we can. */
export function reviewSet(words: readonly Word[], others: readonly Word[], lang: Lang, rng: Rng = Math.random): Question[] {
  return words.map((w, k): Question => {
    if (k % 3 === 0) {
      const c = clozeQuestion(w, lang, others, rng);
      if (c) return c;
    }
    if (k % 3 === 1 && canType(w)) return { kind: "type", prompt: meaning(w, lang), answer: w.de, german: w.de, key: w.de };
    if (k % 3 === 2) return listenQuestion(w, others, rng);
    return { ...makeQuestions([w], others, { count: 1, lang, rng })[0], key: w.de };
  });
}
