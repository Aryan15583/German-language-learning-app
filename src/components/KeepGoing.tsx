import { router } from "expo-router";
import { Text } from "react-native";
import { nextStep, stepHref, stepLabel } from "../lib/path";
import { usePalette } from "../lib/theme";
import { useProgress } from "../state/progress";
import { BigButton, Card, T } from "./ui";

/** After finishing something: show what's next and one big button to go there. */
export function KeepGoing() {
  const c = usePalette();
  const { state } = useProgress();
  const step = nextStep(state.partners[state.learner]);
  const label = stepLabel(step);
  return (
    <Card style={{ alignItems: "center" }}>
      <T muted style={{ fontWeight: "700" }}>Next up</T>
      <Text style={{ fontSize: 44 }}>{label.emoji}</Text>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: "900", textAlign: "center" }}>{label.title}</Text>
      <BigButton title="▶  Keep going" onPress={() => router.replace(stepHref(step))} color={c.good} large />
    </Card>
  );
}
