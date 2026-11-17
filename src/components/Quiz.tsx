import { Check, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { checkTypedAnswer, isAccepted, type AnswerVerdict } from "../core/lib/answers";
import type { Question } from "../core/lib/questions";
import { speakGerman } from "../web/speech";
import { Button, Card, cx, fieldClass, ProgressBar, Speak } from "./ui";

const UMLAUTS = ["ä", "ö", "ü", "ß"];

type Props = {
  questions: Question[];
  /** Shown above the progress bar, e.g. "Aryan's turn" or "A1 big test". */
  label?: ReactNode;
  color?: string;
  onFinish: (correct: number, total: number) => void;
};

/** Runs questions one by one with instant feedback, then reports the score. */
export function Quiz({ questions, label, color, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);

  const q = questions[index];
  if (!q) return null;
  const answered = verdict !== null;
  const last = index + 1 >= questions.length;

  const settle = (v: AnswerVerdict) => {
    setVerdict(v);
    if (isAccepted(v)) setCorrect((n) => n + 1);
    if (q.kind === "type" || (q.kind === "choice" && q.direction === "x-de") || !isAccepted(v)) speakGerman(q.german);
  };
  const choose = (o: string) => {
    if (answered || q.kind !== "choice") return;
    setPicked(o);
    settle(o === q.answer ? "correct" : "wrong");
  };
  const check = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (answered || q.kind !== "type" || !typed.trim()) return;
    settle(checkTypedAnswer(typed, q.answer));
  };
  const next = () => {
    if (last) return onFinish(correct, questions.length);
    setIndex(index + 1);
    setPicked(null);
    setTyped("");
    setVerdict(null);
  };

  const instruction = q.kind === "type" ? "Type this in German" : q.direction === "de-x" ? "What does this mean?" : "How do you say this in German?";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <div className="font-semibold text-ink">{label}</div>
        <div className="ml-auto text-muted">
          {index + 1} / {questions.length}
        </div>
      </div>
      <ProgressBar value={index / questions.length} color={color} />

      <Card className="mt-4 text-center">
        <p className="text-sm font-semibold text-muted">{instruction}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <p className="text-3xl font-extrabold text-ink">{q.prompt}</p>
          {q.kind === "choice" && q.direction === "de-x" ? <Speak text={q.german} /> : null}
        </div>
      </Card>

      {q.kind === "choice" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {q.options.map((o) => {
            const isAnswer = answered && o === q.answer;
            const isWrong = answered && picked === o && o !== q.answer;
            return (
              <button
                key={o}
                type="button"
                aria-label={`Answer: ${o}`}
                disabled={answered}
                onClick={() => choose(o)}
                className={cx(
                  "flex items-center gap-2 rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold transition",
                  isAnswer ? "border-good bg-good/10" : isWrong ? "border-bad bg-bad/10 anim-shake" : "border-line bg-white hover:border-rose",
                )}
              >
                <span className="flex-1">{o}</span>
                {isAnswer ? <Check className="text-good" /> : isWrong ? <X className="text-bad" /> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={check} className="mt-4">
          <input
            className={cx(fieldClass, "text-lg")}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={answered}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            placeholder="Auf Deutsch…"
            aria-label="Your answer in German"
          />
          <div className="mt-3 flex gap-2">
            {UMLAUTS.map((u) => (
              <button
                key={u}
                type="button"
                aria-label={`Insert ${u}`}
                disabled={answered}
                onClick={() => setTyped((t) => t + u)}
                className="rounded-xl border border-line bg-white px-4 py-2 text-lg font-bold hover:border-rose"
              >
                {u}
              </button>
            ))}
          </div>
          {!answered ? (
            <Button type="submit" full size="lg" className="mt-4" disabled={!typed.trim()}>
              Check
            </Button>
          ) : null}
        </form>
      )}

      {answered ? (
        <div aria-live="polite" className={cx("mt-5 rounded-3xl p-5 anim-pop-in", isAccepted(verdict) ? "bg-good/12" : "bg-bad/10")}>
          <p className={cx("text-lg font-extrabold", isAccepted(verdict) ? "text-good" : "text-bad")}>
            {verdict === "correct" ? "Richtig! ✓" : verdict === "typo" ? "Fast! Almost — watch the spelling" : "Nicht ganz — not quite"}
          </p>
          {verdict !== "correct" ? (
            <p className="mt-1 text-ink">
              Correct answer: <b>{q.answer}</b>
            </p>
          ) : null}
          <Button full size="lg" className="mt-3" onClick={next}>
            {last ? "See results" : "Continue"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
