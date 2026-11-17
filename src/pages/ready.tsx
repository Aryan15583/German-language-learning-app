import { Lock } from "lucide-react";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, cx, fieldClass, PageHeader, Script, Speak } from "../components/ui";
import { BERLIN_READY, READY_LEVEL, type ReadyDay } from "../core/content/berlin";
import { readyAnswerOk, readyOpen } from "../core/lib/ready";
import { useProgress, XP } from "../web/progress";

/** ✈️ Berlin Ready: a whole trip in German. No translations, no multiple choice. */
export default function Ready() {
  const { state } = useProgress();
  const p = state.partners[state.learner];
  const open = readyOpen(p);
  const [day, setDay] = useState<ReadyDay | null>(null);
  if (day) return <Day key={day.day} day={day} onExit={() => setDay(null)} />;
  const finished = p.ready >= BERLIN_READY.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Script className="text-4xl">Berlin Ready ✈️</Script>
        <p className="text-muted">The final challenge: seven days in Berlin. No translations. No multiple choice. Just real situations — in German.</p>
        {finished ? (
          <Card className="mt-5 bg-gradient-to-br from-card to-blush py-8 text-center">
            <p className="text-5xl">🇩🇪❤️</p>
            <Script className="mt-2 text-4xl">Gemeinsam geschafft.</Script>
            <p className="text-muted">You are Berlin Ready!</p>
          </Card>
        ) : null}
        {!open ? (
          <Card className="mt-5 text-center">
            <Lock className="mx-auto text-muted" />
            <p className="mt-2 font-bold">Opens after the {READY_LEVEL} big test</p>
            <p className="text-sm text-muted">Keep going with ▶ Start — you’ll get there.</p>
          </Card>
        ) : null}
        <ol className="mt-5 grid gap-3">
          {BERLIN_READY.map((d) => {
            const done = p.ready >= d.day;
            const available = open && p.ready >= d.day - 1;
            return (
              <li key={d.day}>
                <button
                  type="button"
                  disabled={!available}
                  onClick={() => setDay(d)}
                  className={cx("flex w-full items-center gap-4 rounded-3xl border border-line/70 bg-card/90 p-4 text-left shadow-card transition", available ? "hover:border-rose" : "opacity-50")}
                >
                  <span className={cx("grid h-12 w-12 place-items-center rounded-full text-2xl", done ? "bg-gold" : "bg-blush")}>{d.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-xs font-bold uppercase tracking-wider text-rose">Tag {d.day}</span>
                    <span className="block font-bold">{d.title}</span>
                  </span>
                  <span className="text-sm text-muted">{done ? "✓" : available ? "Los!" : "🔒"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </AppShell>
  );
}

function Day({ day, onExit }: { day: ReadyDay; onExit: () => void }) {
  const { state, finishReadyDay, practiced, log } = useProgress();
  const [k, setK] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [right, setRight] = useState(0);
  const prompt = day.prompts[k];

  if (!prompt) {
    const passed = right >= day.prompts.length - 1;
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-6xl">{passed ? day.emoji : "💪"}</p>
          <Script className="mt-2 text-4xl">{passed ? `Tag ${day.day} geschafft!` : "Fast!"}</Script>
          <p className="text-muted">
            {right} / {day.prompts.length}
          </p>
          <Button size="lg" full className="mt-5" onClick={onExit}>
            {passed ? "Weiter" : "Zurück"}
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell focus>
      <div className="mx-auto max-w-xl">
        <PageHeader title={`Tag ${day.day} · ${day.title}`} />
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-rose">
            {day.emoji} {k + 1} / {day.prompts.length}
          </p>
          <p className="mt-2 text-xl font-bold">{prompt.ask}</p>
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!typed.trim() || result !== null) return;
              const ok = readyAnswerOk(typed, prompt);
              setResult(ok);
              if (ok) setRight(right + 1);
            }}
          >
            <input className={fieldClass} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={result !== null} aria-label="Deine Antwort" placeholder="Deine Antwort…" autoFocus autoCorrect="off" spellCheck={false} />
            {result === null ? (
              <Button type="submit" className="mt-3" disabled={!typed.trim()}>
                Prüfen
              </Button>
            ) : null}
          </form>
          {result !== null ? (
            <div className={cx("mt-4 rounded-2xl p-4 anim-pop-in", result ? "bg-good/12" : "bg-blush")}>
              <p className={cx("font-bold", result ? "text-good" : "text-plum")}>{result ? "Sehr gut!" : "Zum Beispiel:"}</p>
              <div className="flex items-center gap-2">
                <p className="flex-1">{prompt.model}</p>
                <Speak text={prompt.model} />
              </div>
              <Button
                className="mt-3"
                onClick={() => {
                  if (k + 1 >= day.prompts.length) {
                    const finalRight = right;
                    if (finalRight >= day.prompts.length - 1) {
                      finishReadyDay(state.learner, day.day);
                      practiced(state.learner, XP.chatDone + finalRight * XP.correctAnswer);
                      log(day.emoji, day.day === 7 ? "Berlin Ready! Gemeinsam geschafft ❤️" : `Berlin Ready · Tag ${day.day}`);
                    }
                  }
                  setK(k + 1);
                  setTyped("");
                  setResult(null);
                }}
              >
                Weiter
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
