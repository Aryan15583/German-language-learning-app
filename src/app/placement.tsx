import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Quiz } from "../components/Quiz";
import { Button, Card, H1, LearnerSwitch, PartnerName, Row, Screen, T } from "../components/ui";
import { LEVELS, levelWords } from "../content/levels";
import { makeQuestions } from "../lib/questions";
import { partnerColor, usePalette } from "../lib/theme";
import { PLACEMENT_PASS, PLACEMENT_QUESTIONS, placementContinues, placementLevel, useProgress } from "../state/progress";

const questionsFor = (levelIdx: number) => {
  const words = levelWords(LEVELS[levelIdx]);
  return makeQuestions(words, words, { count: PLACEMENT_QUESTIONS });
};

/** Adaptive placement: a few questions per level, moving up until a level is too hard. */
export default function Placement() {
  const c = usePalette();
  const { state, applyPlacement } = useProgress();
  const learner = state.learner;
  const [phase, setPhase] = useState<"intro" | "test" | "done">("intro");
  const [results, setResults] = useState<number[]>([]);
  const [questions, setQuestions] = useState(() => questionsFor(0));

  const levelIdx = results.length;
  const header = <Stack.Screen options={{ title: "Placement test" }} />;

  if (phase === "intro") {
    return (
      <Screen>
        {header}
        <H1>Where should you start? 🧭</H1>
        <T muted>
          A quick placement test for <PartnerName i={learner} />. Who’s taking it?
        </T>
        <Row style={{ marginTop: 8 }}>
          <LearnerSwitch />
        </Row>
        <Card style={{ marginTop: 12 }}>
          <T>• {PLACEMENT_QUESTIONS} questions per level, starting at A1</T>
          <T>• Get {PLACEMENT_PASS} right to move up to the next level</T>
          <T>• It stops at the first level that’s too hard — that’s where you start</T>
          <T>• It never locks levels you’ve already unlocked</T>
        </Card>
        <Button title="Start" onPress={() => setPhase("test")} style={{ marginTop: 8 }} />
      </Screen>
    );
  }

  if (phase === "done") {
    const start = LEVELS[placementLevel(results)];
    return (
      <Screen>
        {header}
        <Text style={{ fontSize: 52, textAlign: "center", marginTop: 16 }}>🧭</Text>
        <H1>
          Start at {start.id} · {start.name}
        </H1>
        <Card>
          {results.map((r, k) => (
            <T key={k}>
              {LEVELS[k].id}: {r} / {PLACEMENT_QUESTIONS} {r >= PLACEMENT_PASS ? "✓" : "✗"}
            </T>
          ))}
        </Card>
        <Button title="Go to my level" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <Quiz
        key={levelIdx}
        questions={questions}
        color={partnerColor(c, learner)}
        label={<PartnerName i={learner} suffix={` · ${LEVELS[levelIdx].id}`} />}
        onFinish={(correct) => {
          const next = [...results, correct];
          setResults(next);
          if (placementContinues(next)) {
            setQuestions(questionsFor(next.length));
          } else {
            applyPlacement(learner, placementLevel(next));
            setPhase("done");
          }
        }}
      />
    </Screen>
  );
}
