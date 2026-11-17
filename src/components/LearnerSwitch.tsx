import { couple, partnerName, useProgress, type PartnerIndex } from "../web/progress";
import { Chip } from "./ui";

/** On one shared phone: choose who is learning. Hidden with accounts or linked phones. */
export function LearnerSwitch() {
  const { state, setLearner, accountMode } = useProgress();
  if (accountMode || couple.isLinked(state) || !state.partners[1].name) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Who is learning?">
      <span className="text-sm text-muted">Who’s learning?</span>
      {([0, 1] as PartnerIndex[]).map((i) => (
        <Chip key={i} selected={state.learner === i} onClick={() => setLearner(i)}>
          {partnerName(state, i)}
        </Chip>
      ))}
    </div>
  );
}
