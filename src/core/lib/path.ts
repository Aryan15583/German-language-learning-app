// "What should I do next?" — one clear answer, so learners never have to choose.
// Order inside a level: for each unit, learn its words, then take its quiz.
// When every unit is done, take the level's big test. Then the next level.
import { LEVELS, levelUnits, type Level, type Topic } from "../content/levels";
import { examReady, knownInUnit, unitPassed, type Partner } from "../state/logic";

export type NextStep =
  | { kind: "learn"; unit: Topic; level: Level }
  | { kind: "quiz"; unit: Topic; level: Level }
  | { kind: "test"; level: Level }
  | { kind: "review"; unit: Topic; level: Level };

/** A unit's place on the learning path. */
export type UnitState = "done" | "next" | "open";

export function nextStep(p: Partner, day = 0): NextStep {
  const level = LEVELS[p.unlocked];
  const units = levelUnits(level);
  for (const unit of units) {
    if (unitPassed(p, unit.id)) continue;
    if (knownInUnit(p, unit.id) < unit.words.length) return { kind: "learn", unit, level };
    return { kind: "quiz", unit, level };
  }
  if (!p.examsPassed.includes(level.id) && examReady(p, level)) return { kind: "test", level };
  // Everything here is done (e.g. C2 passed): keep words fresh with a daily review.
  return { kind: "review", unit: units[day % units.length], level };
}

export function unitState(p: Partner, unit: Topic): UnitState {
  if (unitPassed(p, unit.id)) return "done";
  const step = nextStep(p);
  return (step.kind === "learn" || step.kind === "quiz") && step.unit.id === unit.id ? "next" : "open";
}

/** Short, friendly words for the big Start button. */
export function stepLabel(step: NextStep): { title: string; detail: string; emoji: string } {
  switch (step.kind) {
    case "learn":
      return { title: step.unit.title, detail: `Learn ${step.unit.words.length} words · about 3 min`, emoji: step.unit.emoji };
    case "quiz":
      return { title: `${step.unit.title} quiz`, detail: "8 easy questions · about 2 min", emoji: "✏️" };
    case "test":
      return { title: `${step.level.id} big test`, detail: "Pass it to open the next level", emoji: "🎓" };
    case "review":
      return { title: `Review: ${step.unit.title}`, detail: "Keep your words fresh", emoji: "🔁" };
  }
}

/** Where the big Start button goes. */
export function stepHref(step: NextStep) {
  switch (step.kind) {
    case "learn":
    case "review":
      return { pathname: "/lesson/[topicId]" as const, params: { topicId: step.unit.id } };
    case "quiz":
      return { pathname: "/quiz/[topicId]" as const, params: { topicId: step.unit.id } };
    case "test":
      return { pathname: "/exam/[levelId]" as const, params: { levelId: step.level.id } };
  }
}
