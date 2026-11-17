import * as C from "../core/state/couple";
import { journeyPoints, unitsPassedBy } from "../core/lib/journey";
import type { AppState } from "../core/state/logic";

/** Journey points for this device: you, or you two together (averaged). */
export function couplePoints(s: AppState, accountMode: boolean): { points: number; together: boolean } {
  const me = s.partners[s.learner];
  const mine = unitsPassedBy(me);
  const otherIdx = s.learner === 0 ? 1 : 0;
  const linked = C.isLinked(s);
  const shared = !accountMode && !!s.partners[otherIdx].name;
  if (linked) return { points: journeyPoints(mine, s.partners[1].remote?.unitsPassed ?? 0), together: true };
  if (shared) return { points: journeyPoints(mine, unitsPassedBy(s.partners[otherIdx])), together: true };
  return { points: mine, together: false };
}
