import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Quiz } from "../components/Quiz";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { levelWords, type Level, type Topic } from "../core/content/levels";
import { practiceSet } from "../core/lib/practice";
import { questionKey } from "../core/lib/questions";
import { SLOW_MS } from "../core/lib/srs";
import { useId } from "../web/nav";
import { partnerName, useProgress, XP } from "../web/progress";
import { lessonById } from "../web/topics";

const STEPS = ["👀 See", "🔊 Hear", "🗣️ Say", "✍️ Type", "🧩 Use"];

export default function PracticePage() {
  const id = useId();
  const found = id ? lessonById(id) : null;
  if (id === null) return <Missing loading />;
  if (!found) return <Missing />;
  return <Practice key={found.topic.id} unit={found.topic} level={found.level} />;
}

/** After the flashcards: hear it, say it, type it, use it — one exercise per word. */
function Practice({ unit, level }: { unit: Topic; level: Level }) {
  const { state, practiced, remember, markPractised, log } = useProgress();
  const learner = state.learner;
  const [questions] = useState(() => practiceSet(unit.words, levelWords(level), state.partners[learner].lang));
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  if (result) {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-6xl">🗣️</p>
          <Script className="mt-2 text-4xl">Gut geübt!</Script>
          <p className="mt-1 text-muted">
            {result.correct} of {result.total} right. Words you missed come back in your smart review.
          </p>
          <div className="mt-6">{unit.id.startsWith("berlin-") ? <Button href={`/quiz?id=${unit.id}`}>✏️ Quiz</Button> : <KeepGoing />}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell focus>
      <PageHeader title={`Practise · ${unit.title}`} />
      <Card className="mx-auto mb-4 max-w-2xl bg-blush/60 py-3">
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-sm font-semibold text-plum">
          {STEPS.map((s, k) => (
            <span key={s}>
              {s}
              {k < STEPS.length - 1 ? " →" : ""}
            </span>
          ))}
        </p>
      </Card>
      <Quiz
        questions={questions}
        label={`${partnerName(state, learner)} · practice`}
        onAnswer={(q, ok, ms) => remember(learner, questionKey(q), ok, ms > SLOW_MS)}
        onFinish={(correct, total) => {
          markPractised(learner, unit.id);
          practiced(learner, correct * XP.correctAnswer + 5);
          log("🗣️", `Practised “${unit.title}”`);
          setResult({ correct, total });
        }}
      />
    </AppShell>
  );
}
