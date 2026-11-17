import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Chip, cx, fieldClass, PageHeader, Script, Speak } from "../components/ui";
import { LEVELS, meaning, type Lang } from "../core/content/levels";
import { allowedTypos, levenshtein, normalizeAnswer } from "../core/lib/answers";
import { TOGETHER_MODES, TOGETHER_ROUNDS, togetherRound, type Round, type TogetherMode } from "../core/lib/together";
import { couple, partnerName, today, useProgress, XP } from "../web/progress";

type Role = "a" | "b";

/** Couple learning mode: some lessons need both of you. Each phone shows only its own half. */
export default function Together() {
  const { state, accountMode, practiced, did, log } = useProgress();
  const linked = couple.isLinked(state);
  const shared = !accountMode && !linked && !!state.partners[1].name;
  const [mode, setMode] = useState<TogetherMode | null>(null);
  const [role, setRole] = useState<Role>(linked ? (state.couple?.role === "joiner" ? "b" : "a") : state.learner === 1 ? "b" : "a");
  const [round, setRound] = useState(1);
  const [hearts, setHearts] = useState(0);
  const [covered, setCovered] = useState(false);
  const levelIdx = Math.min(state.partners[0].unlocked, state.partners[1].unlocked);
  const level = LEVELS[levelIdx];
  const nameOf = (r: Role) => (linked ? (r === role ? partnerName(state, 0) : partnerName(state, 1)) : partnerName(state, r === "a" ? 0 : 1));
  const langOf = (r: Role): Lang => (linked ? state.partners[r === role ? 0 : 1].lang : state.partners[r === "a" ? 0 : 1].lang);

  if (!mode) {
    return (
      <AppShell>
        <Script className="text-4xl">Learn together 💞</Script>
        <p className="text-muted">These games need both of you. Each phone shows only its own half — so you have to talk (in German!) to solve them.</p>
        <p className="mt-1 text-sm text-muted">
          {linked
            ? "On two phones: open the same game and round. You don't need to send anything — just call or sit together."
            : shared
              ? "On one phone: take turns looking. Or open the app on a second phone and pick the other role."
              : "Best with your partner on a second phone (or call each other). Pick the same game and round."}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOGETHER_MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)} className="rounded-3xl border border-line/70 bg-card/90 p-5 text-left shadow-card transition hover:border-rose">
              <p className="text-3xl">{m.emoji}</p>
              <p className="mt-1 font-bold">{m.title}</p>
              <p className="text-sm text-muted">{m.desc}</p>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  const info = TOGETHER_MODES.find((m) => m.id === mode)!;
  const r = togetherRound(mode, level.id, today(), round);
  const finish = () => {
    practiced(state.learner, XP.dialogue + hearts * 2);
    did(state.learner, "talk");
    log("💞", `Learned together: ${info.title}`);
    setMode(null);
    setRound(1);
    setHearts(0);
  };

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${info.emoji} ${info.title}`} />
        <Card className="mb-4 flex flex-wrap items-center gap-2 py-3">
          <span className="text-sm font-semibold text-muted">I am</span>
          {(["a", "b"] as Role[]).map((x) => (
            <Chip
              key={x}
              selected={role === x}
              onClick={() => {
                setRole(x);
                setCovered(shared);
              }}
            >
              {x.toUpperCase()} · {linked ? (x === role ? "me" : partnerName(state, 1)) : nameOf(x)}
            </Chip>
          ))}
          <span className="ml-auto text-sm text-muted">
            {level.id} · Round {round}/{TOGETHER_ROUNDS} · ❤️ {hearts}
          </span>
        </Card>
        <p className="mb-3 text-center text-xs text-muted">Both phones: same game, {level.id}, round {round} → same puzzle.</p>

        {covered ? (
          <Card className="py-10 text-center">
            <p className="text-5xl">🙈</p>
            <p className="mt-2 text-lg font-bold">Pass the phone to {nameOf(role)}</p>
            <Button className="mt-4" onClick={() => setCovered(false)}>
              <Eye size={18} /> Show my half
            </Button>
          </Card>
        ) : (
          <Half key={`${mode}-${round}-${role}`} r={r} role={role} lang={langOf(role)} nameOf={nameOf} onHeart={() => setHearts(hearts + 1)} />
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button variant="soft" disabled={round <= 1} onClick={() => setRound(round - 1)} aria-label="Previous round">
            <ChevronLeft size={18} />
          </Button>
          {round < TOGETHER_ROUNDS ? (
            <Button
              full
              onClick={() => {
                setRound(round + 1);
                setCovered(false);
              }}
            >
              Next round <ChevronRight size={18} />
            </Button>
          ) : (
            <Button full variant="good" onClick={finish}>
              Finish · +{XP.dialogue + hearts * 2} XP
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const closeEnough = (typed: string, model: string) => {
  const a = normalizeAnswer(typed);
  const b = normalizeAnswer(model);
  return !!a && levenshtein(a, b) <= Math.max(allowedTypos(b.length), Math.floor(b.length / 10));
};

function Half({ r, role, lang, nameOf, onHeart }: { r: Round; role: Role; lang: Lang; nameOf: (x: Role) => string; onHeart: () => void }) {
  const other: Role = role === "a" ? "b" : "a";
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  const check = (model: string) => (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!typed.trim() || result !== null) return;
        const ok = closeEnough(typed, model);
        setResult(ok);
        if (ok) onHeart();
      }}
    >
      <input className={fieldClass} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="The whole sentence" placeholder="Type the whole sentence together…" autoCorrect="off" spellCheck={false} disabled={result !== null} />
      {result === null ? (
        <Button type="submit" className="mt-3" disabled={!typed.trim()}>
          Check
        </Button>
      ) : (
        <div className={cx("mt-3 rounded-2xl p-4", result ? "bg-good/12" : "bg-blush")}>
          <p className={cx("font-bold", result ? "text-good" : "text-plum")}>{result ? "Zusammen geschafft! ❤️" : "Almost — here it is:"}</p>
          <div className="flex items-center gap-2">
            <p className="flex-1">{model}</p>
            <Speak text={model} />
          </div>
        </div>
      )}
    </form>
  );

  const mark = (
    <div className="mt-4 flex gap-2">
      {!marked ? (
        <>
          <Button
            variant="good"
            onClick={() => {
              setMarked(true);
              onHeart();
            }}
          >
            We got it ❤️
          </Button>
          <Button variant="soft" onClick={() => setMarked(true)}>
            Not this time
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">Saved. On to the next round!</p>
      )}
    </div>
  );

  switch (r.mode) {
    case "complete":
      return role === "a" ? (
        <Card>
          <p className="text-sm font-semibold text-muted">Your sentence has a gap. {nameOf(other)} has the missing word — ask for it!</p>
          <p className="mt-2 text-2xl font-bold">{r.prompt}</p>
          <p className="text-muted">{meaning(r.s, lang)}</p>
          {check(r.s.de)}
        </Card>
      ) : (
        <Card className="text-center">
          <p className="text-sm font-semibold text-muted">You have the missing word. Tell {nameOf(other)} — in German only!</p>
          <p className="mt-3 text-4xl font-extrabold text-plum">{r.word}</p>
          <div className="mt-2 flex justify-center">
            <Speak text={r.word} />
          </div>
        </Card>
      );
    case "arrange": {
      const tiles = role === "a" ? r.a : r.b;
      return (
        <Card>
          <p className="text-sm font-semibold text-muted">You hold half the words. {nameOf(other)} has the rest. Together, put them in order:</p>
          <p className="mt-2 text-lg font-bold">{meaning(r.s, lang)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tiles.map((t, k) => (
              <span key={k} className="rounded-xl bg-plum px-3 py-2 font-semibold text-white">
                {t}
              </span>
            ))}
          </div>
          {role === "a" ? check(r.s.de) : <p className="mt-4 text-sm text-muted">{nameOf(other)} types the finished sentence.</p>}
        </Card>
      );
    }
    case "say":
    case "swap": {
      const myLine = r.mode === "say" ? role : other;
      return (
        <Card>
          <p className="text-sm font-semibold text-muted">
            {r.d.emoji} {r.d.title} — read your lines out loud. {nameOf(other)}’s lines are hidden on your phone.
          </p>
          <div className="mt-3 space-y-2">
            {r.d.lines.map((l, k) =>
              l.who === myLine ? (
                <div key={k} className="mr-auto max-w-[88%] rounded-3xl rounded-bl-md bg-blush px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-semibold">{l.de}</p>
                    <Speak text={l.de} />
                  </div>
                  <p className="text-sm text-muted">{meaning(l, lang)}</p>
                </div>
              ) : (
                <div key={k} className="ml-auto max-w-[70%] rounded-3xl rounded-br-md bg-partner-soft px-4 py-2.5 text-sm italic text-muted">
                  🔊 {nameOf(other)} says something… listen!
                </div>
              ),
            )}
          </div>
          {mark}
        </Card>
      );
    }
    case "translate":
      return r.speaker === role ? (
        <Card className="text-center">
          <p className="text-sm font-semibold text-muted">Say this in German to {nameOf(other)}:</p>
          <p className="mt-3 text-2xl font-bold">{meaning(r.s, lang)}</p>
          <p className="mt-3 text-sm text-muted">{nameOf(other)} has the answer and will tell you if it’s right.</p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-muted">{nameOf(other)} will say this in German. Check them:</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="flex-1 text-2xl font-bold">{r.s.de}</p>
            <Speak text={r.s.de} />
          </div>
          <p className="text-muted">{meaning(r.s, lang)}</p>
          {mark}
        </Card>
      );
    case "guess":
      return (
        <Card>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xl font-bold">{r.q.de}</p>
            <Speak text={r.q.de} />
          </div>
          <p className="text-muted">{meaning(r.q, lang)}</p>
          <p className="mt-4 text-sm font-semibold">{mine === null ? "1 · Your answer (secret!)" : guess === null ? `2 · What would ${nameOf(other)} say?` : "3 · Now tell each other — in German!"}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {r.q.options.map((o) => (
              <button
                key={o.de}
                type="button"
                disabled={guess !== null}
                onClick={() => (mine === null ? setMine(o.de) : setGuess(o.de))}
                className={cx("rounded-2xl border-2 px-4 py-3 text-left", mine === o.de ? "border-plum bg-blush" : guess === o.de ? "border-partner bg-partner-soft" : "border-line bg-surface hover:border-rose")}
              >
                <span className="block font-semibold">{o.de}</span>
                <span className="block text-xs text-muted">{meaning(o, lang)}</span>
              </button>
            ))}
          </div>
          {guess !== null ? (
            <>
              <p className="mt-3 text-sm text-muted">
                Say: „Ich habe <b>{mine}</b> gewählt. Ich glaube, du sagst <b>{guess}</b>.“ Did you guess right?
              </p>
              {mark}
            </>
          ) : null}
        </Card>
      );
  }
}
