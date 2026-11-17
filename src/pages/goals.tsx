import { AppShell } from "../components/AppShell";
import { Card, ProgressBar, Script } from "../components/ui";
import { LEVELS } from "../core/content/levels";
import { DAILY_GOAL } from "../core/lib/game";
import { currentStreak, today, useProgress } from "../web/progress";
import { hasPartner, personStats } from "../web/stats";

const WEEK_GOAL = 250;

/** Couple goals: small targets you work towards together. */
export default function Goals() {
  const { state, accountMode } = useProgress();
  const streak = currentStreak(state);
  const who = state.learner;
  const mine = personStats(state, who, today(), streak);
  const theirs = hasPartner(state, accountMode) ? personStats(state, who === 0 ? 1 : 0, today(), streak) : null;
  const me = state.partners[who];
  const next = LEVELS[Math.min(me.unlocked + 1, LEVELS.length - 1)];
  const together = mine.weekXp + (theirs?.weekXp ?? 0);
  const weekTarget = theirs ? WEEK_GOAL * 2 : WEEK_GOAL;
  const goals = [
    { emoji: "🎯", title: "Today’s goal", text: `${DAILY_GOAL} XP each day`, value: mine.todayXp / DAILY_GOAL, label: `${mine.todayXp} / ${DAILY_GOAL} XP` },
    { emoji: "🔥", title: "A week in a row", text: "7-day streak — it also opens secret messages!", value: streak / 7, label: `${Math.min(streak, 7)} / 7 days` },
    {
      emoji: "💞",
      title: theirs ? "This week, together" : "This week",
      text: theirs ? `${weekTarget} XP between the two of you` : `${weekTarget} XP this week`,
      value: together / weekTarget,
      label: `${together} / ${weekTarget} XP`,
    },
    { emoji: "🎓", title: `Reach ${next.id}`, text: `Finish ${LEVELS[me.unlocked].id} and pass its big test`, value: mine.levelShare, label: `${Math.round(mine.levelShare * 100)}%` },
    { emoji: "🏙️", title: "Until Berlin", text: "Learn 500 words — enough for everyday life in Germany", value: mine.wordsKnown / 500, label: `${mine.wordsKnown} / 500 words` },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Script className="text-4xl">Couple goals 🎯</Script>
        <p className="mb-5 text-muted">Little targets to chase together. They fill up as you learn.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const done = g.value >= 1;
            return (
              <Card key={g.title}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{done ? "✅" : g.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold">{g.title}</p>
                    <p className="text-sm text-muted">{g.text}</p>
                  </div>
                </div>
                <ProgressBar value={g.value} className="mt-3" color={done ? "bg-good" : "bg-plum"} />
                <p className="mt-1 text-xs font-semibold text-muted">{done ? "Done! 🎉" : g.label}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
