import { allTopics, LEVELS, levelWords, type Word } from "../content/levels";
import { canType, makeQuestions, MAX_TYPING_LENGTH } from "../lib/questions";
import { seededRng, shuffle } from "../lib/util";

const pool: Word[] = [
  { de: "Schatz", en: "darling", mr: "सोनू" },
  { de: "Hase", en: "bunny", mr: "ससा" },
  { de: "Kuss", en: "kiss", mr: "पापा" },
  { de: "Herz", en: "heart", mr: "हृदय" },
  { de: "Liebe", en: "love", mr: "प्रेम" },
  { de: "Ich vermisse dich so sehr jeden Tag", en: "I miss you so much every day", mr: "मला रोज तुझी खूप आठवण येते" },
];

describe("makeQuestions", () => {
  it("returns the requested number of questions, capped by the pool size", () => {
    expect(makeQuestions(pool, pool, { count: 4, rng: seededRng(1) })).toHaveLength(4);
    expect(makeQuestions(pool, pool, { count: 50, rng: seededRng(1) })).toHaveLength(pool.length);
  });

  it("never asks the same word twice", () => {
    const qs = makeQuestions(pool, pool, { count: pool.length, rng: seededRng(2) });
    expect(new Set(qs.map((q) => q.german)).size).toBe(qs.length);
  });

  it("builds 4 unique options that include the answer", () => {
    for (let seed = 0; seed < 25; seed++) {
      for (const q of makeQuestions(pool, pool, { count: 6, rng: seededRng(seed) })) {
        if (q.kind !== "choice") continue;
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
    }
  });

  it("matches prompt and answer to the direction", () => {
    for (const q of makeQuestions(pool, pool, { count: 6, rng: seededRng(3) })) {
      if (q.kind !== "choice") continue;
      const word = pool.find((w) => w.de === q.german)!;
      if (q.direction === "de-x") expect([q.prompt, q.answer]).toEqual([word.de, word.en]);
      else expect([q.prompt, q.answer]).toEqual([word.en, word.de]);
    }
  });

  it("makes no typing questions unless asked", () => {
    const qs = makeQuestions(pool, pool, { count: 6, rng: seededRng(4) });
    expect(qs.every((q) => q.kind === "choice")).toBe(true);
  });

  it("only turns short phrases into typing questions", () => {
    const qs = makeQuestions(pool, pool, { count: 6, typingShare: 1, rng: seededRng(5) });
    const typed = qs.filter((q) => q.kind === "type");
    expect(typed).toHaveLength(5); // the long sentence stays multiple choice
    for (const q of typed) {
      expect(q.answer.length).toBeLessThanOrEqual(MAX_TYPING_LENGTH);
      expect(q.prompt).toBe(pool.find((w) => w.de === q.answer)!.en);
    }
  });

  it("is repeatable with the same seed", () => {
    const a = makeQuestions(pool, pool, { count: 5, typingShare: 0.4, rng: seededRng(42) });
    const b = makeQuestions(pool, pool, { count: 5, typingShare: 0.4, rng: seededRng(42) });
    expect(a).toEqual(b);
  });

  it("builds valid questions for every unit and level in the course", () => {
    for (const level of LEVELS) {
      const words = levelWords(level);
      const qs = makeQuestions(words, words, { count: 12, typingShare: 1 / 3, rng: seededRng(7) });
      expect(qs).toHaveLength(12);
    }
    for (const unit of allTopics()) {
      const qs = makeQuestions(unit.words, unit.words, { count: 8, rng: seededRng(8) });
      for (const q of qs) if (q.kind === "choice") expect(new Set(q.options).size).toBe(4);
    }
  });
});

describe("Marathi", () => {
  it("asks for Marathi meanings when the learner chose Marathi", () => {
    const qs = makeQuestions(pool, pool, { count: 6, typingShare: 0.5, lang: "mr", rng: seededRng(11) });
    for (const q of qs) {
      const word = pool.find((w) => w.de === q.german)!;
      if (q.kind === "type") expect(q.prompt).toBe(word.mr);
      else if (q.direction === "de-x") {
        expect(q.answer).toBe(word.mr);
        for (const o of q.options) expect(pool.map((w) => w.mr)).toContain(o);
      } else expect(q.prompt).toBe(word.mr);
    }
  });

  it("asks the same words in the same order for both languages with the same seed", () => {
    const en = makeQuestions(pool, pool, { count: 5, lang: "en", rng: seededRng(12) });
    const mr = makeQuestions(pool, pool, { count: 5, lang: "mr", rng: seededRng(12) });
    expect(mr.map((q) => q.german)).toEqual(en.map((q) => q.german));
  });
});

describe("canType", () => {
  it("skips long phrases and templates with an ellipsis", () => {
    expect(canType({ de: "Prost!", en: "Cheers!", mr: "चिअर्स!" })).toBe(true);
    expect(canType({ de: "Ich könnte mir vorstellen, …", en: "I could imagine …", mr: "मी कल्पना करू शकतो की …" })).toBe(false);
  });
});

describe("shuffle", () => {
  it("keeps every element and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seededRng(9));
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
