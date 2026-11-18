// One chat message (with reactions), plus the chat's shared options.
import { useState } from "react";
import { Button, cx, Speak } from "./ui";
import { findTopic } from "../core/content/levels";
import { REACTIONS } from "../core/lib/couplelife";
import { couple, partnerName, useProgress, type ChatItem } from "../web/progress";

export const VANISH_OPTIONS: { id: "off" | "seen" | "1d" | "30d"; label: string; hint: string }[] = [
  { id: "off", label: "Off", hint: "" },
  { id: "seen", label: "👁 After seen", hint: "Deleted on both phones as soon as your partner has read it and leaves the chat." },
  { id: "1d", label: "1 day", hint: "Deleted on both phones 24 hours after sending." },
  { id: "30d", label: "30 days", hint: "Deleted on both phones 30 days after sending." },
];

export const QUICK = ["Gut gemacht! 👏", "Ich bin stolz auf dich ❤️", "Du schaffst das! 💪", "Lass uns lernen! 📚", "Guten Morgen, Schatz! ☀️", "Ich vermisse dich 💞", "Ich liebe dich", "Schlaf gut! 🌙"];

/** Our journey: link phones with a code, then chat, battle and share. */
export function ChatRow({ m, myStreak, now }: { m: ChatItem; myStreak: number; now: number }) {
  const { state, react, addMemory } = useProgress();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  if (m.kind === "system") return <p className="py-1 text-center text-xs text-muted">{m.text}</p>;
  const mine = m.from === 0;
  const bubble = cx("cv-auto max-w-[86%] rounded-3xl px-4 py-3", mine ? "ml-auto rounded-br-md bg-blush" : "mr-auto rounded-bl-md bg-partner-soft");
  const time = new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (m.kind === "duel") {
    const d = state.remoteDuels.find((x) => x.id === m.duelId);
    const status = d ? couple.duelStatus(d) : "their-turn";
    const topic = d ? (d.topic.startsWith("mix-") ? `${d.topic.slice(4)} mix` : (findTopic(d.topic)?.title ?? d.topic)) : "Duel";
    const label = {
      "your-turn": "Your turn! ⚔️",
      "their-turn": `Waiting for ${partnerName(state, 1)}…`,
      won: "You won 🏆",
      lost: `${partnerName(state, 1)} won 💪`,
      tie: "Tie 🤝",
    }[status];
    return (
      <div className={bubble}>
        <p className="font-bold">⚔️ Remote duel · {topic}</p>
        {d && d.scores[0] !== null && d.scores[1] !== null ? (
          <p>
            {d.scores[0]} : {d.scores[1]}
          </p>
        ) : null}
        <p className="text-sm text-muted">{label}</p>
        {status === "your-turn" ? (
          <Button size="sm" className="mt-2" href={`/remote-duel?id=${m.duelId}`}>
            Play now
          </Button>
        ) : null}
      </div>
    );
  }

  if (m.kind === "secret" && !couple.secretOpen(m, myStreak)) {
    return (
      <div className={cx(bubble, "border border-dashed border-rose")}>
        <p className="font-bold">🔒 A secret from {partnerName(state, 1)}</p>
        <p className="text-sm text-muted">
          Opens at a {m.unlockAt}-day streak · you’re at {myStreak} 🔥
        </p>
      </div>
    );
  }

  const reacts = [m.reacts?.[0], m.reacts?.[1]].filter(Boolean) as string[];
  return (
    <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cx(bubble, "relative cursor-pointer", reacts.length > 0 && "mb-3")}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (window.getSelection()?.toString()) return;
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target === e.currentTarget) setOpen((o) => !o);
        }}
        tabIndex={0}
        aria-label="Message, press to react"
        aria-expanded={open}
      >
      {m.kind === "secret" ? <p className="text-xs font-bold text-rose">✨ Secret{mine ? " (sent)" : " unlocked"}</p> : null}
      {m.kind === "note" ? <p className="text-xs font-bold text-rose">💌 Love note</p> : null}
      {m.kind === "word" ? <p className="text-xs font-bold text-rose">📖 New shared word</p> : null}
      <div className="flex items-center gap-2">
        <p className={cx("flex-1 whitespace-pre-wrap break-words text-ink", m.kind === "note" && "font-script text-2xl")}>{m.text}</p>
        {m.kind !== "word" ? <Speak text={m.text} /> : null}
      </div>
      <p className={cx("mt-0.5 text-[11px] text-muted", mine && "text-right")}>
        {time}
        {m.vanish ? <span className="ml-2 font-semibold text-plum">{couple.vanishLabel(m, now)}</span> : null}
      </p>
        {reacts.length ? (
          <span className={cx("absolute -bottom-3 flex gap-0.5 rounded-full bg-surface px-1.5 py-0.5 text-sm shadow-card ring-1 ring-line/60 anim-pop", mine ? "left-3" : "right-3")}>
            {reacts.map((r, k) => (
              <span key={k}>{r}</span>
            ))}
          </span>
        ) : null}
      </div>
      {open ? (
        <div className="mt-1 flex flex-wrap items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-card ring-1 ring-line/60 anim-fade-up" role="group" aria-label="React">
          {REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-label={`React ${r}`}
              aria-pressed={m.reacts?.[0] === r}
              onClick={() => {
                react(m.id, m.reacts?.[0] === r ? "" : r);
                setOpen(false);
              }}
              className={cx("grid h-9 w-9 place-items-center rounded-full text-lg transition hover:scale-110 hover:bg-blush", m.reacts?.[0] === r && "bg-blush")}
            >
              {r}
            </button>
          ))}
          {!m.vanish ? (
            <button
              type="button"
              disabled={saved}
              onClick={() => {
                addMemory({ emoji: "💬", title: mine ? "Something I said" : `${partnerName(state, 1)} said`, text: m.text, at: m.at });
                setSaved(true);
              }}
              className="ml-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-plum hover:bg-blush disabled:opacity-60"
            >
              {saved ? "Saved 📖" : "📌 Memory book"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
