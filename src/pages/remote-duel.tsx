import { useRouter } from "next/router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { DuelRun } from "../components/DuelRun";
import { Button, Card, PageHeader, Script, Spinner } from "../components/ui";
import { newId } from "../core/lib/crypto";
import { duelInfo } from "../core/lib/duels";
import { couple, partnerName, useProgress, XP, type SendResult } from "../web/progress";
import { shareText } from "../web/share";

/**
 * A duel on two phones. Start one with ?topic=…, or answer one with ?id=….
 * Both get the same questions (same seed), each in their own language.
 */
export default function RemoteDuelPage() {
  const router = useRouter();
  if (!router.isReady) return <Spinner />;
  const q = router.query;
  return <RemoteDuel id={typeof q.id === "string" ? q.id : ""} topic={typeof q.topic === "string" ? q.topic : ""} />;
}

function RemoteDuel({ id, topic }: { id: string; topic: string }) {
  const { state, playRemoteDuel, practiced, log, did } = useProgress();
  const existing = id ? state.remoteDuels.find((d) => d.id === id) : undefined;
  const [setup] = useState(() => (existing ? { id: existing.id, topic: existing.topic, seed: existing.seed } : { id: newId(), topic, seed: Math.floor(Math.random() * 2 ** 31) }));
  const info = duelInfo(setup.topic);
  const [phase, setPhase] = useState<"play" | "sending" | "done">("play");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<SendResult | null>(null);
  const [shareNote, setShareNote] = useState("");

  const title = info ? `🌍 ${info.title}` : "Duel";
  if (!couple.isLinked(state)) {
    return (
      <Wrap title={title}>
        <div className="text-center">
          <Script className="text-4xl">Link your phones first</Script>
          <p className="mt-2 text-muted">Duels on two phones need your phones linked. Open Couple to get or enter a partner code.</p>
          <Button href="/us" className="mt-4">
            Go to Us
          </Button>
        </div>
      </Wrap>
    );
  }
  if (!info || (existing && existing.scores[0] !== null && phase === "play")) {
    return (
      <Wrap title={title}>
        <div className="text-center">
          <Script className="text-4xl">{info ? "You already played this one" : "Duel not found"}</Script>
          <Button href="/us" className="mt-4">
            Back to chat
          </Button>
        </div>
      </Wrap>
    );
  }

  if (phase === "play") {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-2xl">
          <PageHeader title={`🌍 ${info.title}`} />
          <Card className="mb-4 bg-blush/70">
            {existing
              ? `🌍 ${partnerName(state, 1)} scored ${existing.scores[1]} points. Can you beat it?`
              : `🌍 Play now — ${partnerName(state, 1)} gets the exact same questions on their phone.`}
          </Card>
          <DuelRun
            raw={setup.topic}
            seed={setup.seed}
            lang={state.partners[0].lang}
            label={`${partnerName(state, 0)}’s turn`}
            onFinish={async (correct) => {
              setScore(correct);
              setPhase("sending");
              practiced(0, correct * XP.duelCorrect);
              did(0, "duel");
              log("⚔️", `Played a duel: ${info.title} (${correct} points)`);
              const r = await playRemoteDuel({ id: setup.id, topic: setup.topic, seed: setup.seed, score: correct });
              setResult(r);
              setPhase("done");
            }}
          />
        </div>
      </AppShell>
    );
  }
  if (phase === "sending") {
    return (
      <Wrap title={title}>
        <Spinner label="Sending your score…" />
        <p className="text-center text-muted">Sending your score…</p>
      </Wrap>
    );
  }

  const duel = state.remoteDuels.find((d) => d.id === setup.id);
  const status = duel ? couple.duelStatus(duel) : null;
  const theirs = duel?.scores[1];
  return (
    <Wrap title={title}>
      <div className="text-center anim-fade-up">
        <p className="mt-4 text-6xl">{status === "won" ? "🏆" : status === "lost" ? "💪" : status === "tie" ? "🤝" : "📨"}</p>
        <Script className="mt-2 text-4xl">
          {status === "won" ? "Du gewinnst! You win!" : status === "lost" ? `${partnerName(state, 1)} gewinnt!` : status === "tie" ? "Unentschieden!" : `You scored ${score} points`}
        </Script>
        {theirs !== null && theirs !== undefined ? (
          <Card className="mt-5 flex justify-around">
            {([0, 1] as const).map((i) => (
              <div key={i}>
                <p className={i ? "text-4xl font-extrabold text-partner" : "text-4xl font-extrabold text-plum"}>{duel?.scores[i]}</p>
                <p className="text-muted">{partnerName(state, i)}</p>
              </div>
            ))}
          </Card>
        ) : null}
        {result?.delivered ? (
          <p className="my-4 text-muted">{status === "their-turn" ? `Sent! ${partnerName(state, 1)} will see your challenge in their app.` : "Your result was sent."}</p>
        ) : result ? (
          <Card className="my-4">
            <p className="mb-2 text-muted">{result.error ? `⚠️ ${result.error} ` : ""}Share your duel as a secure link:</p>
            <Button
              onClick={async () => {
                const r = await shareText(`⚔️ Zwei Herzen ♡ duel — your turn!\n${result.link}`);
                setShareNote(r === "copied" ? "Copied — paste it to your partner." : "Sent!");
              }}
            >
              Share duel link
            </Button>
            {shareNote ? <p className="mt-2 text-sm text-muted">{shareNote}</p> : null}
          </Card>
        ) : null}
        <Button variant="soft" href="/us" className="mt-2">
          Back to chat
        </Button>
      </div>
    </Wrap>
  );
}

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={title} />
        {children}
      </div>
    </AppShell>
  );
}
