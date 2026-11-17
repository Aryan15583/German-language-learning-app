// "What should I do next?" — one clear answer, so learners never have to choose.
// For each unit: learn its words (see + hear), practise them (say, type, use), then the quiz.
// When every unit is done, take the level's big test. Then the next level.
// If many words are due for review, a short smart review comes first.
import { LEVELS, levelUnits, type Level, type Topic } from "../content/levels";
import { examReady, knownInUnit, unitPassed, type Partner } from "../state/logic";
import { dueKeys } from "./srs";

export type NextStep =
  | { kind: "learn"; unit: Topic; level: Level }
  | { kind: "practice"; unit: Topic; level: Level }
  | { kind: "quiz"; unit: Topic; level: Level }
  | { kind: "test"; level: Level }
  | { kind: "smart"; count: number; level: Level }
  | { kind: "review"; unit: Topic; level: Level };

/** A unit's place on the learning path. */
export type UnitState = "done" | "next" | "open";

/** When this many words are waiting, the Start button suggests a review first. */
export const REVIEW_NUDGE = 8;

export function nextStep(p: Partner, day = 0, today?: string): NextStep {
  const level = LEVELS[p.unlocked];
  if (today) {
    const due = dueKeys(p.memory, today).length;
    if (due >= REVIEW_NUDGE) return { kind: "smart", count: due, level };
  }
  const units = levelUnits(level);
  for (const unit of units) {
    if (unitPassed(p, unit.id)) continue;
    if (knownInUnit(p, unit.id) < unit.words.length) return { kind: "learn", unit, level };
    if (!p.practised.includes(unit.id)) return { kind: "practice", unit, level };
    return { kind: "quiz", unit, level };
  }
  if (!p.examsPassed.includes(level.id) && examReady(p, level)) return { kind: "test", level };
  // Everything here is done (e.g. C2 passed): keep words fresh with a daily review.
  return { kind: "review", unit: units[day % units.length], level };
}

export function unitState(p: Partner, unit: Topic): UnitState {
  if (unitPassed(p, unit.id)) return "done";
  const step = nextStep(p);
  return (step.kind === "learn" || step.kind === "practice" || step.kind === "quiz") && step.unit.id === unit.id ? "next" : "open";
}

/** Short, friendly words for the big Start button. */
export function stepLabel(step: NextStep): { title: string; detail: string; emoji: string } {
  switch (step.kind) {
    case "learn":
      return { title: step.unit.title, detail: `Learn ${step.unit.words.length} words · about 3 min`, emoji: step.unit.emoji };
    case "practice":
      return { title: `Practise: ${step.unit.title}`, detail: "Hear it, say it, type it, use it · about 3 min", emoji: "🗣️" };
    case "quiz":
      return { title: `${step.unit.title} quiz`, detail: "8 easy questions · about 2 min", emoji: "✏️" };
    case "test":
      return { title: `${step.level.id} big test`, detail: "Pass it to open the next level", emoji: "🎓" };
    case "smart":
      return { title: "Smart review", detail: `${step.count} words need your attention · about 3 min`, emoji: "💡" };
    case "review":
      return { title: `Review: ${step.unit.title}`, detail: "Keep your words fresh", emoji: "🔁" };
  }
}

/** Where the big Start button goes (one page per screen; the item in ?id=). */
export function stepHref(step: NextStep): string {
  switch (step.kind) {
    case "learn":
    case "review":
      return `/lesson?id=${step.unit.id}`;
    case "practice":
      return `/practice?id=${step.unit.id}`;
    case "quiz":
      return `/quiz?id=${step.unit.id}`;
    case "test":
      return `/exam?id=${step.level.id}`;
    case "smart":
      return "/review";
  }
}
