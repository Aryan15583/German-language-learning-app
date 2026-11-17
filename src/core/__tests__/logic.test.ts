import { LEVELS, levelUnits } from "../content/levels";
import {
  applyPlacement,
  applyPractice,
  currentSubLevel,
  EXAM_PASS,
  examReady,
  freshState,
  isLocked,
  levelProgress,
  markKnown,
  migrate,
  placementContinues,
  placementLevel,
  recordExam,
  recordChat,
  recordUnitScore,
  setLang,
  streakToShow,
  subLevelProgress,
  UNIT_PASS,
  unitPassed,
  type AppState,
} from "../state/logic";

const A1 = LEVELS[0];
const passAllUnits = (s: AppState, levelIdx: number, partner: 0 | 1 = 0) =>
  levelUnits(LEVELS[levelIdx]).reduce((acc, u) => recordUnitScore(acc, partner, u.id, 1), s);

describe("streak", () => {
  it("starts at 1, grows on consecutive days and only counts once per day", () => {
    let s = applyPractice(freshState(), 0, 5, "2026-11-01", "2026-10-31");
    expect(s.streak).toEqual({ count: 1, last: "2026-11-01" });
    s = applyPractice(s, 1, 5, "2026-11-01", "2026-10-31");
    expect(s.streak.count).toBe(1);
    s = applyPractice(s, 1, 5, "2026-11-02", "2026-11-01");
    expect(s.streak.count).toBe(2);
  });

  it("resets after a missed day, and shows 0 once it has lapsed", () => {
    let s = applyPractice(freshState(), 0, 5, "2026-11-01", "2026-10-31");
    s = applyPractice(s, 0, 5, "2026-11-02", "2026-11-01");
    expect(streakToShow(s, "2026-11-03", "2026-11-02")).toBe(2);
    expect(streakToShow(s, "2026-11-04", "2026-11-03")).toBe(0);
    s = applyPractice(s, 0, 5, "2026-11-04", "2026-11-03");
    expect(s.streak.count).toBe(1);
  });

  it("adds XP only to the partner who practised and never subtracts", () => {
    let s = applyPractice(freshState(), 1, 30, "2026-11-01", "2026-10-31");
    s = applyPractice(s, 1, -10, "2026-11-01", "2026-10-31");
    expect(s.partners.map((p) => p.xp)).toEqual([0, 30]);
  });
});

describe("flashcards", () => {
  it("records each known word once", () => {
    let s = markKnown(freshState(), 0, "essen", 2);
    s = markKnown(s, 0, "essen", 2);
    s = markKnown(s, 0, "essen", 5);
    expect(s.partners[0].known.essen).toEqual([2, 5]);
    expect(s.partners[1].known.essen).toBeUndefined();
  });
});

describe("unit tests", () => {
  it("keeps the best score and passes at the pass mark", () => {
    let s = recordUnitScore(freshState(), 0, "essen", 0.5);
    expect(unitPassed(s.partners[0], "essen")).toBe(false);
    s = recordUnitScore(s, 0, "essen", UNIT_PASS);
    s = recordUnitScore(s, 0, "essen", 0.25);
    expect(s.partners[0].unitScores.essen).toBe(UNIT_PASS);
    expect(unitPassed(s.partners[0], "essen")).toBe(true);
  });

  it("tracks sub-level and level progress", () => {
    const [sub1, sub2] = A1.subLevels;
    let s = recordUnitScore(freshState(), 0, sub1.units[0].id, 1);
    expect(subLevelProgress(s.partners[0], sub1)).toEqual({ passed: 1, total: sub1.units.length, done: false });
    expect(currentSubLevel(s.partners[0]).id).toBe(sub1.id);

    s = sub1.units.reduce((acc, u) => recordUnitScore(acc, 0, u.id, 1), s);
    expect(subLevelProgress(s.partners[0], sub1).done).toBe(true);
    expect(currentSubLevel(s.partners[0]).id).toBe(sub2.id);
    expect(levelProgress(s.partners[0], A1).passed).toBe(sub1.units.length);
  });
});

