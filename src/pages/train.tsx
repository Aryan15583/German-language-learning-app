import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { Script } from "../components/ui";
import { dueKeys } from "../core/lib/srs";
import { today, useProgress } from "../web/progress";

/** Practice hub: every way to train, in one place. */
export default function Train() {
  const { state } = useProgress();
  const due = dueKeys(state.partners[state.learner].memory, today()).length;
  return (
    <AppShell>
      <Script className="text-4xl">Practice 🏋️</Script>
      <p className="text-muted">Pick anything — or just tap ▶ Start on the dashboard and let the app choose.</p>
      <Section title="Just for you">
        <Tile href="/review" emoji="💡" title="Smart review" sub={due ? `${due} words need your attention` : "All words fresh"} badge={due || undefined} />
        <Tile href="/vocab" emoji="📖" title="My words" sub="Every word and its forms" />
        <Tile href="/builder" emoji="🧩" title="Word builder" sub="Put German words in order" />
        <Tile href="/listen" emoji="🎧" title="Listening" sub="Easy → expert" />
        <Tile href="/grammar" emoji="🤔" title="Why is German like this?" sub="Tiny grammar bites" />
        <Tile href="/marathi" emoji="🇮🇳" title="मराठी ↔ Deutsch" sub="Same idea, three languages" />
      </Section>
      <Section title="Together">
        <Tile href="/together" emoji="💞" title="Couple learning" sub="Puzzles that need both of you" />
        <Tile href="/teach" emoji="👫" title="Teach your partner" sub="Explain it, they guess" />
        <Tile href="/talk" emoji="🎭" title="Role-play & chats" sub="Café, train, doctor, date…" />
        <Tile href="/quizzes" emoji="⚔️" title="Duels" sub="Speed, streak, sentence…" />
      </Section>
      <Section title="The journey">
        <Tile href="/journey" emoji="🗺️" title="Mumbai → Berlin" sub="Stops, words and postcards" />
        <Tile href="/ready" emoji="✈️" title="Berlin Ready" sub="The final 7-day challenge" />
      </Section>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </section>
  );
}

function Tile({ href, emoji, title, sub, badge }: { href: string; emoji: string; title: string; sub: string; badge?: number }) {
  return (
    <Link href={href} className="relative flex flex-col gap-1 rounded-3xl border border-line/70 bg-card/90 p-4 shadow-card transition hover:border-rose active:scale-[0.98]">
      {badge ? <span className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-rose px-1.5 text-xs font-bold text-white">{badge}</span> : null}
      <span className="text-3xl">{emoji}</span>
      <span className="font-bold text-ink">{title}</span>
      <span className="text-xs text-muted">{sub}</span>
    </Link>
  );
}
