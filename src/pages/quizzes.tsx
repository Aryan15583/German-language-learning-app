import { Globe, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { LevelPicker } from "../components/pickers";
import { Button, Card, Chip, Script } from "../components/ui";
import { LEVELS, type LevelId } from "../core/content/levels";
import { DUEL_MODES, duelInfo, encodeDuel, type DuelMode } from "../core/lib/duels";
import { couple, partnerName, useProgress } from "../web/progress";

/** Couple quizzes: duel each other, on two phones (remote) or one (same phone). */
export default function Quizzes() {
  const { state, accountMode } = useProgress();
  const [levelId, setLevelId] = useState<LevelId>(LEVELS[Math.min(state.partners[0].unlocked, state.partners[1].unlocked)].id);
  const level = LEVELS.find((l) => l.id === levelId)!;
  const linked = couple.isLinked(state);
  const [mode, setMode] = useState<"remote" | "local">(linked ? "remote" : "local");
  const remote = linked && (accountMode || mode === "remote");
  const [duelMode, setDuelMode] = useState<DuelMode>("classic");
  const href = (topic: string) => (remote ? `/remote-duel?topic=${encodeDuel(duelMode, topic)}` : `/duel?id=${encodeDuel(duelMode, topic)}`);
  const remoteDuels = [...state.remoteDuels].reverse().slice(0, 8);
  const recent = state.duels.slice(-5).reverse();
  const cantPlay = accountMode && !linked;

  return (
    <AppShell>
      <Script className="text-4xl">Couple Quizzes ⚔️</Script>
      <p className="text-muted">Same questions for both of you — each in your own language. Highest score wins!</p>

      {cantPlay ? (
        <Card className="mt-5 max-w-xl">
          <p className="text-lg font-bold">🌍 Duel your partner from anywhere</p>
          <p className="my-2 text-muted">Link with your partner first: one of you gets a 6-character code in Us, the other types it in.</p>
          <Button href="/us">💞 Go to Us</Button>
        </Card>
      ) : null}

      {linked && !accountMode ? (
        <div className="mt-4 flex gap-2">
          <Chip selected={remote} onClick={() => setMode("remote")}>
            <Globe size={14} className="mr-1 inline" /> Two phones
          </Chip>
          <Chip selected={!remote} onClick={() => setMode("local")}>
            <Smartphone size={14} className="mr-1 inline" /> Same phone
          </Chip>
        </div>
      ) : null}
      {!cantPlay ? (
        <p className="mt-3 text-sm text-muted">
          {remote
            ? `Play a round here; ${partnerName(state, 1)} gets the exact same questions on their phone, wherever they are.`
            : `${partnerName(state, 0)} plays first, then hands the phone to ${partnerName(state, 1)}.`}
        </p>
      ) : null}

      {remote && remoteDuels.length ? (
        <section className="mt-5">
          <h2 className="mb-2 text-lg font-bold">🌍 Your duels</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {remoteDuels.map((d) => {
              const status = couple.duelStatus(d);
              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-bold">{duelInfo(d.topic)?.title ?? d.topic}</p>
                    <span className="font-extrabold text-plum">{d.scores[0] ?? "–"}</span>:<span className="font-extrabold text-partner">{d.scores[1] ?? "–"}</span>
                  </div>
                  <p className="text-sm text-muted">
                    {{ "your-turn": "Your turn!", "their-turn": `Waiting for ${partnerName(state, 1)}…`, won: "You won 🏆", lost: "They won 💪", tie: "Tie 🤝" }[status]}
                  </p>
                  {status === "your-turn" ? (
                    <Button size="sm" className="mt-2" href={`/remote-duel?id=${d.id}`}>
                      Play now
                    </Button>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {cantPlay ? null : (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Start a new duel</h2>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {DUEL_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={duelMode === m.id}
                onClick={() => setDuelMode(m.id)}
                className={`rounded-2xl border-2 p-3 text-left transition ${duelMode === m.id ? "border-plum bg-blush" : "border-line bg-surface hover:border-rose"}`}
              >
                <span className="block font-bold">
                  {m.emoji} {m.title}
                </span>
                <span className="block text-xs text-muted">{m.desc}</span>
              </button>
            ))}
          </div>
          <LevelPicker value={levelId} onChange={setLevelId} />
          <p className="mb-3 mt-1 text-sm text-muted">
            {level.id} · {level.name}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <TopicTile href={href(`mix-${level.id}`)} emoji="🎲" title={`Mix of ${level.id}`} sub="All lessons" />
            {level.subLevels.flatMap((sub) => sub.units.map((t) => <TopicTile key={t.id} href={href(t.id)} emoji={t.emoji} title={t.title} sub={sub.id} />))}
          </div>
        </section>
      )}

      {recent.length && !accountMode ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">Recent duels</h2>
          <Card className="divide-y divide-line/60 py-2">
            {recent.map((d, k) => (
              <div key={k} className="flex items-center gap-2 py-2">
                <span className="flex-1">{d.title}</span>
                <span className="font-extrabold text-plum">{d.scores[0]}</span>:<span className="font-extrabold text-partner">{d.scores[1]}</span>
              </div>
            ))}
          </Card>
        </section>
      ) : null}
    </AppShell>
  );
}

function TopicTile({ href, emoji, title, sub }: { href: string; emoji: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex flex-col items-center rounded-3xl border border-line/70 bg-card/90 p-4 text-center shadow-card transition hover:border-rose active:scale-[0.98]">
      <span className="text-4xl">{emoji}</span>
      <span className="mt-1 font-bold text-ink">{title}</span>
      <span className="text-xs text-muted">{sub}</span>
    </Link>
  );
}
