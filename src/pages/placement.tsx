import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { LearnerSwitch } from "../components/LearnerSwitch";
import { Quiz } from "../components/Quiz";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { LEVELS, levelWords, type Lang } from "../core/content/levels";
import { makeQuestions } from "../core/lib/questions";
import { partnerName, PLACEMENT_PASS, PLACEMENT_QUESTIONS, placementContinues, placementLevel, useProgress } from "../web/progress";

const questionsFor = (levelIdx: number, lang: Lang) => {
  const words = levelWords(LEVELS[levelIdx]);
  return makeQuestions(words, words, { count: PLACEMENT_QUESTIONS, lang });
};

/** Adaptive placement: a few questions per level, moving up until a level is too hard. */
export default function Placement() {
  const { state, applyPlacement, log } = useProgress();
  const learner = state.learner;
  const lang = state.partners[learner].lang;
  const [phase, setPhase] = useState<"intro" | "test" | "done">("intro");
  const [results, setResults] = useState<number[]>([]);
  const [questions, setQuestions] = useState(() => questionsFor(0, lang));
  const levelIdx = results.length;

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Placement test" />
        {phase === "intro" ? (
          <>
            <Script className="text-4xl">Where should you start? 🧭</Script>
            <p className="mb-3 text-muted">A quick test for {partnerName(state, learner)}.</p>
            <LearnerSwitch />
            <Card className="mt-4">
              <ul className="flex flex-col gap-2 text-ink">
                <li>• {PLACEMENT_QUESTIONS} questions per level, starting at A1</li>
                <li>• Get {PLACEMENT_PASS} right to move up</li>
                <li>• It stops at the first level that’s too hard — that’s where you start</li>
                <li>• It never closes levels you’ve already opened</li>
              </ul>
            </Card>
            <Button
              size="lg"
              full
              className="mt-5"
              onClick={() => {
                setResults([]);
                setQuestions(questionsFor(0, lang));
                setPhase("test");
              }}
            >
              Start
            </Button>
          </>
        ) : phase === "done" ? (
          <div className="text-center anim-fade-up">
            <p className="mt-4 text-6xl">🧭</p>
            <Script className="mt-2 text-4xl">
              Start at {LEVELS[placementLevel(results)].id} · {LEVELS[placementLevel(results)].name}
            </Script>
            <Card className="mt-5 text-left">
              {results.map((r, k) => (
                <p key={k} className="py-1">
                  {LEVELS[k].id}: {r} / {PLACEMENT_QUESTIONS} {r >= PLACEMENT_PASS ? "✓" : "✗"}
                </p>
              ))}
            </Card>
            <Button size="lg" full className="mt-5" href="/learn">
              Go to my level
            </Button>
          </div>
        ) : (
          <Quiz
            key={levelIdx}
            questions={questions}
            label={`${partnerName(state, learner)} · ${LEVELS[levelIdx].id}`}
            onFinish={(correct) => {
              const next = [...results, correct];
              setResults(next);
              if (placementContinues(next)) setQuestions(questionsFor(next.length, lang));
              else {
                applyPlacement(learner, placementLevel(next));
                log("🧭", `Placement test: start at ${LEVELS[placementLevel(next)].id}`);
                setPhase("done");
              }
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
