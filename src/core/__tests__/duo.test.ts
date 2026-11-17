import { allTopics, levelWords, LEVELS } from "../content/levels";
import { chunks, duoLesson, isQuestion, nextChunk, spellHint } from "../lib/duo";
import { seededRng } from "../lib/util";

describe("easy lessons", () => {
  it("splits units into small, even lessons", () => {
    expect(chunks(8)).toEqual([[0, 1, 2, 3], [4, 5, 6, 7]]);
    expect(chunks(6)).toEqual([[0, 1, 2], [3, 4, 5]]);
    expect(chunks(4)).toEqual([[0, 1, 2, 3]]);
    expect(chunks(5)).toEqual([[0, 1, 2], [3, 4]]);
    expect(chunks(0)).toEqual([]);
  });

  it("picks the next lesson from what you know", () => {
    expect(nextChunk(8, [])).toEqual({ part: 1, parts: 2, indexes: [0, 1, 2, 3] });
    expect(nextChunk(8, [0, 1, 2, 3])).toEqual({ part: 2, parts: 2, indexes: [4, 5, 6, 7] });
    expect(nextChunk(8, [0, 1, 2, 3, 4, 5, 6, 7])).toBeNull();
  });

  it("introduces each word before asking about it, and every answer is among the options", () => {
    const unit = allTopics()[0];
    const words = unit.words.slice(0, 4);
    const steps = duoLesson(words, levelWords(LEVELS[0]), "mr", seededRng(3));
    for (const w of words) {
      const intro = steps.findIndex((s) => s.kind === "intro" && s.word.de === w.de);
      const firstQ = steps.findIndex((s) => isQuestion(s) && "word" in s && s.word.de === w.de);
      expect(intro).toBeGreaterThanOrEqual(0);
      expect(intro).toBeLessThan(firstQ);
    }
    for (const s of steps) {
      if (s.kind === "pick" || s.kind === "listen") expect(s.options).toContain(s.answer);
      if (s.kind === "pick" && s.dir === "de-x") expect(s.options).toHaveLength(2);
      if (s.kind === "build") for (const t of s.answer) expect(s.tiles).toContain(t);
    }
    expect(steps.some((s) => s.kind === "match")).toBe(true);
    expect(steps.filter((s) => s.kind === "say")).toHaveLength(1);
    expect(steps.length).toBeLessThanOrEqual(22);
  });

  it("gives a first-letter hint for typing", () => {
    expect(spellHint("Schatz")).toBe("S · · · · ·");
    expect(spellHint("Gute Nacht")).toBe("G · · ·   N · · · ·");
  });
});
