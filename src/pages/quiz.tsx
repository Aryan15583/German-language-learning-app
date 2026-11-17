import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Quiz } from "../components/Quiz";
import { Results } from "../components/Results";
import { Button, PageHeader } from "../components/ui";
import { levelWords, subLevelOfTopic, type Level, type Topic } from "../core/content/levels";
import { questionKey } from "../core/lib/questions";
import { SLOW_MS } from "../core/lib/srs";
import { lessonById } from "../web/topics";
import { makeQuestions } from "../core/lib/questions";
import { useId } from "../web/nav";
import { partnerName, UNIT_PASS, UNIT_TEST_QUESTIONS, useProgress, XP } from "../web/progress";

export default function QuizPage() {
  const id = useId();
  const found = id ? lessonById(id) : null;
  if (id === null) return <Missing loading />;
  if (!found) return <Missing />;
  return <UnitQuiz key={found.topic.id} unit={found.topic} level={found.level} berlin={found.berlin} />;
}

function UnitQuiz({ unit, level, berlin }: { unit: Topic; level: Level; berlin: boolean }) {
  const { state, recordUnitScore, practiced, log, remember, did } = useProgress();
  const learner = state.learner;
  const sub = subLevelOfTopic(unit.id);
  const build = () => makeQuestions(unit.words, levelWords(level), { count: UNIT_TEST_QUESTIONS, typingShare: 0.125, lang: state.partners[learner].lang });
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
          {passed && berlin ? (
            <Button size="lg" href="/journey">
              💌 See your new postcard
            </Button>
          ) : passed ? (
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
        label={`${partnerName(state, learner)} · ${berlin ? "Berlin" : (sub?.id ?? level.id)} quiz`}
        onAnswer={(q, ok, ms) => remember(learner, questionKey(q), ok, ms > SLOW_MS)}
        onFinish={(correct, total) => {
          if (correct === total) did(learner, "perfect");
          const score = correct / total;
          recordUnitScore(learner, unit.id, score);
          practiced(learner, correct * XP.correctAnswer + (score >= UNIT_PASS ? XP.unitPassed : 0));
          log(score >= UNIT_PASS ? (berlin ? "💌" : "⭐") : "✏️", score >= UNIT_PASS ? (berlin ? `Explored ${unit.title} — new Berlin postcard!` : `Passed the “${unit.title}” quiz`) : `Tried the “${unit.title}” quiz`);
          setResult({ correct, total });
        }}
      />
    </AppShell>
  );
}
