import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Missing } from "../components/NotFound";
import { DuelRun } from "../components/DuelRun";
import { Button, Card, PageHeader, Script } from "../components/ui";
import { duelInfo } from "../core/lib/duels";
import { useId } from "../web/nav";
import { partnerName, today, useProgress, XP, type PartnerIndex } from "../web/progress";

export default function DuelPage() {
  const id = useId();
  const info = id ? duelInfo(id) : null;
  if (id === null || !id) return <Missing loading={id === null} />;
  if (!info) return <Missing />;
  return <Duel raw={id} info={info} />;
}

/** Same-phone duel: one plays, then hands the phone over. Same questions, each in their own language. */
function Duel({ raw, info }: { raw: string; info: NonNullable<ReturnType<typeof duelInfo>> }) {
  const { state, practiced, addDuel, log, did } = useProgress();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [player, setPlayer] = useState<PartnerIndex>(0);
  const [phase, setPhase] = useState<"handoff" | "play" | "result">("handoff");
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(0);

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={info.title} />
        {phase === "handoff" ? (
          <div className="text-center">
            <p className="mt-8 text-6xl">📱➡️</p>
            <Script className="mt-3 text-4xl">Pass the phone to {partnerName(state, player)}</Script>
            <p className="mb-6 mt-2 text-muted">{player ? `No peeking at ${partnerName(state, 0)}’s score! 🙈` : "Same questions for both of you. Viel Glück!"}</p>
            <Button size="lg" onClick={() => setPhase("play")}>
              I’m ready
            </Button>
          </div>
        ) : phase === "result" ? (
          <Result scores={scores} onRematch={() => {
            setSeed(Math.floor(Math.random() * 1e9));
            setScores([0, 0]);
            setPlayer(0);
            setRound(round + 1);
            setPhase("handoff");
          }} />
        ) : (
          <DuelRun
            key={`${round}-${player}`}
            raw={raw}
            seed={seed}
            lang={state.partners[player].lang}
            color={player ? "bg-them" : "bg-me"}
            label={`${partnerName(state, player)}’s turn`}
            onFinish={(correct) => {
              const next: [number, number] = player === 0 ? [correct, 0] : [scores[0], correct];
              setScores(next);
              if (player === 0) {
                setPlayer(1);
                setPhase("handoff");
                return;
              }
              const [a, b] = next;
              practiced(0, a * XP.duelCorrect + (a > b ? XP.duelWin : 0));
              practiced(1, b * XP.duelCorrect + (b > a ? XP.duelWin : 0));
              addDuel({ title: info.title, scores: next, date: today() });
              did(0, "duel");
              did(1, "duel");
              log("⚔️", `Duel “${info.title}”: ${a} – ${b}`);
              setPhase("result");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

function Result({ scores, onRematch }: { scores: [number, number]; onRematch: () => void }) {
  const { state } = useProgress();
  const [a, b] = scores;
  const winner: PartnerIndex | null = a === b ? null : a > b ? 0 : 1;
  return (
    <div className="text-center anim-fade-up">
      <p className="mt-4 text-6xl">{winner === null ? "🤝" : "🏆"}</p>
      <Script className="mt-2 text-4xl">{winner === null ? "Unentschieden! It’s a tie!" : `${partnerName(state, winner)} gewinnt!`}</Script>
      <Card className="mt-5 flex justify-around">
        {([0, 1] as const).map((i) => (
          <div key={i}>
            <p className={i ? "text-4xl font-extrabold text-them" : "text-4xl font-extrabold text-me"}>{scores[i]}</p>
            <p className="text-muted">{partnerName(state, i)}</p>
          </div>
        ))}
      </Card>
      <p className="my-4 text-muted">{winner === null ? "Perfectly matched 💞" : "Loser makes dinner tonight? 😉 Der Verlierer kocht heute!"}</p>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onRematch}>
          Revanche! (Rematch)
        </Button>
        <Button size="lg" variant="soft" href="/quizzes">
          Other topic
        </Button>
      </div>
    </div>
  );
}
