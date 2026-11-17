import { LEVELS, levelUnits } from "../content/levels";
import { nextStep, stepHref, stepLabel, unitState } from "../lib/path";
import { applyPlacement, freshState, markKnown, recordExam, recordUnitScore, type AppState } from "../state/logic";

const A1 = LEVELS[0];
const [u1, u2] = levelUnits(A1);
const learnAll = (s: AppState, unitId: string, n: number) => Array.from({ length: n }, (_, i) => i).reduce((acc, i) => markKnown(acc, 0, unitId, i), s);

describe("next step", () => {
  it("starts by learning the first unit's words", () => {
    const step = nextStep(freshState().partners[0]);
    expect(step).toMatchObject({ kind: "learn", unit: { id: u1.id } });
    expect(stepHref(step)).toEqual({ pathname: "/lesson/[topicId]", params: { topicId: u1.id } });
  });

  it("keeps learning until every word of the unit is known", () => {
    const s = learnAll(freshState(), u1.id, u1.words.length - 1);
    expect(nextStep(s.partners[0])).toMatchObject({ kind: "learn", unit: { id: u1.id } });
  });

  it("then asks for the unit's quiz", () => {
    const s = learnAll(freshState(), u1.id, u1.words.length);
    const step = nextStep(s.partners[0]);
    expect(step).toMatchObject({ kind: "quiz", unit: { id: u1.id } });
    expect(stepHref(step).pathname).toBe("/quiz/[topicId]");
  });

  it("moves to the next unit once the quiz is passed", () => {
    const s = recordUnitScore(learnAll(freshState(), u1.id, u1.words.length), 0, u1.id, 1);
    expect(nextStep(s.partners[0])).toMatchObject({ kind: "learn", unit: { id: u2.id } });
  });

  it("asks for the big test after every unit is passed", () => {
    const s = levelUnits(A1).reduce((acc, u) => recordUnitScore(acc, 0, u.id, 1), freshState());
    const step = nextStep(s.partners[0]);
    expect(step).toMatchObject({ kind: "test", level: { id: "A1" } });
    expect(stepHref(step)).toEqual({ pathname: "/exam/[levelId]", params: { levelId: "A1" } });
  });

  it("goes on to the next level after the big test", () => {
    let s = levelUnits(A1).reduce((acc, u) => recordUnitScore(acc, 0, u.id, 1), freshState());
    s = recordExam(s, 0, "A1", 1);
    expect(nextStep(s.partners[0])).toMatchObject({ kind: "learn", level: { id: "A2" } });
  });

  it("starts where placement put you", () => {
    const s = applyPlacement(freshState(), 0, 3);
    expect(nextStep(s.partners[0])).toMatchObject({ kind: "learn", level: { id: "B2" } });
  });

  it("offers a daily review once everything is done", () => {
    let s = applyPlacement(freshState(), 0, LEVELS.length - 1);
    const C2 = LEVELS[LEVELS.length - 1];
    s = levelUnits(C2).reduce((acc, u) => recordUnitScore(acc, 0, u.id, 1), s);
    s = recordExam(s, 0, "C2", 1);
    const a = nextStep(s.partners[0], 0);
    const b = nextStep(s.partners[0], 1);
    expect(a.kind).toBe("review");
    expect(a.kind === "review" && b.kind === "review" && a.unit.id !== b.unit.id).toBe(true);
  });
});

describe("path bubbles", () => {
  it("marks done, next and open units", () => {
    const s = recordUnitScore(learnAll(freshState(), u1.id, u1.words.length), 0, u1.id, 1);
    expect(unitState(s.partners[0], u1)).toBe("done");
    expect(unitState(s.partners[0], u2)).toBe("next");
    expect(unitState(s.partners[0], levelUnits(A1)[3])).toBe("open");
  });
});

describe("labels", () => {
  it("are short and friendly", () => {
    expect(stepLabel(nextStep(freshState().partners[0]))).toMatchObject({ title: u1.title, detail: expect.stringContaining("Learn 8 words") });
  });
});
