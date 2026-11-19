import { useRouter } from "next/router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { DuoLesson, type DuoResult } from "../components/DuoLesson";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Button, Card, Script } from "../components/ui";
import { levelWords, type Level, type Topic, type Word } from "../core/content/levels";
import { chunks, duoLesson, nextChunk } from "../core/lib/duo";
import { shuffle } from "../core/lib/util";
import { useId } from "../web/nav";
import { couple, partnerName, useProgress, XP } from "../web/progress";
import { duelInfo, encodeDuel } from "../core/lib/duels";
import { playDone } from "../web/sound";
import { lessonById } from "../web/topics";

export default function LessonPage() {
  const id = useId();
  const { state } = useProgress();
  // Starting the next small lesson of the same unit keeps the same address, so remount by hand.
  const [round, setRound] = useState(0);
  const again = () => setRound((r) => r + 1);
  if (id === null) return <Missing loading />;
  if (id === "ours") {
    const words = state.customWords;
    if (words.length < 2) return <Missing />;
    return <Lesson key={`ours-${round}`} onNext={again} topic={{ id: "ours", title: "Our words", emoji: "💞", tip: { title: "", body: "" }, compare: { en: "", mr: "" }, words }} others={words} />;
  }
  const found = lessonById(id);
  if (!found) return <Missing />;
  return <Lesson key={`${found.topic.id}-${round}`} onNext={again} topic={found.topic} others={levelWords(found.level)} level={found.level} />;
}

/** A super-easy lesson: the next 3–4 new words of this unit (or a quick review when you know them all). */
function Lesson({ topic, others, onNext }: { topic: Topic; others: Word[]; level?: Level; onNext: () => void }) {
  const router = useRouter();
  const { state, markKnown, practiced, remember, markPractised, log, send, accountMode } = useProgress();
  const [shared, setShared] = useState<"no" | "sending" | "yes" | "failed">("no");
  const learner = state.learner;
  const p = state.partners[learner];
  const [plan] = useState(() => {
    const c = nextChunk(topic.words.length, p.known[topic.id] ?? []);
    if (c) return { ...c, review: false };
    // Everything known: a quick review of a few words.
    const all = chunks(topic.words.length);
    return { part: 1, parts: all.length, indexes: shuffle(topic.words.map((_, i) => i)).slice(0, 4), review: true };
  });
  const [steps] = useState(() => duoLesson(plan.indexes.map((i) => topic.words[i]), others, p.lang));
  const [result, setResult] = useState<DuoResult | null>(null);
  const exit = topic.id === "ours" ? "/words" : topic.id.startsWith("berlin-") ? "/journey" : `/unit?id=${topic.id}`;

  if (result) {
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 100;
    const mins = Math.max(1, Math.round(result.ms / 60000));
    const lastPart = !plan.review && plan.part >= plan.parts;
    const following = topic.id === "ours" ? null : nextChunk(topic.words.length, p.known[topic.id] ?? []);
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-7xl anim-beat">🎉</p>
          <Script className="mt-2 text-4xl">{plan.review ? "Schön wiederholt!" : "Lektion geschafft!"}</Script>
          <p className="text-muted">{plan.review ? "Your words are fresh again." : `${plan.indexes.length} new words learned${plan.parts > 1 ? ` · lesson ${plan.part} of ${plan.parts}` : ""}`}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="XP" value={`+${10 + result.correct * XP.correctAnswer}`} tone="text-gold" />
            <Stat label="Right" value={`${pct}%`} tone="text-good" />
            <Stat label="Time" value={`${mins} min`} tone="text-plum" />
          </div>
          <div className="mt-6">
            {topic.id === "ours" ? (
              <Button size="lg" full href="/words">
                Back to our words
              </Button>
            ) : following && !plan.review ? (
              <Button size="lg" full variant="good" onClick={onNext}>
                ▶ Next: lesson {following.part} of {following.parts}
              </Button>
            ) : topic.id.startsWith("berlin-") && lastPart ? (
              <Button size="lg" full variant="good" href={`/quiz?id=${topic.id}`}>
                ✏️ Quiz → Berlin postcard
              </Button>
            ) : (
              <KeepGoing />
            )}
          </div>
          {topic.id !== "ours" && duelInfo(topic.id) && (couple.isLinked(state) || (!accountMode && state.partners[1].name)) ? (
            <Button
              variant="partner"
              full
              className="mt-3"
              href={couple.isLinked(state) ? `/remote-duel?topic=${encodeDuel("classic", topic.id)}` : `/duel?id=${encodeDuel("classic", topic.id)}`}
            >
              ⚔️ Challenge {partnerName(state, learner === 0 ? 1 : 0)} on these words
            </Button>
          ) : null}
          {couple.isLinked(state) ? (
            <Button
              variant="soft"
              full
              className="mt-3"
              disabled={shared !== "no"}
              onClick={async () => {
                setShared("sending");
                const text = `🎉 Ich habe eine Lektion geschafft! I finished “${topic.title}” (${pct}% right). Du bist dran! ❤️`;
                try {
                  const r = await send(state.vanish === "off" ? { kind: "msg", text } : { kind: "msg", text, vanish: state.vanish });
                  setShared(r.delivered ? "yes" : "failed");
                } catch {
                  setShared("failed");
                }
              }}
            >
              {shared === "yes" ? "Sent to your partner ❤️" : shared === "failed" ? "Saved in Us — open it to send 💬" : shared === "sending" ? "Sending…" : "❤️ Share with my partner"}
            </Button>
          ) : null}
          <Button variant="ghost" className="mt-3" onClick={() => router.push("/")}>
            I’m done for now
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <DuoLesson
      steps={steps}
      lang={p.lang}
      title={`${topic.title}${plan.parts > 1 && !plan.review ? ` · lesson ${plan.part} of ${plan.parts}` : plan.review ? " · review" : ""}`}
      emoji={topic.emoji}
      exit={exit}
      onAnswer={(de, ok) => remember(learner, de, ok)}
      onFinish={(r) => {
        if (!plan.review && topic.id !== "ours") {
          for (const i of plan.indexes) markKnown(learner, topic.id, i, topic.words[i].de);
          // The lesson already practised hearing, saying, typing and using the words.
          if (plan.part >= plan.parts) markPractised(learner, topic.id);
        }
        practiced(learner, 10 + r.correct * XP.correctAnswer);
        log(topic.emoji, plan.review ? `Reviewed “${topic.title}”` : `Finished lesson ${plan.part} of “${topic.title}”`);
        playDone();
        setResult(r);
      }}
    />
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card className="p-3">
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
    </Card>
  );
}
