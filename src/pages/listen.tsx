import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Chip, cx, fieldClass, PageHeader, Script } from "../components/ui";
import { CHATS, type Reply } from "../core/content/chats";
import { LEVEL_IDS, LEVELS, meaning } from "../core/content/levels";
import { allowedTypos, levenshtein, normalizeAnswer } from "../core/lib/answers";
import { blankWord, pickSentences, sentencesFor, wordOptions, type Sentence } from "../core/lib/sentences";
import { shuffle } from "../core/lib/util";
import { useProgress, XP } from "../web/progress";
import { speakGerman } from "../web/speech";

type Mode = "easy" | "medium" | "hard" | "expert";
const MODES: { id: Mode; title: string; desc: string }[] = [
  { id: "easy", title: "Easy", desc: "Choose what you heard" },
  { id: "medium", title: "Medium", desc: "Fill in the missing word" },
  { id: "hard", title: "Hard", desc: "Type the whole sentence" },
  { id: "expert", title: "Expert", desc: "Listen once, then answer" },
];
const ROUNDS = 6;

type Item =
  | { kind: "choose"; s: Sentence; options: string[] }
  | { kind: "gap"; s: Sentence; prompt: string; answer: string; options: string[] }
  | { kind: "type"; s: Sentence }
  | { kind: "reply"; line: string; replies: Reply[]; answer: string };

function build(mode: Mode, maxLevel: string): Item[] {
  const pool = sentencesFor(maxLevel as (typeof LEVEL_IDS)[number], 3, mode === "hard" ? 7 : 10);
  if (mode === "expert") {
    const steps = CHATS.filter((c) => LEVEL_IDS.indexOf(c.level) <= LEVEL_IDS.indexOf(maxLevel as never)).flatMap((c) => c.steps);
    return shuffle(steps)
      .slice(0, ROUNDS)
      .map((st) => ({ kind: "reply", line: st.bot.de, replies: shuffle(st.replies), answer: st.replies.find((r) => r.ok)!.de }));
  }
  return pickSentences(pool, ROUNDS).map((s): Item => {
    if (mode === "easy") return { kind: "choose", s, options: shuffle([s.de, ...pickSentences(pool.filter((x) => x.de !== s.de), 3).map((x) => x.de)]) };
    if (mode === "medium") {
      const b = blankWord(s.de);
      return { kind: "gap", s, prompt: b.prompt, answer: b.answer, options: wordOptions(b.answer, pool) };
    }
    return { kind: "type", s };
  });
}

/** Listening practice: easy (choose) → medium (gap) → hard (type it all) → expert (listen once and reply). */
export default function Listen() {
  const { state, practiced, log } = useProgress();
  const p = state.partners[state.learner];
  const [mode, setMode] = useState<Mode>("easy");
  const [items, setItems] = useState<Item[] | null>(null);
  const [k, setK] = useState(0);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);

  if (items && !done) {
    return (
      <AppShell focus>
        <PageHeader title={`Listening · ${MODES.find((m) => m.id === mode)!.title} · ${k + 1} / ${items.length}`} />
        <Round
          key={k}
          item={items[k]}
          lang={p.lang}
          once={mode === "expert"}
          onDone={(ok) => {
            const r = right + (ok ? 1 : 0);
            setRight(r);
            if (k + 1 >= items.length) {
              setDone(true);
              practiced(state.learner, r * XP.correctAnswer + 5);
              log("🎧", `Listening (${mode}): ${r} of ${items.length}`);
            } else setK(k + 1);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Script className="text-4xl">Listening 🎧</Script>
        <p className="mb-4 text-muted">Train your ears with real sentences. Turn the sound on!</p>
        {done && items ? (
          <Card className="mb-5 text-center anim-pop-in">
            <p className="text-4xl">🎧</p>
            <p className="mt-1 text-xl font-bold">
              {right} of {items.length} right!
            </p>
          </Card>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cx("rounded-3xl border-2 p-4 text-left transition", mode === m.id ? "border-plum bg-blush" : "border-line bg-surface hover:border-rose")}
            >
              <p className="font-bold">{m.title}</p>
              <p className="text-sm text-muted">{m.desc}</p>
            </button>
          ))}
        </div>
        <Button
          size="lg"
          full
          className="mt-5"
          onClick={() => {
            setItems(build(mode, LEVELS[p.unlocked].id));
            setK(0);
            setRight(0);
            setDone(false);
          }}
        >
          {done ? "Play again" : "Start"}
        </Button>
      </div>
    </AppShell>
  );
}

