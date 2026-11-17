import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Missing } from "../components/NotFound";
import { Recorder } from "../components/Recorder";
import { Button, Card, Chip, cx, fieldClass, PageHeader, Script, Speak } from "../components/ui";
import { findRoleplay, type Roleplay } from "../core/content/extras";
import { meaning } from "../core/content/levels";
import { allowedTypos, levenshtein, normalizeAnswer } from "../core/lib/answers";
import { useId } from "../web/nav";
import { partnerName, useProgress, XP, type PartnerIndex } from "../web/progress";

export default function RoleplayPage() {
  const id = useId();
  const rp = id ? findRoleplay(id) : undefined;
  if (id === null) return <Missing loading />;
  if (!rp) return <Missing />;
  return <Scene key={rp.id} rp={rp} />;
}

/** Close enough to the model answer? (Small typos and punctuation don't matter.) */
const closeEnough = (typed: string, model: string) => {
  const a = normalizeAnswer(typed);
  const b = normalizeAnswer(model);
  return !!a && levenshtein(a, b) <= Math.max(allowedTypos(b.length), Math.floor(b.length / 10));
};

/** A real-life mini game: each of you gets a task card, and builds the German yourselves. Then swap. */
function Scene({ rp }: { rp: Roleplay }) {
  const { state, practiced, did, log } = useProgress();
  const [swapped, setSwapped] = useState(false);
  const [turn, setTurn] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<null | "ok" | "close" | "shown">(null);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<"type" | "say">("type");
  const done = turn >= rp.turns.length;
  const who = (w: "a" | "b"): PartnerIndex => ((w === "a") !== swapped ? 0 : 1);
  const t = rp.turns[turn];
  const person = t ? who(t.who) : 0;
  const lang = state.partners[person].lang;

  const next = () => {
    setTurn(turn + 1);
    setTyped("");
    setResult(null);
    if (turn + 1 >= rp.turns.length) {
      practiced(state.learner, XP.dialogue + score * XP.correctAnswer);
      did(state.learner, "talk");
      log("🎭", `Role-play “${rp.title}”`);
    }
  };

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${rp.emoji} ${rp.title}`} />
        <div className="mb-4 grid grid-cols-2 gap-3 text-center text-sm">
          {(["a", "b"] as const).map((w) => (
            <div key={w} className={cx("rounded-2xl p-3", who(w) === 0 ? "bg-blush" : "bg-[#e6eefb]")}>
              <p className="font-bold">{partnerName(state, who(w))}</p>
              <p className="text-muted">{meaning(rp.roles[w], state.partners[who(w)].lang)}</p>
            </div>
          ))}
        </div>

        {/* What's been said so far */}
        <div className="mb-4 space-y-2">
          {rp.turns.slice(0, turn).map((x, k) => (
            <div key={k} className={cx("max-w-[86%] rounded-3xl px-4 py-2.5", who(x.who) === 1 ? "ml-auto rounded-br-md bg-[#e6eefb]" : "mr-auto rounded-bl-md bg-blush")}>
              <div className="flex items-center gap-2">
                <p className="flex-1">{x.de}</p>
                <Speak text={x.de} />
              </div>
            </div>
          ))}
        </div>

        {done ? (
          <Card className="text-center anim-pop-in">
            <p className="text-5xl">🎭</p>
            <Script className="mt-1 text-3xl">Toll gespielt!</Script>
            <p className="text-muted">
              {score} of {rp.turns.length} lines built on your own.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setSwapped(!swapped);
                  setTurn(0);
                  setScore(0);
                }}
              >
                Switch roles ⇄
              </Button>
              <Button variant="soft" href="/talk">
                Other scenes
              </Button>
            </div>
          </Card>
        ) : (
          <Card className={person === 0 ? "border-rose-soft" : "border-partner/40"}>
            <p className="text-xs font-bold uppercase tracking-wider text-rose">
              {partnerName(state, person)} · {meaning(rp.roles[t.who], lang)}
            </p>
            <p className="mt-1 text-xl font-bold">📝 {meaning(t.task, lang)}</p>
            <div className="mt-2 flex gap-2">
              <Chip selected={mode === "type"} onClick={() => setMode("type")}>
                ✍️ Type it
              </Chip>
              <Chip selected={mode === "say"} onClick={() => setMode("say")}>
                🗣️ Say it
              </Chip>
            </div>
            {result === null ? (
              mode === "type" ? (
                <form
                  className="mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!typed.trim()) return;
                    const ok = closeEnough(typed, t.de);
                    if (ok) setScore(score + 1);
                    setResult(ok ? "ok" : "close");
                  }}
                >
                  <input className={fieldClass} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Your line in German" placeholder="Auf Deutsch…" autoFocus autoCorrect="off" spellCheck={false} />
                  <div className="mt-3 flex gap-2">
                    <Button type="submit" disabled={!typed.trim()}>
                      Check
                    </Button>
                    <Button variant="ghost" onClick={() => setResult("shown")}>
                      Show me
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3">
                  <p className="mb-2 text-sm text-muted">Say your line out loud to {partnerName(state, person === 0 ? 1 : 0)}. Record it if you like.</p>
                  <Recorder className="!justify-start" />
                  <Button className="mt-3" onClick={() => setResult("shown")}>
                    Check my line
                  </Button>
                </div>
              )
            ) : (
              <div className={cx("mt-3 rounded-2xl p-4 anim-pop-in", result === "ok" ? "bg-good/12" : "bg-blush")}>
                <p className={cx("font-bold", result === "ok" ? "text-good" : "text-plum")}>{result === "ok" ? "Perfekt! ✓" : result === "close" ? "Nearly! A natural way to say it:" : "A natural way to say it:"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="flex-1 text-lg">{t.de}</p>
                  <Speak text={t.de} />
                </div>
                <div className="mt-3 flex gap-2">
                  {result === "shown" && mode === "say" ? (
                    <Button
                      variant="good"
                      onClick={() => {
                        setScore(score + 1);
                        next();
                      }}
                    >
                      I said it ✓
                    </Button>
                  ) : null}
                  <Button variant={result === "shown" && mode === "say" ? "soft" : "primary"} onClick={next}>
                    {turn + 1 >= rp.turns.length ? "Finish" : `Next: ${partnerName(state, who(rp.turns[turn + 1].who))}`}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
