import { BookOpen, Flame, GraduationCap, Heart, Star, Target } from "lucide-react";
import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { LearnerSwitch } from "../components/LearnerSwitch";
import { Card, cx, ProgressBar, Ring, Script } from "../components/ui";
import { LEVELS } from "../core/content/levels";
import { DAILY_GOAL, heartLevel } from "../core/lib/game";
import { currentStreak, isLocked, lastDays, levelProgress, today, useProgress } from "../web/progress";
import { hasPartner, personStats, weekdayOf, type PersonStats } from "../web/stats";

/** Progress: you (and your partner) at a glance, the last two weeks, and every level. */
export default function Progress() {
  const { state, accountMode } = useProgress();
  const who = state.learner;
  const me = state.partners[who];
  const streak = currentStreak(state);
  const mine = personStats(state, who, today(), streak);
  const theirs = hasPartner(state, accountMode) ? personStats(state, who === 0 ? 1 : 0, today(), streak) : null;
  const hl = heartLevel(me.xp);
  const days = lastDays(me, today(), 14);
  const max = Math.max(DAILY_GOAL, ...days.map((d) => d.xp));

  return (
    <AppShell>
      <Script className="text-4xl">Progress 📈</Script>
      <p className="mb-3 text-muted">Every word counts. Here’s how far you’ve come.</p>
      <LearnerSwitch />

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold">{theirs ? "Side by side" : "You"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PersonCard s={mine} color="#8b2f55" />
            {theirs ? (
              <PersonCard s={theirs} color="#5a7fc4" />
            ) : (
              <Link href="/us" className="grid place-items-center rounded-3xl border-2 border-dashed border-rose-soft p-6 text-center text-muted hover:text-plum">
                💞 Link your partner to see them here
              </Link>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Heart size={18} className="text-rose" fill="currentColor" /> Hearts level
          </h2>
          <p className="mt-3 text-3xl font-extrabold text-plum">Lv {hl.level}</p>
          <p className="text-muted">{hl.title}</p>
          <ProgressBar value={hl.progress} className="mt-3" />
          <p className="mt-1 text-xs text-muted">
            {hl.into} / {hl.span} XP to the next level · {me.xp} XP in total
          </p>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <Flame className="text-rose" fill="currentColor" size={20} />
            <h2 className="text-lg font-bold">Last 2 weeks</h2>
            <span className="ml-auto text-sm text-muted">🔥 {streak}-day streak</span>
          </div>
          <div className="mt-4 flex items-end gap-1.5 sm:gap-3" role="img" aria-label={`XP per day for the last 14 days: ${days.map((d) => d.xp).join(", ")}`}>
            {days.map((d, k) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted">{d.xp || ""}</span>
                <div className="flex h-32 w-full items-end overflow-hidden rounded-xl bg-blush">
                  <div className={cx("w-full rounded-xl", k === days.length - 1 ? "bg-plum" : d.xp >= DAILY_GOAL ? "bg-rose" : "bg-rose-soft")} style={{ height: `${(d.xp / max) * 100}%` }} />
                </div>
                <span className={cx("text-[11px]", k === days.length - 1 ? "font-bold text-plum" : "text-muted")}>{weekdayOf(d.date).slice(0, 2)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Darker bars reached the daily goal of {DAILY_GOAL} XP.</p>
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="text-lg font-bold">All levels</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((l) => {
              const pr = levelProgress(me, l);
              const locked = isLocked(me, l);
              const passed = me.examsPassed.includes(l.id);
              return (
                <Link key={l.id} href="/learn" className={cx("rounded-2xl border border-line/70 bg-white/70 p-4 hover:border-rose", locked && "opacity-60")}>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blush px-2.5 py-0.5 text-sm font-extrabold text-plum">{l.id}</span>
                    <span className="flex-1 font-semibold">{l.name}</span>
                    {passed ? <GraduationCap className="text-gold" size={20} /> : locked ? "🔒" : null}
                  </div>
                  <ProgressBar value={pr.share} className="mt-3" />
                  <p className="mt-1 text-xs text-muted">
                    {pr.passed} / {pr.total} lessons
                  </p>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Want to skip ahead? <Link href="/placement" className="font-semibold text-plum underline">Find my level</Link>
      </p>
    </AppShell>
  );
}

function PersonCard({ s, color }: { s: PersonStats; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-blush/50 p-4">
      <Ring value={s.levelShare} size={96} stroke={9} color={color}>
        <span className="text-xl font-extrabold">{Math.round(s.levelShare * 100)}%</span>
      </Ring>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold">{s.name}</p>
        <p className="text-xs text-muted">{s.levelId} in progress</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <li className="flex items-center gap-1">
            <BookOpen size={14} className="text-plum" /> {s.wordsKnown} words
          </li>
          <li className="flex items-center gap-1">
            <Star size={14} className="text-gold" /> {s.unitsPassed} lessons
          </li>
          <li className="flex items-center gap-1">
            <Flame size={14} className="text-rose" /> {s.streak} days
          </li>
          <li className="flex items-center gap-1">
            <Target size={14} className="text-plum" /> {s.weekXp} XP/wk
          </li>
        </ul>
      </div>
    </div>
  );
}
