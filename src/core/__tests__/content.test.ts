// Guards the course content so new words or units can't break the app.
import { allTopics, DIALOGUES, LEVEL_IDS, LEVELS, levelWords, NOTE_PARTS } from "../content/levels";

describe("course structure", () => {
  it("has the six CEFR levels in order", () => {
    expect(LEVEL_IDS).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
  });

  it.each(LEVELS.map((l) => [l.id, l] as const))("%s is split into numbered sub-levels with units", (id, level) => {
    expect(level.subLevels.length).toBeGreaterThanOrEqual(2);
    level.subLevels.forEach((sub, k) => {
      expect(sub.id).toBe(`${id}.${k + 1}`);
      expect(sub.title.trim()).not.toBe("");
      expect(sub.units.length).toBeGreaterThan(0);
    });
  });

  it("uses unique unit ids across the whole course", () => {
    const ids = allTopics().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a grammar tip for every unit", () => {
    for (const unit of allTopics()) {
      expect(unit.tip.title.trim()).not.toBe("");
      expect(unit.tip.body.length).toBeGreaterThan(20);
    }
  });

  it("gives every unit at least 4 words so quizzes have 4 options", () => {
    for (const unit of allTopics()) expect(unit.words.length).toBeGreaterThanOrEqual(4);
  });

  it("has enough words per level for a 12-question exam", () => {
    for (const level of LEVELS) expect(levelWords(level).length).toBeGreaterThanOrEqual(12);
  });

  it("has no empty or duplicated German within a level", () => {
    for (const level of LEVELS) {
      const words = levelWords(level);
      for (const w of words) {
        expect(w.de.trim()).not.toBe("");
        expect(w.en.trim()).not.toBe("");
      }
      const de = words.map((w) => w.de);
      expect(new Set(de).size).toBe(de.length);
    }
  });
});

describe("Marathi", () => {
  const devanagari = /[\u0900-\u097F]/;

  it("has a Marathi meaning in Devanagari for every word", () => {
    for (const w of LEVELS.flatMap(levelWords)) expect(w.mr).toMatch(devanagari);
  });

  it("has no duplicated Marathi meaning within a level, so quiz answers are unambiguous", () => {
    for (const level of LEVELS) {
      const mr = levelWords(level).map((w) => w.mr);
      expect(new Set(mr).size).toBe(mr.length);
    }
  });

  it("has a Marathi comparison note for every unit, in both languages", () => {
    for (const unit of allTopics()) {
      expect(unit.compare.en.length).toBeGreaterThan(20);
      expect(unit.compare.mr).toMatch(devanagari);
    }
  });

  it("translates every dialogue line and love-note phrase", () => {
    for (const line of DIALOGUES.flatMap((d) => d.lines)) expect(line.mr).toMatch(devanagari);
    for (const m of NOTE_PARTS.middles) expect(m.mr).toMatch(devanagari);
  });
});

describe("dialogues", () => {
  it("belong to real levels, have unique ids and alternate speakers", () => {
    const ids = DIALOGUES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DIALOGUES) {
      expect(LEVEL_IDS).toContain(d.level);
      expect(d.lines.length).toBeGreaterThanOrEqual(4);
      d.lines.forEach((line, k) => expect(line.who).toBe(k % 2 ? "b" : "a"));
    }
  });

  it("cover every level", () => {
    for (const id of LEVEL_IDS) expect(DIALOGUES.some((d) => d.level === id)).toBe(true);
  });
});

describe("love notes", () => {
  it("have options for every part", () => {
    expect(NOTE_PARTS.openers.length).toBeGreaterThan(0);
    expect(NOTE_PARTS.middles.length).toBeGreaterThan(0);
    expect(NOTE_PARTS.closers.length).toBeGreaterThan(0);
  });
});
