import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Quiz } from "../components/Quiz";
import { Button, Card, PageHeader, ProgressBar, Script } from "../components/ui";
import { allWords } from "../core/content/levels";
import { reviewSet } from "../core/lib/practice";
import { questionKey } from "../core/lib/questions";
import { dueKeys, nextReviewLabel, SLOW_MS, stage } from "../core/lib/srs";
import { partnerName, today, useProgress, XP } from "../web/progress";
import { wordIndex } from "../web/words";

const ROUND = 10;

/** Smart review: the words you miss most, and the ones you're about to forget — in context. */
export default function Review() {
  const { state, remember, practiced, log } = useProgress();
  const learner = state.learner;
  const p = state.partners[learner];
  const [phase, setPhase] = useState<"intro" | "quiz" | "done">("intro");
  const [questions, setQuestions] = useState<ReturnType<typeof reviewSet>>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const index = wordIndex(state);
  const due = dueKeys(p.memory, today()).filter((k) => index.has(k));
  const known = Object.keys(p.memory).filter((k) => index.has(k));

  // "Wiederholen": the words you've missed, most-missed first (until you know them well again).
  const tricky = known.filter((k) => p.memory[k].w > 0 && p.memory[k].b < 4).sort((a, b) => p.memory[b].w - p.memory[a].w);

  const start = (keys: string[] = due) => {
    const words = keys.slice(0, ROUND).map((k) => index.get(k)!);
    setQuestions(reviewSet(words, allWords(), p.lang));
    setPhase("quiz");
  };

  if (phase === "quiz") {
    return (
      <AppShell focus>
        <PageHeader title="Smart review" />
        <Quiz
          questions={questions}
          label={`${partnerName(state, learner)} · smart review`}
          onAnswer={(q, ok, ms) => remember(learner, questionKey(q), ok, ms > SLOW_MS)}
          onFinish={(correct, total) => {
            practiced(learner, correct * XP.correctAnswer + 5);
            log("💡", `Smart review: ${correct} of ${total} right`);
            setScore({ correct, total });
            setPhase("done");
          }}
        />
      </AppShell>
    );
  }

  if (phase === "done") {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-6xl">💡</p>
          <Script className="mt-2 text-4xl">Fresh again!</Script>
          <p className="mt-1 text-muted">
            {score.correct} of {score.total} right. Right answers wait longer before they come back; missed ones return soon.
          </p>
          <div className="mt-6">
            <KeepGoing />
          </div>
        </div>
      </AppShell>
    );
  }

  const sorted = [...known].sort((a, b) => p.memory[a].due.localeCompare(p.memory[b].due));
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">Smart review 💡</Script>
        <p className="text-muted">Words come back right before you’d forget them: after 1, 3, 7, 14 and 30 days.</p>
        <Card className="mt-5 flex flex-col items-center bg-gradient-to-br from-card to-blush text-center">
          <p className="text-5xl font-extrabold text-plum">{due.length}</p>
          <p className="text-muted">{due.length === 1 ? "word needs" : "words need"} your attention</p>
          <Button size="lg" className="mt-4" disabled={!due.length} onClick={() => start()}>
            {due.length ? `Review ${Math.min(ROUND, due.length)} words · 3 min` : "All fresh — come back tomorrow 🌱"}
          </Button>
        </Card>

        {tricky.length ? (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">Wiederholen 🔁</h2>
            <Card>
              <p className="text-sm text-muted">Words you found tricky. A little extra practice and they’ll stick.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tricky.slice(0, 12).map((k) => (
                  <span key={k} className="rounded-full bg-blush px-3 py-1 text-sm font-semibold text-plum">
                    {k}
                  </span>
                ))}
              </div>
              <Button variant="soft" className="mt-4" onClick={() => start(tricky)}>
                Practice these {Math.min(ROUND, tricky.length)} words
              </Button>
            </Card>
          </>
        ) : null}

        <h2 className="mb-2 mt-6 text-lg font-bold">Your relationship with each word ❤️</h2>
        {sorted.length ? (
          <Card className="divide-y divide-line/60 py-2">
            {sorted.slice(0, 60).map((k) => {
              const m = p.memory[k];
              const st = stage(m);
              return (
                <div key={k} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl" title={st.label}>
                    {st.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{k}</p>
                    <ProgressBar value={Math.max(0.05, st.share)} className="mt-1 h-1.5" color={st.id === "mastered" ? "bg-rose" : "bg-plum"} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-muted">{nextReviewLabel(m, today())}</span>
                </div>
              );
            })}
          </Card>
        ) : (
          <p className="text-muted">Learn some words with ▶ Start and they’ll appear here. 🌱 Seed → 🌿 Growing → 🌳 Strong → ❤️ Mastered</p>
        )}
      </div>
    </AppShell>
  );
}
