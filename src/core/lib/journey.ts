// The road from Mumbai to Berlin: where are we, what's unlocked, which postcards we have.
import { JOURNEY, type JourneyStop } from "../content/berlin";
import { allTopics } from "../content/levels";
import { unitPassed, type Partner } from "../state/logic";

export const unitsPassedBy = (p: Partner) => allTopics().filter((u) => unitPassed(p, u.id)).length;

/** Journey points: lessons passed — as a couple, the average of you two. */
export const journeyPoints = (mine: number, theirs: number | null) => (theirs === null ? mine : Math.floor((mine + theirs) / 2));

export type StopState = "locked" | "open" | "explored";

export const stopExplored = (p: Partner, stop: JourneyStop) => unitPassed(p, `berlin-${stop.id}`);

export function stopState(p: Partner, stop: JourneyStop, points: number): StopState {
  if (stopExplored(p, stop)) return "explored";
  return points >= stop.need ? "open" : "locked";
}

/** Index of the last stop you've reached (-1 = still in Mumbai). */
export const reachedIndex = (points: number) => JOURNEY.reduce((at, s, k) => (points >= s.need ? k : at), -1);

/** 0–1 along the route to Berlin. */
export const routeShare = (points: number) => Math.min(1, points / JOURNEY[JOURNEY.length - 1].need);

export const postcards = (p: Partner) => JOURNEY.filter((s) => stopExplored(p, s));

/** The next stop still to reach, with how many lessons to go. */
export function nextStop(points: number): { stop: JourneyStop; toGo: number } | null {
  const stop = JOURNEY.find((s) => points < s.need);
  return stop ? { stop, toGo: stop.need - points } : null;
}
