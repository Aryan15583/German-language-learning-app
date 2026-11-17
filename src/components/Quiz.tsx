import { Check, Heart, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { checkTypedAnswer, isAccepted, type AnswerVerdict } from "../core/lib/answers";
import type { Question } from "../core/lib/questions";
import { speakGerman } from "../web/speech";
import { Recorder } from "./Recorder";
import { Button, Card, cx, fieldClass, ProgressBar, Speak } from "./ui";

const UMLAUTS = ["ä", "ö", "ü", "ß"];
/** Milliseconds since `t` (only called from event handlers). */
export const since = (t: number) => Date.now() - t;

type Props = {
  questions: Question[];
  /** Shown above the progress bar, e.g. "Aryan's turn" or "A1 big test". */
  label?: ReactNode;
  color?: string;
  /** Every answer, with how long it took (for spaced repetition and speed duels). */
  onAnswer?: (q: Question, correct: boolean, ms: number) => void;
  /** Streak duels: stop after this many mistakes. */
  lives?: number;
  onFinish: (correct: number, total: number) => void;
};

const INSTRUCTION: Record<Question["kind"], string> = {
  choice: "",
  type: "Type this in German",
  listen: "Listen — which one did you hear?",
  cloze: "Fill the gap",
  say: "Say it out loud",
};

/** Runs questions one by one with instant feedback, then reports the score. */
export function Quiz({ questions, label, color, onAnswer, lives, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const shownAt = useRef(0);

  const q = questions[index];
  useEffect(() => {
    shownAt.current = Date.now();
    if (q?.kind === "listen" || q?.kind === "say") speakGerman(q.german);
  }, [index, q]);

  if (!q) return null;
  const answered = verdict !== null;
  const out = lives !== undefined && mistakes >= lives;
  const last = index + 1 >= questions.length || out;

  const settle = (v: AnswerVerdict) => {
    setVerdict(v);
    const ok = isAccepted(v);
    if (ok) setCorrect((n) => n + 1);
    else setMistakes((n) => n + 1);
    onAnswer?.(q, ok, since(shownAt.current));
    if (q.kind === "type" || q.kind === "cloze" || (q.kind === "choice" && q.direction === "x-de") || !ok) speakGerman(q.german);
  };
  const choose = (o: string) => {
    if (answered || !("options" in q)) return;
    setPicked(o);
    settle(o === q.answer ? "correct" : "wrong");
  };
  const check = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (answered || q.kind !== "type" || !typed.trim()) return;
    settle(checkTypedAnswer(typed, q.answer));
  };
  const next = () => {
    if (last) return onFinish(correct, lives !== undefined ? correct + mistakes : questions.length);
    setIndex(index + 1);
    setPicked(null);
    setTyped("");
    setVerdict(null);
  };

  const instruction = q.kind === "choice" ? (q.direction === "de-x" ? "What does this mean?" : "How do you say this in German?") : INSTRUCTION[q.kind];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <div className="font-semibold text-ink">{label}</div>
        <div className="ml-auto flex items-center gap-2 text-muted">
          {lives !== undefined ? (
            <span className="flex gap-0.5" aria-label={`${lives - mistakes} lives left`}>
              {Array.from({ length: lives }, (_, k) => (
                <Heart key={k} size={16} className={k < lives - mistakes ? "text-rose" : "text-line"} fill="currentColor" />
              ))}
            </span>
          ) : null}
          {lives !== undefined ? `${correct} right` : `${index + 1} / ${questions.length}`}
        </div>
      </div>
      {lives === undefined ? <ProgressBar value={index / questions.length} color={color} /> : null}

      <Card className="mt-4 text-center">
        <p className="text-sm font-semibold text-muted">{instruction}</p>
        {q.kind === "listen" ? (
          <button type="button" aria-label="Play again" onClick={() => speakGerman(q.german)} className="mx-auto mt-3 grid h-20 w-20 place-items-center rounded-full bg-plum text-white shadow-soft hover:bg-plum-dark">
            <Volume2 size={36} />
          </button>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-3">
            <p className={cx("font-extrabold text-ink", q.kind === "cloze" ? "text-2xl" : "text-3xl")}>{q.kind === "say" ? q.answer : q.prompt}</p>
            {(q.kind === "choice" && q.direction === "de-x") || q.kind === "say" ? <Speak text={q.german} /> : null}
          </div>
        )}
        {q.kind === "cloze" ? <p className="mt-1 text-muted">{q.hint}</p> : null}
        {q.kind === "say" ? <p className="mt-1 text-muted">{q.prompt}</p> : null}
      </Card>

      {q.kind === "say" ? (
        <div className="mt-4 text-center">
          <p className="mb-3 text-muted">Listen, then say it out loud. Record yourself to compare, if you like.</p>
          <Recorder />
          {!answered ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button size="lg" variant="soft" onClick={() => settle("wrong")}>
                Not yet
              </Button>
              <Button size="lg" variant="good" onClick={() => settle("correct")}>
                I said it ✓
              </Button>
            </div>
          ) : null}
        </div>
      ) : "options" in q ? (
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
                  isAnswer ? "border-good bg-good/10" : isWrong ? "border-bad bg-bad/10 anim-shake" : "border-line bg-surface hover:border-rose",
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
              <button key={u} type="button" aria-label={`Insert ${u}`} disabled={answered} onClick={() => setTyped((t) => t + u)} className="rounded-xl border border-line bg-surface px-4 py-2 text-lg font-bold hover:border-rose">
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
            {q.kind === "say"
              ? isAccepted(verdict)
                ? "Super! 🗣️"
                : "Listen once more and try again later."
              : verdict === "correct"
                ? "Richtig! ✓"
                : verdict === "typo"
                  ? "Fast! Almost — watch the spelling"
                  : "Nicht ganz — not quite"}
          </p>
          {verdict !== "correct" && q.kind !== "say" ? (
            <p className="mt-1 text-ink">
              Correct answer: <b>{q.answer}</b>
            </p>
          ) : null}
          {q.kind === "cloze" ? <p className="mt-1 text-sm text-muted">{q.german}</p> : null}
          {out ? <p className="mt-1 font-semibold text-bad">That was your {lives}rd mistake — game over!</p> : null}
          <Button full size="lg" className="mt-3" onClick={next}>
            {last ? "See results" : "Continue"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
