import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { isoWeek } from "../core/lib/game";
import { daysThisWeek, weeklyChallenges, weeklyProgress, WEEKLY_XP } from "../core/lib/weekly";
import { currentStreak, today, useProgress } from "../web/progress";
import { hasPartner, personStats } from "../web/stats";
import { Button, Card, cx, ProgressBar } from "./ui";

function useWeekly() {
  const { state, accountMode, claimWeekly } = useProgress();
  const t = today();
  const week = isoWeek(t);
  const who = state.learner;
  const me = state.partners[who];
  const streak = currentStreak(state);
  const mine = personStats(state, who, t, streak);
  const theirs = hasPartner(state, accountMode) ? personStats(state, who === 0 ? 1 : 0, t, streak) : null;
  const base = me.weekly?.id === week ? me.weekly.base : me.counts;
  const claimed = me.weekly?.id === week ? me.weekly.claimed : [];
  const ctx = { myWeekXp: mine.weekXp, theirWeekXp: theirs?.weekXp ?? 0, days: daysThisWeek(me.history, t), counts: me.counts, base };
  const items = weeklyChallenges(week).map((c) => {
    const target = c.id === "xpTogether" && !theirs ? Math.round(c.target / 2) : c.target;
    const value = weeklyProgress(c, ctx);
    return { ...c, target, value, done: value >= target, claimed: claimed.includes(c.id) };
  });
  // Days left until Sunday night.
  const day = new Date(`${t}T12:00:00`).getDay();
  const left = day === 0 ? 1 : 8 - day;
  return { items, claim: claimWeekly, left };
}

/** This week's 4 couple challenges, with progress and a +50 XP claim. */
export function WeeklyChallenges() {
  const { items, claim, left } = useWeekly();
  const done = items.filter((x) => x.done).length;
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-lg font-bold">Diese Woche 🗓️</h2>
        <p className="text-sm text-muted">
          {done}/{items.length} done · {left} {left === 1 ? "day" : "days"} left
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((c) => (
          <Card key={c.id} className={cx("p-4", c.claimed && "bg-gradient-to-br from-card to-gold-soft")}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{c.claimed ? "🏆" : c.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{c.title}</p>
                <p className="text-sm text-muted">
                  {c.desc} ({c.target}
                  {c.id === "xpTogether" ? " XP" : ""})
                </p>
              </div>
            </div>
            <ProgressBar value={c.value / c.target} className="mt-3" color={c.done ? "bg-good" : "bg-plum"} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">
                {Math.min(c.value, c.target)} / {c.target}
              </span>
              {c.claimed ? (
                <span className="text-xs font-bold text-gold">+{WEEKLY_XP} XP ✓</span>
              ) : c.done ? (
                <Button size="sm" variant="good" onClick={() => claim(c.id)}>
                  Claim +{WEEKLY_XP} XP
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** One line for Home: "2 of 4 weekly challenges". */
export function WeeklyLine() {
  const { items } = useWeekly();
  const done = items.filter((x) => x.done).length;
  const ready = items.filter((x) => x.done && !x.claimed).length;
  return (
    <Link href="/goals" className="mt-3 flex items-center gap-2 rounded-2xl bg-blush/70 px-3 py-2 text-sm hover:bg-blush">
      <span>🗓️</span>
      <span className="flex-1 font-semibold text-ink">
        Weekly challenges: {done}/{items.length}
        {ready ? <span className="ml-1.5 rounded-full bg-good px-2 py-0.5 text-[11px] font-bold text-white">{ready} to claim</span> : null}
      </span>
      <ChevronRight size={16} className="text-muted" />
    </Link>
  );
}