describe("level exams", () => {
  it("opens only when every unit in the level is passed", () => {
    const s = freshState();
    expect(examReady(s.partners[0], A1)).toBe(false);
    expect(examReady(passAllUnits(s, 0).partners[0], A1)).toBe(true);
  });

  it("unlocks the next level when passed", () => {
    const s = recordExam(freshState(), 0, "A1", EXAM_PASS);
    expect(s.partners[0].unlocked).toBe(1);
    expect(s.partners[0].examsPassed).toEqual(["A1"]);
    expect(isLocked(s.partners[0], LEVELS[1])).toBe(false);
    expect(isLocked(s.partners[0], LEVELS[2])).toBe(true);
    expect(s.partners[1].unlocked).toBe(0);
  });

  it("does nothing when failed", () => {
    const before = freshState();
    expect(recordExam(before, 0, "A1", EXAM_PASS - 0.01)).toBe(before);
  });

  it("lets you test out of a higher level and never re-locks lower ones", () => {
    let s = recordExam(freshState(), 0, "B2", 1); // test out of B2 → C1 unlocked
    expect(s.partners[0].unlocked).toBe(4);
    s = recordExam(s, 0, "A1", 1);
    expect(s.partners[0].unlocked).toBe(4);
    expect(s.partners[0].examsPassed).toEqual(["B2", "A1"]);
  });

  it("caps at C2 and records the C2 pass once", () => {
    let s = recordExam(freshState(), 0, "C2", 1);
    s = recordExam(s, 0, "C2", 1);
    expect(s.partners[0].unlocked).toBe(LEVELS.length - 1);
    expect(s.partners[0].examsPassed).toEqual(["C2"]);
  });
});

describe("placement", () => {
  it("starts at the first level that was too hard", () => {
    expect(placementLevel([])).toBe(0);
    expect(placementLevel([1])).toBe(0);
    expect(placementLevel([4, 3, 2])).toBe(2);
    expect(placementLevel([4, 4, 4, 4, 4, 4])).toBe(LEVELS.length - 1);
  });

  it("continues while every level so far was passed", () => {
    expect(placementContinues([])).toBe(true);
    expect(placementContinues([4, 3])).toBe(true);
    expect(placementContinues([4, 2])).toBe(false);
    expect(placementContinues([4, 4, 4, 4, 4, 4])).toBe(false);
  });

  it("only ever raises the unlocked level", () => {
    let s = applyPlacement(freshState(), 1, 3);
    expect(s.partners[1].unlocked).toBe(3);
    s = applyPlacement(s, 1, 1);
    expect(s.partners[1].unlocked).toBe(3);
    expect(applyPlacement(freshState(), 0, 99).partners[0].unlocked).toBe(LEVELS.length - 1);
  });
});

describe("language and chat", () => {
  it("defaults to English and switches per partner", () => {
    const s = setLang(freshState(), 1, "mr");
    expect(s.partners.map((p) => p.lang)).toEqual(["en", "mr"]);
  });

  it("keeps the best chat stars", () => {
    let s = recordChat(freshState(), 0, "cafe", 2);
    s = recordChat(s, 0, "cafe", 1);
    expect(s.partners[0].chatStars.cafe).toBe(2);
    s = recordChat(s, 0, "cafe", 3);
    expect(s.partners[0].chatStars.cafe).toBe(3);
  });
});

describe("migrate", () => {
  it("returns a fresh state for missing or broken data", () => {
    const withoutIds = (x: ReturnType<typeof freshState>) => ({ ...x, partners: x.partners.map((p) => ({ ...p, id: "" })) });
    expect(withoutIds(migrate(null))).toEqual(withoutIds(freshState()));
    expect(withoutIds(migrate("nonsense"))).toEqual(withoutIds(freshState()));
  });

  it("upgrades data saved by the previous version", () => {
    const old = {
      partners: [
        { name: "Aryan", xp: 120, unlocked: 2, known: { essen: [1, 2] } },
        { name: "Mia", xp: 40, unlocked: 0, known: {} },
      ],
      learner: 1,
      streak: { count: 3, last: "2026-11-12" },
      duels: [{ title: "A1 mix", scores: [4, 5], date: "2026-11-12" }],
    };
    const s = migrate(old);
    expect(s.partners[0]).toMatchObject({ name: "Aryan", xp: 120, unlocked: 2, unitScores: {}, examsPassed: [], lang: "en", chatStars: {} });
    expect(s.partners[0].known.essen).toEqual([1, 2]);
    expect(s.learner).toBe(1);
    expect(s.streak.count).toBe(3);
    expect(s.duels).toHaveLength(1);
  });

  it("keeps a saved Marathi choice and ignores unknown languages", () => {
    const s = migrate({ partners: [{ lang: "mr" }, { lang: "klingon" }] });
    expect(s.partners.map((p) => p.lang)).toEqual(["mr", "en"]);
    expect(migrate({ partners: [{ lang: "mr-Latn" }, {}] }).partners[0].lang).toBe("mr-Latn");
  });

  it("clamps impossible level values", () => {
    const s = migrate({ partners: [{ unlocked: 42 }, { unlocked: -3 }] });
    expect(s.partners[0].unlocked).toBe(LEVELS.length - 1);
    expect(s.partners[1].unlocked).toBe(0);
  });
});
