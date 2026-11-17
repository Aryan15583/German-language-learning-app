import { Play } from "lucide-react";
import { nextStep, stepLabel } from "../core/lib/path";
import { hrefOf } from "../web/nav";
import { useProgress } from "../web/progress";
import { Button, Card } from "./ui";

/** After finishing something: what's next, and one big button to go there. */
export function KeepGoing() {
  const { state } = useProgress();
  const step = nextStep(state.partners[state.learner]);
  const label = stepLabel(step);
  return (
    <Card className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold text-muted">Next up</p>
      <p className="text-5xl">{label.emoji}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{label.title}</p>
      <Button href={hrefOf(step)} variant="good" size="lg" full className="mt-4">
        <Play size={20} fill="currentColor" /> Keep going
      </Button>
    </Card>
  );
}
