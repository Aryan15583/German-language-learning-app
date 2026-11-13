import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Quiz } from "../../components/Quiz";
import { Results } from "../../components/Results";
import { Button, Card, H1, PartnerName, Screen, T } from "../../components/ui";
import { findLevel, LEVELS, levelIndex, levelWords } from "../../content/levels";
import { makeQuestions } from "../../lib/questions";
import { partnerColor, usePalette } from "../../lib/theme";
import { EXAM_PASS, EXAM_QUESTIONS, partnerName, useProgress, XP } from "../../state/progress";

export default function Exam() {
  const c = usePalette();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const level = findLevel(levelId);
  const { state, recordExam, practiced } = useProgress();
  const learner = state.learner;

  const build = () =>
    level ? makeQuestions(levelWords(level), levelWords(level), { count: EXAM_QUESTIONS, typingShare: 1 / 3 }) : [];
  const [questions, setQuestions] = useState(build);
  const [phase, setPhase] = useState<"intro" | "exam" | "result">("intro");
  const [result, setResult] = useState({ correct: 0, total: 0 });
  const [attempt, setAttempt] = useState(0);

  if (!level) {
    return (
      <Screen>
        <T>Level not found.</T>
      </Screen>
    );
  }

  const idx = levelIndex(level.id);
  const next = LEVELS[idx + 1];
  const header = <Stack.Screen options={{ title: `${level.id} exam` }} />;

  if (phase === "intro") {
    return (
      <Screen>
        {header}
        <H1>🎓 {level.id} Prüfung</H1>
        <T muted>
          {level.name} exam for <PartnerName i={learner} />.
        </T>
        <Card style={{ marginTop: 12 }}>
          <T>• {EXAM_QUESTIONS} questions from every unit in {level.id}</T>
          <T>• About a third ask you to type the German</T>
          <T>• Score {Math.round(EXAM_PASS * 100)}% or more to pass</T>
          <T>• {next ? `Passing unlocks ${next.id} · ${next.name}` : "Passing earns your C2 mastery badge"}</T>
        </Card>
        <T muted style={{ marginBottom: 16 }}>No help from your partner this time! 😉</T>
        <Button title="Start exam" onPress={() => setPhase("exam")} />
      </Screen>
    );
  }

  if (phase === "result") {
    const passed = result.correct / result.total >= EXAM_PASS;
    return (
      <Screen>
        {header}
        <Results
          passed={passed}
          correct={result.correct}
          total={result.total}
          title={passed ? `Herzlichen Glückwunsch, ${partnerName(state, learner)}!` : "Noch nicht ganz…"}
          message={
            passed
              ? next
                ? `You passed ${level.id} — ${next.id} · ${next.name} is now unlocked. 🎓`
                : "You passed C2 — that's mastery. 🎓👑"
              : `You need ${Math.round(EXAM_PASS * 100)}% to pass. Revisit the units that felt hard and try again.`
          }
        >
          {passed ? (
            <Button title="Continue learning" onPress={() => router.back()} />
          ) : (
            <>
              <Button
                title="Try again"
                onPress={() => {
                  setQuestions(build());
                  setAttempt(attempt + 1);
                  setPhase("exam");
                }}
              />
              <Button title="Back to units" variant="secondary" onPress={() => router.back()} />
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
        label={<PartnerName i={learner} suffix={` · ${level.id} exam`} />}
        onFinish={(correct, total) => {
          const score = correct / total;
          recordExam(learner, level.id, score);
          practiced(learner, correct * XP.correctAnswer + (score >= EXAM_PASS ? XP.examPassed : 0));
          setResult({ correct, total });
          setPhase("result");
        }}
      />
    </Screen>
  );
}
