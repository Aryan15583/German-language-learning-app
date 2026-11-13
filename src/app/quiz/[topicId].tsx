import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Quiz } from "../../components/Quiz";
import { Results } from "../../components/Results";
import { Button, PartnerName, Screen, T } from "../../components/ui";
import { findTopic, levelOfTopic, levelWords, subLevelOfTopic } from "../../content/levels";
import { makeQuestions } from "../../lib/questions";
import { partnerColor, usePalette } from "../../lib/theme";
import { UNIT_PASS, UNIT_TEST_QUESTIONS, useProgress, XP } from "../../state/progress";

export default function UnitTest() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const unit = findTopic(topicId);
  const level = levelOfTopic(topicId);
  const sub = subLevelOfTopic(topicId);
  const { state, recordUnitScore, practiced } = useProgress();
  const learner = state.learner;

  const build = () =>
    unit && level ? makeQuestions(unit.words, levelWords(level), { count: UNIT_TEST_QUESTIONS, typingShare: 0.25 }) : [];
  const [questions, setQuestions] = useState(build);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (!unit || !level || !sub) {
    return (
      <Screen>
        <T>Unit not found.</T>
      </Screen>
    );
  }

  const header = <Stack.Screen options={{ title: `Test · ${unit.title}` }} />;

  if (result) {
    const score = result.correct / result.total;
    const passed = score >= UNIT_PASS;
    return (
      <Screen>
        {header}
        <Results
          passed={passed}
          correct={result.correct}
          total={result.total}
          title={passed ? "Bestanden! Unit passed ⭐" : "Fast geschafft!"}
          message={
            passed
              ? `${unit.title} is done. Keep going with ${sub.id}!`
              : `You need ${Math.round(UNIT_PASS * 100)}% to pass. Review the flashcards and try again.`
          }
        >
          {passed ? (
            <Button title="Back to the unit" onPress={() => router.back()} />
          ) : (
            <>
              <Button
                title="Try again"
                onPress={() => {
                  setQuestions(build());
                  setResult(null);
                  setAttempt(attempt + 1);
                }}
              />
              <Button
                title="Review flashcards"
                variant="secondary"
                onPress={() => router.replace({ pathname: "/lesson/[topicId]", params: { topicId: unit.id } })}
              />
            </>
          )}
        </Results>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <Quiz
        key={attempt}
        questions={questions}
        color={partnerColor(c, learner)}
        label={<PartnerName i={learner} suffix={` · ${sub.id} unit test`} />}
        onFinish={(correct, total) => {
          const score = correct / total;
          recordUnitScore(learner, unit.id, score);
          practiced(learner, correct * XP.correctAnswer + (score >= UNIT_PASS ? XP.unitPassed : 0));
          setResult({ correct, total });
        }}
      />
    </Screen>
  );
}
