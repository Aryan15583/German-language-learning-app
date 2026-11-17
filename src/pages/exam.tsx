import { GraduationCap, Play } from "lucide-react";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Quiz } from "../components/Quiz";
import { Results } from "../components/Results";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { findLevel, LEVELS, levelIndex, levelWords, type Level } from "../core/content/levels";
import { makeQuestions } from "../core/lib/questions";
import { useId } from "../web/nav";
import { EXAM_PASS, EXAM_QUESTIONS, partnerName, useProgress, XP } from "../web/progress";

export default function ExamPage() {
  const id = useId();
  const level = id ? findLevel(id) : undefined;
  if (id === null) return <Missing loading />;
  if (!level) return <Missing />;
  return <Exam key={level.id} level={level} />;
}

/** The big test at the end of a level. Passing opens the next one (you can also test out early). */
function Exam({ level }: { level: Level }) {
  const { state, recordExam, practiced, log } = useProgress();
  const learner = state.learner;
  const build = () => makeQuestions(levelWords(level), levelWords(level), { count: EXAM_QUESTIONS, typingShare: 1 / 3, lang: state.partners[learner].lang });
  const [questions, setQuestions] = useState(build);
  const [phase, setPhase] = useState<"intro" | "exam" | "result">("intro");
  const [result, setResult] = useState({ correct: 0, total: 0 });
  const [attempt, setAttempt] = useState(0);
  const next = LEVELS[levelIndex(level.id) + 1];
  const name = partnerName(state, learner);

  if (phase === "intro") {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-xl">
          <PageHeader title={`${level.id} big test`} />
          <div className="text-center">
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-plum text-white shadow-soft">
              <GraduationCap size={48} />
            </span>
            <Script className="mt-3 text-4xl">{level.id} big test</Script>
            <p className="text-muted">
              {level.name} · for {name}
            </p>
          </div>
          <Card className="mt-5">
            <ul className="flex flex-col gap-2 text-ink">
              <li>📝 {EXAM_QUESTIONS} questions from every lesson in {level.id}</li>
              <li>⌨️ About a third ask you to type the German</li>
              <li>🎯 Score {Math.round(EXAM_PASS * 100)}% or more to pass</li>
              <li>🔓 {next ? `Passing opens ${next.id} · ${next.name}` : "Passing earns your C2 mastery badge"}</li>
            </ul>
          </Card>
          <p className="my-4 text-center text-muted">No help from your partner this time! 😉</p>
          <Button size="lg" full onClick={() => setPhase("exam")}>
            <Play size={20} fill="currentColor" /> Start the big test
          </Button>
        </div>
      </AppShell>
    );
  }

  if (phase === "result") {
    const passed = result.correct / result.total >= EXAM_PASS;
    return (
      <AppShell focus>
        <Results
          passed={passed}
          correct={result.correct}
          total={result.total}
          title={passed ? `Herzlichen Glückwunsch, ${name}!` : "Noch nicht ganz…"}
          message={
            passed
              ? next
                ? `You passed ${level.id} — ${next.id} · ${next.name} is now open. 🎓`
                : "You passed C2 — that’s mastery. 🎓👑"
              : `You need ${Math.round(EXAM_PASS * 100)}% to pass. Practise the lessons that felt hard and try again.`
          }
        >
          {passed ? (
            <KeepGoing />
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => {
                  setQuestions(build());
                  setAttempt(attempt + 1);
                  setPhase("exam");
                }}
              >
                Try again
              </Button>
              <Button size="lg" variant="soft" href="/learn">
                Back to lessons
              </Button>
            </>
          )}
        </Results>
      </AppShell>
    );
  }

  return (
    <AppShell focus>
      <PageHeader title={`${level.id} big test`} />
      <Quiz
        key={attempt}
        questions={questions}
        label={`${name} · ${level.id} big test`}
        onFinish={(correct, total) => {
          const score = correct / total;
          recordExam(learner, level.id, score);
          practiced(learner, correct * XP.correctAnswer + (score >= EXAM_PASS ? XP.examPassed : 0));
          if (score >= EXAM_PASS) log("🎓", `Passed the ${level.id} big test!`);
          setResult({ correct, total });
          setPhase("result");
        }}
      />
    </AppShell>
  );
}
