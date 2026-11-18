import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Chip, cx, fieldClass, Script } from "../components/ui";
import { JOURNEY } from "../core/content/berlin";
import { postcards } from "../core/lib/journey";
import { couple, currentStreak, partnerName, useProgress } from "../web/progress";

const EMOJIS = ["💞", "🎉", "📸", "☕", "✈️", "🏙️", "🌙", "😂"];
const day = (at: number) => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

type Moment = { id: string; at: number; emoji: string; title: string; text: string; auto?: boolean };

/** Our memory book: moments you save, plus milestones the app notices for you. */
export default function Memories() {
  const { state, addMemory, removeMemory } = useProgress();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [date, setDate] = useState("");
  const [adding, setAdding] = useState(false);
  const streak = currentStreak(state);
  const cards = postcards(state.partners[state.learner]);

  const moments = useMemo(() => {
    const out: Moment[] = state.memories.map((m) => ({ ...m }));
    if (state.couple?.status === "linked") out.push({ id: "auto-linked", at: state.couple.since, emoji: "🔗", title: "We linked our phones", text: "The start of learning German together.", auto: true });
    for (const d of state.duels.slice(-3)) {
      const t = Date.parse(d.date);
      if (Number.isFinite(t)) out.push({ id: `auto-duel-${d.date}-${d.title}`, at: t, emoji: "⚔️", title: `Duel: ${d.title}`, text: `${d.scores[0]} – ${d.scores[1]}`, auto: true });
    }
    return out.sort((a, b) => b.at - a.at);
  }, [state.memories, state.couple, state.duels]);

  const save = () => {
    if (!title.trim() && !text.trim()) return;
    const at = date ? Date.parse(`${date}T12:00:00`) : Date.now();
    addMemory({ emoji, title: title.trim() || "A little moment", text: text.trim(), at: Number.isFinite(at) ? at : Date.now() });
    setTitle("");
    setText("");
    setDate("");
    setAdding(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">Unser Erinnerungsbuch 📖</Script>
        <p className="text-muted">
          Our memory book: little moments from {partnerName(state, 0)} & {partnerName(state, 1)}’s way to Berlin. Tap 📌 on a chat message to save it here.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Card className="p-3">
            <p className="text-2xl font-extrabold text-plum">{streak}</p>
            <p className="text-xs text-muted">day streak 🔥</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-extrabold text-plum">
              {cards.length}/{JOURNEY.length}
            </p>
            <p className="text-xs text-muted">postcards 💌</p>
          </Card>
          <Card className="p-3">
            <p className="text-2xl font-extrabold text-plum">{state.memories.length}</p>
            <p className="text-xs text-muted">memories 📖</p>
          </Card>
        </div>

        {adding ? (
          <Card className="mt-5">
            <p className="font-bold">Add a memory</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <Chip key={e} selected={emoji === e} onClick={() => setEmoji(e)}>
                  {e}
                </Chip>
              ))}
            </div>
            <input className={cx(fieldClass, "mt-3")} placeholder="Title, e.g. Our first German sentence" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
            <textarea className={cx(fieldClass, "mt-2 min-h-24")} placeholder="What happened? (optional)" value={text} maxLength={600} onChange={(e) => setText(e.target.value)} aria-label="What happened" />
            <label className="mt-2 block text-sm text-muted">
              Date (optional)
              <input type="date" className={cx(fieldClass, "mt-1")} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="mt-3 flex gap-2">
              <Button onClick={save} disabled={!title.trim() && !text.trim()}>
                Save memory 💞
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <Button className="mt-5" onClick={() => setAdding(true)}>
            ＋ Add a memory
          </Button>
        )}

        {moments.length ? (
          <ol className="relative mt-6 border-l-4 border-dashed border-rose-soft pl-6">
            {moments.map((m) => (
              <li key={m.id} className="relative mb-5">
                <span className="absolute -left-[42px] grid h-9 w-9 place-items-center rounded-full bg-blush text-lg ring-4 ring-surface">{m.emoji}</span>
                <Card className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose">{day(m.at)}</p>
                      <p className="font-bold text-ink">{m.title}</p>
                      {m.text ? <p className="mt-1 whitespace-pre-wrap break-words text-muted">{m.text}</p> : null}
                    </div>
                    {!m.auto ? (
                      <button type="button" aria-label="Delete memory" onClick={() => removeMemory(m.id)} className="rounded-full p-2 text-muted hover:bg-blush hover:text-plum">
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <Card className="mt-6 text-center">
            <p className="text-4xl">📖</p>
            <p className="mt-2 font-bold">Your book is still empty</p>
            <p className="text-sm text-muted">Add your first memory — the day you started, a funny mistake, a sweet message.{couple.isLinked(state) ? "" : " Link phones to collect chat moments too."}</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
