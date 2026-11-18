import { AppShell } from "../components/AppShell";
import { Activity } from "../components/Activity";
import { Card, Script } from "../components/ui";
import { LEVELS } from "../core/content/levels";
import { dailyConversation, dailySurprise } from "../core/lib/couplelife";
import { couple, partnerName, today, useProgress } from "../web/progress";

/** Play: every game and practice in one place. */
export default function Play() {
  const { state } = useProgress();
  const me = state.partners[state.learner];
  const level = LEVELS[Math.min(me.unlocked, LEVELS.length - 1)].id;
  const talk = dailyConversation(level, today());
  const surprise = dailySurprise(today());
  const partner = partnerName(state, state.learner === 0 ? 1 : 0);
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">Spielen 🎲</Script>
        <p className="text-muted">Games and practice for the two of you. A few minutes is enough.</p>

        <Card className="mt-5 bg-gradient-to-br from-card to-blush">
          <p className="text-xs font-bold uppercase tracking-wider text-rose">🎁 Today’s surprise</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {surprise.emoji} {surprise.title}
          </p>
          <p className="text-muted">{surprise.text}</p>
        </Card>

        <h2 className="mb-2 mt-6 text-lg font-bold">Today</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Activity href={`/dialogue?id=${talk.id}`} icon={talk.emoji} title="Today’s conversation" sub={`${talk.title} · act it out with ${partner}`} badge="New" />
          <Activity href="/articles" icon="🎯" title="der, die oder das?" sub="Tap the right article — 10 quick words" />
        </div>

        <h2 className="mb-2 mt-6 text-lg font-bold">Together</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Activity href="/quizzes" icon="⚔️" title="Couple quiz duel" sub={couple.isLinked(state) ? "Same questions on both phones" : "Pass the phone and compete"} />
          <Activity href="/together" icon="🧩" title="Puzzles for two" sub="Each phone holds half the answer" />
          <Activity href="/roleplay" icon="🎭" title="Role-play" sub="Café, train, first date… in German" />
          <Activity href="/note" icon="💌" title="Love note" sub="Write something sweet in German" />
        </div>

        <h2 className="mb-2 mt-6 text-lg font-bold">Practice</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Activity href="/review" icon="💡" title="Smart review" sub="Words you’re about to forget" />
          <Activity href="/listen" icon="🎧" title="Listening" sub="Hear it, then pick what was said" />
          <Activity href="/builder" icon="🧱" title="Sentence builder" sub="Put the words in the right order" />
          <Activity href="/talk" icon="💬" title="Chat practice" sub="Text with a friendly German bot" />
        </div>
      </div>
    </AppShell>
  );
}