function Round({ item, lang, once, onDone }: { item: Item; lang: "en" | "mr" | "mr-Latn"; once: boolean; onDone: (ok: boolean) => void }) {
  const audio = item.kind === "reply" ? item.line : item.s.de;
  const [plays, setPlays] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(() => speakGerman(audio), 300);
    return () => clearTimeout(t);
  }, [audio]);

  const play = () => {
    if (once && plays > 0 && ok === null) return;
    setPlays(plays + 1);
    speakGerman(audio);
  };
  const settle = (good: boolean) => setOk(good);
  const options = item.kind === "choose" ? item.options : item.kind === "gap" ? item.options : item.kind === "reply" ? item.replies.map((r) => r.de) : [];
  const answer = item.kind === "choose" ? item.s.de : item.kind === "gap" ? item.answer : item.kind === "reply" ? item.answer : item.s.de;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <p className="text-sm font-semibold text-muted">
          {item.kind === "choose" ? "Which sentence did you hear?" : item.kind === "gap" ? "Which word is missing?" : item.kind === "type" ? "Type what you hear" : "Listen once — what's the best reply?"}
        </p>
        <button
          type="button"
          aria-label="Play"
          onClick={play}
          disabled={once && plays > 0 && ok === null}
          className="mx-auto mt-3 grid h-20 w-20 place-items-center rounded-full bg-plum text-white shadow-soft hover:bg-plum-dark disabled:opacity-40"
        >
          <Volume2 size={36} />
        </button>
        {once && ok === null ? <p className="mt-2 text-xs text-muted">{plays > 0 ? "No replays in expert mode 😉" : "It plays once. Tap if you missed the start."}</p> : null}
        {item.kind === "gap" ? <p className="mt-3 text-2xl font-bold">{item.prompt}</p> : null}
      </Card>

      {item.kind === "type" ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (ok !== null || !typed.trim()) return;
            const a = normalizeAnswer(typed);
            const t = normalizeAnswer(item.s.de);
            settle(levenshtein(a, t) <= Math.max(allowedTypos(t.length), Math.floor(t.length / 12)));
          }}
        >
          <input className={fieldClass} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={ok !== null} aria-label="What you heard" placeholder="Auf Deutsch…" autoFocus autoCorrect="off" spellCheck={false} />
          {ok === null ? (
            <Button type="submit" full size="lg" className="mt-3" disabled={!typed.trim()}>
              Check
            </Button>
          ) : null}
        </form>
      ) : (
        <div className="mt-4 grid gap-3">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              aria-label={`Answer: ${o}`}
              disabled={ok !== null}
              onClick={() => {
                setPicked(o);
                settle(o === answer);
              }}
              className={cx(
                "rounded-2xl border-2 px-5 py-3 text-left font-semibold",
                ok !== null && o === answer ? "border-good bg-good/10" : ok === false && picked === o ? "border-bad bg-bad/10" : "border-line bg-surface hover:border-rose",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {ok !== null ? (
        <div aria-live="polite" className={cx("mt-5 rounded-3xl p-5 anim-pop-in", ok ? "bg-good/12" : "bg-bad/10")}>
          <p className={cx("text-lg font-extrabold", ok ? "text-good" : "text-bad")}>{ok ? "Richtig! ✓" : "Nicht ganz — not quite"}</p>
          <p className="mt-1 text-ink">{audio}</p>
          {item.kind !== "reply" ? <p className="text-sm text-muted">{meaning(item.s, lang)}</p> : <p className="text-sm text-muted">Best reply: {item.answer}</p>}
          <div className="mt-3 flex gap-2">
            <Chip onClick={() => speakGerman(audio)}>🔊 Hear again</Chip>
          </div>
          <Button full size="lg" className="mt-3" onClick={() => onDone(ok)}>
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
