import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { Script } from "../components/ui";
import { CHATS } from "../core/content/chats";
import { ROLEPLAYS } from "../core/content/extras";
import { DIALOGUES, LANGS, LEVELS } from "../core/content/levels";
import { partnerName, useProgress } from "../web/progress";

/** Challenges: guided chats (alone) and role-play scenes (together). */
export default function Talk() {
  const { state } = useProgress();
  const p = state.partners[state.learner];
  return (
    <AppShell>
      <Script className="text-4xl">Talk & Challenges 💬</Script>
      <p className="text-muted">Learn to hold a conversation. Chats are for {partnerName(state, state.learner)} alone; role-plays are for both of you.</p>

      <h2 className="mt-6 text-lg font-bold">Chat practice</h2>
      <p className="mb-3 text-sm text-muted">Reply to a character in German: pick a suggestion or type your own. Mistakes are explained in {LANGS.find((l) => l.id === p.lang)!.label}.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CHATS.map((chat) => {
          const stars = p.chatStars[chat.id] ?? 0;
          return <Tile key={chat.id} href={`/chat?id=${chat.id}`} emoji={chat.emoji} title={chat.title} sub={`${chat.level} · ${stars ? "⭐".repeat(stars) : "new"}`} />;
        })}
      </div>

      <h2 className="mt-8 text-lg font-bold">Real-life role-play 🇩🇪</h2>
      <p className="mb-3 text-sm text-muted">You each get a task card — “order two coffees and ask for the bill” — and build the German yourselves. Then switch roles.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ROLEPLAYS.map((r) => (
          <Tile key={r.id} href={`/roleplay?id=${r.id}`} emoji={r.emoji} title={r.title} sub={r.level} />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold">Read a scene together 🎭</h2>
      <p className="mb-3 text-sm text-muted">
        Read a scene out loud. {partnerName(state, 0)} plays A, {partnerName(state, 1)} plays B.
      </p>
      {LEVELS.map((level) => {
        const list = DIALOGUES.filter((d) => d.level === level.id);
        if (!list.length) return null;
        return (
          <div key={level.id} className="mb-4">
            <p className="mb-2 text-sm font-bold text-muted">
              {level.id} · {level.name}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {list.map((d) => (
                <Tile key={d.id} href={`/dialogue?id=${d.id}`} emoji={d.emoji} title={d.title} sub={`${d.lines.length} lines`} />
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}

function Tile({ href, emoji, title, sub }: { href: string; emoji: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex flex-col items-center rounded-3xl border border-line/70 bg-card/90 p-4 text-center shadow-card transition hover:border-rose active:scale-[0.98]">
      <span className="text-4xl">{emoji}</span>
      <span className="mt-1 font-bold text-ink">{title}</span>
      <span className="text-xs text-muted">{sub}</span>
    </Link>
  );
}
