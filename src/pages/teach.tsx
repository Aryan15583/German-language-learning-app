import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { LEVELS, levelWords, meaning, type Word } from "../core/content/levels";
import { shuffle } from "../core/lib/util";
import { partnerName, useProgress, XP } from "../web/progress";

const SECONDS = 60;
/** Short words and nouns are the fun ones to explain. */
const explainable = (w: Word) => w.de.replace(/^(der|die|das)\s+/i, "").split(/\s+/).length <= 2 && !/[?!]/.test(w.de);

/** Teach your partner: explain the word in German without saying it. They guess. */
export default function Teach() {
  const { state, practiced, did, log } = useProgress();
  const me = state.partners[state.learner];
  const [deck, setDeck] = useState<Word[] | null>(null);
  const [k, setK] = useState(0);
  const [got, setGot] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const running = deck !== null && left > 0;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    const words = LEVELS.slice(0, me.unlocked + 1).flatMap(levelWords).filter(explainable);
    setDeck(shuffle(words));
    setK(0);
    setGot(0);
    setLeft(SECONDS);
  };

  if (deck && left <= 0) {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-6xl">👫</p>
          <Script className="mt-2 text-4xl">{got} words guessed!</Script>
          <p className="mt-1 text-muted">Now swap: the other one explains.</p>
          <div className="mt-5 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                practiced(state.learner, got * XP.correctAnswer + 5);
                did(state.learner, "talk");
                log("👫", `Teach your partner: ${got} words`);
                start();
              }}
            >
              Next round
            </Button>
            <Button variant="soft" href="/train">
              Done
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (deck) {
    const w = deck[k % deck.length];
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md">
          <PageHeader title="Teach your partner" />
          <div className="mb-3 flex justify-between text-sm font-semibold">
            <span>⏱️ {left}s</span>
            <span>✅ {got}</span>
          </div>
          <Card className="py-10 text-center">
            <p className="text-sm font-semibold text-muted">Explain this in German — without saying it!</p>
            <p className="mt-3 text-4xl font-extrabold text-plum">{w.de}</p>
            <p className="mt-2 text-muted">{meaning(w, me.lang)}</p>
          </Card>
          <p className="mt-3 text-center text-xs text-muted">Tips: „Das ist ein …“, „Man braucht das für …“, „Das Gegenteil von …“</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button size="lg" variant="soft" onClick={() => setK(k + 1)}>
              Skip
            </Button>
            <Button
              size="lg"
              variant="good"
              onClick={() => {
                setGot(got + 1);
                setK(k + 1);
              }}
            >
              Guessed it! ✓
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Script className="text-4xl">Teach your partner 👫</Script>
        <p className="text-muted">You see a German word. Explain it in German without saying it — {partnerName(state, state.learner === 0 ? 1 : 0)} guesses. {SECONDS} seconds, as many words as you can!</p>
        <Card className="mt-4 bg-blush/60">
          <p className="font-semibold">Example: die Sonne ☀️</p>
          <p className="text-muted">„Sie ist gelb und warm. Sie scheint am Tag.“ → „Die Sonne!“</p>
        </Card>
        <p className="mt-3 text-sm text-muted">Only the explainer looks at the screen. On a call, just share your voice.</p>
        <Button size="lg" full className="mt-5" onClick={start}>
          Start ({SECONDS}s)
        </Button>
      </div>
    </AppShell>
  );
}
