import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { LevelPicker } from "../components/pickers";
import { SentenceBuilder } from "../components/SentenceBuilder";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { LEVELS, type LevelId } from "../core/content/levels";
import { pickSentences, sentencesFor, type Sentence } from "../core/lib/sentences";
import { useProgress, XP } from "../web/progress";

const ROUNDS = 6;

/** German word order, learned by doing: tap the tiles into a sentence. */
export default function Builder() {
  const { state, practiced, log } = useProgress();
  const p = state.partners[state.learner];
  const [level, setLevel] = useState<LevelId>(LEVELS[p.unlocked].id);
  const [round, setRound] = useState<{ list: Sentence[]; k: number; right: number } | null>(null);

  if (round && round.k < round.list.length) {
    return (
      <AppShell focus>
        <PageHeader title={`Word builder · ${round.k + 1} / ${round.list.length}`} />
        <SentenceBuilder
          key={round.k}
          sentence={round.list[round.k]}
          lang={p.lang}
          onDone={(ok) => setRound({ ...round, k: round.k + 1, right: round.right + (ok ? 1 : 0) })}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Script className="text-4xl">Word builder 🧩</Script>
        <p className="mb-4 text-muted">German puts its words in a special order — the verb second, and after “weil” at the very end. Build real sentences to feel it.</p>
        {round ? (
          <Card className="mb-5 text-center anim-pop-in">
            <p className="text-4xl">🧩</p>
            <p className="mt-1 text-xl font-bold">
              {round.right} of {round.list.length} sentences right!
            </p>
          </Card>
        ) : null}
        <LevelPicker value={level} onChange={setLevel} unlocked={p.unlocked} />
        <p className="mb-4 mt-2 text-sm text-muted">Sentences from {level === "A1" ? "A1" : `A1 up to ${level}`}. Higher levels have longer sentences.</p>
        <Button
          size="lg"
          full
          onClick={() => {
            if (round) {
              practiced(state.learner, round.right * XP.correctAnswer);
            }
            const list = pickSentences(sentencesFor(level, 3, level <= "A2" ? 6 : 9), ROUNDS);
            if (round) log("🧩", `Word builder: ${round.right} of ${round.list.length}`);
            setRound({ list, k: 0, right: 0 });
          }}
        >
          {round ? "Play again" : "Start"}
        </Button>
      </div>
    </AppShell>
  );
}
