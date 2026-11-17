import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Quiz } from "../components/Quiz";
import { Results } from "../components/Results";
import { Button, PageHeader } from "../components/ui";
import { findTopic, levelOfTopic, levelWords, subLevelOfTopic, type Level, type Topic } from "../core/content/levels";
import { makeQuestions } from "../core/lib/questions";
import { useId } from "../web/nav";
import { partnerName, UNIT_PASS, UNIT_TEST_QUESTIONS, useProgress, XP } from "../web/progress";

export default function QuizPage() {
  const id = useId();
  const unit = id ? findTopic(id) : undefined;
  const level = id ? levelOfTopic(id) : undefined;
  if (id === null) return <Missing loading />;
  if (!unit || !level) return <Missing />;
  return <UnitQuiz key={unit.id} unit={unit} level={level} />;
}

function UnitQuiz({ unit, level }: { unit: Topic; level: Level }) {
  const { state, recordUnitScore, practiced, log } = useProgress();
  const learner = state.learner;
  const sub = subLevelOfTopic(unit.id);
  const build = () => makeQuestions(unit.words, levelWords(level), { count: UNIT_TEST_QUESTIONS, typingShare: 0.25, lang: state.partners[learner].lang });
  const [questions, setQuestions] = useState(build);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (result) {
    const passed = result.correct / result.total >= UNIT_PASS;
    return (
      <AppShell focus>
        <Results
          passed={passed}
          correct={result.correct}
          total={result.total}
          title={passed ? "Bestanden! You passed ⭐" : "Almost! Fast geschafft!"}
          message={passed ? `${unit.title} is done. Keep going!` : `You need ${Math.round(UNIT_PASS * 100)}% to pass. Look at the words again and try once more.`}
        >
          {passed ? (
            <KeepGoing />
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => {
                  setQuestions(build());
                  setResult(null);
                  setAttempt(attempt + 1);
                }}
              >
                Try again
              </Button>
              <Button size="lg" variant="soft" href={`/lesson?id=${unit.id}`}>
                Look at the words again
              </Button>
            </>
          )}
        </Results>
      </AppShell>
    );
  }

  return (
    <AppShell focus>
      <PageHeader title={`Quiz · ${unit.title}`} />
      <Quiz
        key={attempt}
        questions={questions}
        label={`${partnerName(state, learner)} · ${sub?.id ?? level.id} quiz`}
        onFinish={(correct, total) => {
          const score = correct / total;
          recordUnitScore(learner, unit.id, score);
          practiced(learner, correct * XP.correctAnswer + (score >= UNIT_PASS ? XP.unitPassed : 0));
          log(score >= UNIT_PASS ? "⭐" : "✏️", score >= UNIT_PASS ? `Passed the “${unit.title}” quiz` : `Tried the “${unit.title}” quiz`);
          setResult({ correct, total });
        }}
      />
    </AppShell>
  );
}
