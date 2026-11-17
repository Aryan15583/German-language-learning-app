import { Flame, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { checkTypedAnswer, isAccepted } from "../core/lib/answers";
import { isQuestion, type DuoStep } from "../core/lib/duo";
import { formsIn } from "../core/lib/forms";
import { meaning, otherMeaning, type Lang, type Word } from "../core/content/levels";
import { playRight, playWrong, setSound, soundOn } from "../web/sound";
import { speakGerman } from "../web/speech";
import { FormsPanel } from "./FormsPanel";
import { Recorder } from "./Recorder";
import { cx, fieldClass, Speak } from "./ui";

export type DuoResult = { correct: number; total: number; ms: number; missed: string[] };
type Verdict = { ok: boolean; answer: string; typo?: boolean };
/** An exercise tells the footer how to check it (null = not ready yet). */
type Checker = (() => Verdict) | null;

const PRAISE = ["Richtig! 🎉", "Super! ⭐", "Toll! 💞", "Genau! ✨", "Perfekt! 🙌", "Sehr gut! 🥨"];

/** A Duolingo-style lesson: one tiny step at a time, a big Check button, mistakes repeated at the end. */
export function DuoLesson({ steps, lang, title, emoji, exit, onAnswer, onFinish }: { steps: DuoStep[]; lang: Lang; title: string; emoji: string; exit: string; onAnswer?: (word: string, ok: boolean) => void; onFinish: (r: DuoResult) => void }) {
  const [queue, setQueue] = useState<DuoStep[]>(steps);
  const [pos, setPos] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checker, setChecker] = useState<Checker>(null);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0, missed: [] as string[] });
  const [startedAt] = useState(() => Date.now());
  const [sound, setSoundState] = useState(soundOn);
  const step = queue[pos];
  const total = queue.length;

  useEffect(() => {
    if (step && (step.kind === "intro" || step.kind === "listen" || step.kind === "say")) {
      const t = setTimeout(() => speakGerman(step.kind === "listen" ? step.answer : step.word.de), 250);
      return () => clearTimeout(t);
    }
  }, [pos, step]);

  if (!step) return null;
  const isQ = isQuestion(step);
  const wordOf = (s: DuoStep) => ("word" in s ? s.word.de : "");

  const check = () => {
    if (!checker) return;
    const v = checker();
    setVerdict(v);
    if (v.ok) {
      playRight();
      setCombo((c) => c + 1);
    } else {
      playWrong();
      setCombo(0);
      if (step.kind !== "match") setQueue((q) => [...q, step]); // try it again at the end
    }
    if (step.kind !== "match") speakGerman(step.kind === "listen" ? step.answer : wordOf(step));
    setStats((s) => ({ correct: s.correct + (v.ok ? 1 : 0), total: s.total + 1, missed: v.ok || !wordOf(step) ? s.missed : [...s.missed, wordOf(step)] }));
    if (wordOf(step)) onAnswer?.(wordOf(step), v.ok);
  };

  const next = () => {
    setVerdict(null);
    setChecker(null);
    if (pos + 1 >= queue.length) {
      onFinish({ correct: stats.correct, total: stats.total, ms: Date.now() - startedAt, missed: stats.missed });
      return;
    }
    setPos(pos + 1);
  };

  const footerReady = !isQ || !!checker;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-cream">
      {/* Top: close, progress, combo, sound */}
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4">
        <Link href={exit} aria-label="Close lesson" className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-blush">
          <X size={24} />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-rose-soft/50" role="progressbar" aria-valuenow={pos} aria-valuemax={total}>
          <div className="h-full rounded-full bg-gradient-to-r from-good to-[#7ad3a6] transition-all duration-500" style={{ width: `${(pos / total) * 100}%` }} />
        </div>
        <span className={cx("flex items-center gap-1 text-sm font-bold", combo >= 2 ? "text-gold" : "text-muted/50")} aria-label={`${combo} in a row`}>
          <Flame size={18} fill="currentColor" /> {combo}
        </span>
        <button
          type="button"
          aria-label={sound ? "Mute sounds" : "Turn sounds on"}
          onClick={() => {
            setSound(!sound);
            setSoundState(!sound);
          }}
          className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-blush"
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <p className="mx-auto mt-1 w-full max-w-2xl px-4 text-center text-xs font-semibold text-muted">
        {emoji} {title}
      </p>

      {/* The exercise */}
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 pb-40 pt-4">
        <Exercise key={`${pos}-${step.kind}`} step={step} lang={lang} locked={!!verdict} setChecker={(c) => setChecker(() => c)} />
      </div>

      {/* Footer: Check → feedback → Continue */}
      <div
        aria-live="polite"
        className={cx(
          "fixed inset-x-0 bottom-0 border-t px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 transition-colors",
          !verdict ? "border-line/60 bg-cream" : verdict.ok ? "border-good/30 bg-[color-mix(in_oklab,var(--color-good)_16%,var(--color-cream))]" : "border-bad/30 bg-[color-mix(in_oklab,var(--color-bad)_14%,var(--color-cream))]",
        )}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
          {verdict ? (
            <div className="flex-1 anim-pop-in">
              <p className={cx("text-xl font-extrabold", verdict.ok ? "text-good" : "text-bad")}>
                {verdict.ok ? (verdict.typo ? "Fast! Watch the spelling 😉" : PRAISE[(pos + combo) % PRAISE.length]) : "Nicht ganz…"}
              </p>
              {!verdict.ok || verdict.typo ? (
                <p className="text-ink">
                  Correct answer: <b>{verdict.answer}</b>
                </p>
              ) : null}
              {!verdict.ok ? <p className="text-xs text-muted">No worries — it comes back at the end. 💪</p> : null}
            </div>
          ) : (
            <div className="hidden flex-1 sm:block" />
          )}
          {step.kind === "say" && !verdict ? (
            <div className="flex gap-2 sm:w-72">
              <button type="button" onClick={next} className="flex-1 rounded-2xl border-2 border-line bg-surface py-3.5 font-bold text-muted">
                Can’t talk now
              </button>
              <button type="button" onClick={next} className="btn-good flex-1 rounded-2xl py-3.5 font-bold text-white">
                I said it ✓
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!verdict && !footerReady}
              onClick={!isQ || verdict ? next : check}
              className={cx(
                "rounded-2xl py-4 text-lg font-extrabold uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-40 sm:w-56",
                verdict ? (verdict.ok ? "btn-good" : "bg-bad shadow-soft") : "btn-primary",
              )}
            >
              {!isQ ? "Continue" : verdict ? "Continue" : "Check"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Exercise({ step, lang, locked, setChecker }: { step: DuoStep; lang: Lang; locked: boolean; setChecker: (c: Checker) => void }) {
  switch (step.kind) {
    case "intro":
      return <Intro word={step.word} lang={lang} />;
    case "pick":
      return (
        <Choice
          title={step.dir === "de-x" ? "What does this mean?" : "How do you say this in German?"}
          prompt={<Prompt text={step.prompt} speak={step.dir === "de-x" ? step.word.de : undefined} />}
          options={step.options}
          answer={step.answer}
          locked={locked}
          setChecker={setChecker}
        />
      );
    case "listen":
      return (
        <Choice
          title="Tap what you hear"
          prompt={
            <button type="button" aria-label="Play again" onClick={() => speakGerman(step.answer)} className="btn-primary mx-auto grid h-24 w-24 place-items-center rounded-3xl text-white">
              <Volume2 size={42} />
            </button>
          }
          options={step.options}
          answer={step.answer}
          locked={locked}
          setChecker={setChecker}
        />
      );
    case "match":
      return <Match pairs={step.pairs} setChecker={setChecker} />;
    case "build":
      return <Build word={step.word} tiles={step.tiles} answer={step.answer} lang={lang} locked={locked} setChecker={setChecker} />;
    case "spell":
      return <Spell step={step} locked={locked} setChecker={setChecker} />;
    case "say":
      return (
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Say it out loud 🗣️</h2>
          <div className="mt-6 flex items-center justify-center gap-3">
            <p className="text-3xl font-extrabold text-plum">{step.word.de}</p>
            <Speak text={step.word.de} big />
          </div>
          <p className="mt-1 text-muted">{meaning(step.word, lang)}</p>
          <Recorder className="mt-6" />
        </div>
      );
  }
}

function Intro({ word, lang }: { word: Word; lang: Lang }) {
  const [showForms, setShowForms] = useState(false);
  const forms = useMemo(() => formsIn(word.de), [word.de]);
  return (
    <div className="text-center">
      <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold">✨ New word</span>
      <div className="card-premium mx-auto mt-5 max-w-md rounded-[28px] px-6 py-8">
        <div className="flex items-center justify-center gap-3">
          <p className="text-4xl font-extrabold text-ink">{word.de}</p>
        </div>
        <div className="mt-4 flex justify-center">
          <Speak text={word.de} big />
        </div>
        <p className="mt-4 text-2xl font-bold text-plum">{meaning(word, lang)}</p>
        <p className="mt-1 text-muted">{otherMeaning(word, lang)}</p>
      </div>
      {forms.length ? (
        <div className="mx-auto mt-4 max-w-md text-left">
          <button type="button" onClick={() => setShowForms(!showForms)} className="mx-auto block text-sm font-semibold text-plum underline underline-offset-4">
            {showForms ? "Hide forms" : "🔁 How does it change?"}
          </button>
          {showForms ? (
            <div className="mt-3 grid gap-2 anim-fade-up">
              {forms.map((e) => (
                <FormsPanel key={e.lemma} entry={e} lang={lang} compact />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Prompt({ text, speak }: { text: string; speak?: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {speak ? <Speak text={speak} /> : null}
      <p className="text-3xl font-extrabold text-ink">{text}</p>
    </div>
  );
}

function Choice({ title, prompt, options, answer, locked, setChecker }: { title: string; prompt: ReactNode; options: string[]; answer: string; locked: boolean; setChecker: (c: Checker) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div>
      <h2 className="text-center text-xl font-extrabold">{title}</h2>
      <div className="my-6">{prompt}</div>
      <div className="grid gap-3">
        {options.map((o, k) => {
          const show = locked && (o === answer || o === picked);
          return (
            <button
              key={o}
              type="button"
              aria-label={`Answer: ${o}`}
              aria-pressed={picked === o}
              disabled={locked}
              onClick={() => {
                setPicked(o);
                setChecker(() => ({ ok: o === answer, answer }));
              }}
              className={cx(
                "flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-4 text-left text-lg font-semibold transition active:translate-y-0.5",
                show && o === answer ? "border-good bg-good/10" : show ? "border-bad bg-bad/10" : picked === o ? "border-plum bg-blush" : "border-line bg-surface hover:border-rose",
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-line text-xs font-bold text-muted">{k + 1}</span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Match({ pairs, setChecker }: { pairs: { de: string; x: string }[]; setChecker: (c: Checker) => void }) {
  const left = useMemo(() => [...pairs].sort(() => 0.5 - Math.random()), [pairs]); // eslint-disable-line react-hooks/purity -- shuffled once per exercise
  const right = useMemo(() => [...pairs].sort(() => 0.5 - Math.random()), [pairs]); // eslint-disable-line react-hooks/purity -- shuffled once per exercise
  const [sel, setSel] = useState<{ side: "de" | "x"; i: number } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tap = (side: "de" | "x", i: number) => {
    const pair = side === "de" ? left[i] : right[i];
    if (done.includes(pair.de)) return;
    if (side === "de") speakGerman(pair.de);
    if (!sel || sel.side === side) return setSel({ side, i });
    const other = sel.side === "de" ? left[sel.i] : right[sel.i];
    if (other.de === pair.de) {
      const next = [...done, pair.de];
      setDone(next);
      playRight();
      if (next.length === pairs.length) setChecker(() => ({ ok: mistakes === 0, answer: "All pairs matched" }));
    } else {
      setMistakes((m) => m + 1);
      setWrong(`${side}-${i}`);
      playWrong();
      setTimeout(() => setWrong(null), 450);
    }
    setSel(null);
  };

  const cell = (side: "de" | "x", i: number, text: string, de: string) => {
    const isDone = done.includes(de);
    const isSel = sel?.side === side && sel.i === i;
    return (
      <button
        key={`${side}-${i}`}
        type="button"
        aria-label={`Pair: ${text}`}
        disabled={isDone}
        onClick={() => tap(side, i)}
        className={cx(
          "min-h-16 rounded-2xl border-2 border-b-4 px-3 py-3 text-center font-semibold transition",
          isDone ? "border-transparent bg-good/10 text-good opacity-60" : isSel ? "border-plum bg-blush text-plum" : wrong === `${side}-${i}` ? "anim-shake border-bad bg-bad/10" : "border-line bg-surface hover:border-rose",
        )}
      >
        {text}
      </button>
    );
  };

  return (
    <div>
      <h2 className="text-center text-xl font-extrabold">Tap the matching pairs</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="grid gap-3">{left.map((p, i) => cell("de", i, p.de, p.de))}</div>
        <div className="grid gap-3">{right.map((p, i) => cell("x", i, p.x, p.de))}</div>
      </div>
    </div>
  );
}

function Build({ word, tiles, answer, lang, locked, setChecker }: { word: Word; tiles: string[]; answer: string[]; lang: Lang; locked: boolean; setChecker: (c: Checker) => void }) {
  const [built, setBuilt] = useState<number[]>([]);
  const update = (b: number[]) => {
    setBuilt(b);
    setChecker(b.length ? () => ({ ok: b.map((k) => tiles[k]).join(" ") === answer.join(" "), answer: word.de }) : null);
  };
  return (
    <div>
      <h2 className="text-center text-xl font-extrabold">Build it in German</h2>
      <p className="mt-6 text-center text-2xl font-bold text-ink">{meaning(word, lang)}</p>
      <div className="mt-6 flex min-h-16 flex-wrap items-center gap-2 border-b-2 border-dashed border-rose-soft pb-3" aria-label="Your answer">
        {built.map((k, pos) => (
          <button key={k} type="button" disabled={locked} onClick={() => update(built.filter((_, i) => i !== pos))} className="rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-2 font-semibold">
            {tiles[k]}
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {tiles.map((t, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Word: ${t}`}
            disabled={built.includes(k) || locked}
            onClick={() => update([...built, k])}
            className={cx("rounded-xl border-2 border-b-4 px-3 py-2 font-semibold transition", built.includes(k) ? "border-transparent bg-line/40 text-transparent" : "border-line bg-surface hover:border-rose")}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Spell({ step, locked, setChecker }: { step: Extract<DuoStep, { kind: "spell" }>; locked: boolean; setChecker: (c: Checker) => void }) {
  const [text, setText] = useState("");
  const update = (t: string) => {
    setText(t);
    setChecker(t.trim() ? () => {
      const v = checkTypedAnswer(t, step.answer);
      return { ok: isAccepted(v), typo: v === "typo", answer: step.answer };
    } : null);
  };
  return (
    <div>
      <h2 className="text-center text-xl font-extrabold">Type it in German</h2>
      <p className="mt-6 text-center text-2xl font-bold text-ink">{step.prompt}</p>
      <p className="mt-3 text-center font-mono text-xl tracking-wider text-plum" aria-label={`Hint: starts with ${step.answer[0]}`}>
        {step.hint}
      </p>
      <input className={cx(fieldClass, "mt-5 text-center text-xl")} value={text} onChange={(e) => update(e.target.value)} disabled={locked} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Auf Deutsch…" aria-label="Your answer in German" />
      <div className="mt-3 flex justify-center gap-2">
        {["ä", "ö", "ü", "ß"].map((u) => (
          <button key={u} type="button" disabled={locked} onClick={() => update(text + u)} aria-label={`Insert ${u}`} className="rounded-xl border-2 border-b-4 border-line bg-surface px-4 py-2 text-lg font-bold">
            {u}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Small typos are OK. ae = ä, oe = ö, ue = ü, ss = ß.</p>
    </div>
  );
}
