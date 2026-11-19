import { AppShell } from "../components/AppShell";
import { ReminderCard } from "../components/ReminderCard";
import { WeeklyChallenges } from "../components/WeeklyChallenges";
import { Card, ProgressBar, Script } from "../components/ui";
import { SECRET_PHRASES } from "../core/content/berlin";
import { LEVELS, meaning } from "../core/content/levels";
import { Speak } from "../components/ui";
import { teamLevel } from "../core/lib/couplelife";
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
  const team = teamLevel(mine.xp, theirs?.xp ?? 0);
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
        <Card className="mb-4 flex items-center gap-4 bg-gradient-to-br from-card to-blush">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-plum text-2xl font-extrabold text-white shadow-soft">{team.level}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-rose">💞 Together XP</p>
            <p className="font-script text-3xl text-plum">{team.title}</p>
            <ProgressBar value={team.progress} className="mt-1" color="bg-rose" />
            <p className="mt-1 text-xs text-muted">
              {team.xp} XP together · {team.span - team.into} XP to level {team.level + 1}
            </p>
          </div>
        </Card>
        <WeeklyChallenges />

        <h2 className="mb-2 text-lg font-bold">Bigger goals 🎯</h2>
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

        <ReminderCard className="mt-4" />

        <h2 className="mb-1 mt-8 text-lg font-bold">🔐 Secret phrases</h2>
        <p className="mb-3 text-sm text-muted">Keep your shared streak alive to unlock them. Unlocked phrases appear in Love notes.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECRET_PHRASES.map((ph) => {
            const open = streak >= ph.day;
            return (
              <Card key={ph.day} className={open ? "bg-gradient-to-br from-card to-blush" : "opacity-70"}>
                <p className="text-xs font-bold uppercase tracking-wider text-rose">{open ? `🔓 Day ${ph.day}` : `🔒 Day ${ph.day} · ${ph.day - streak} to go`}</p>
                {open ? (
                  <>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="flex-1 font-script text-3xl text-plum">{ph.de}</p>
                      <Speak text={ph.de} />
                    </div>
                    <p className="text-sm text-muted">{meaning(ph, me.lang)}</p>
                  </>
                ) : (
                  <p className="mt-1 text-2xl tracking-widest text-muted">• • • • •</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
