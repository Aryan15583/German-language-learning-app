// Small read-only helpers the dashboard, progress and couple pages share.
import { LEVELS, levelUnits } from "../core/content/levels";
import { DAILY_GOAL, isoWeek } from "../core/lib/game";
import * as C from "../core/state/couple";
import { levelProgress, unitPassed, type AppState, type PartnerIndex } from "../core/state/logic";

const unitsBefore = (levelIdx: number) => LEVELS.slice(0, levelIdx).reduce((n, l) => n + levelUnits(l).length, 0);

export type PersonStats = {
  name: string;
  levelId: string;
  /** Share of the current level done, 0–1. */
  levelShare: number;
  wordsKnown: number;
  unitsPassed: number;
  weekXp: number;
  todayXp: number;
  streak: number;
  xp: number;
};

/** Numbers for me (0) or my partner (1). A linked partner's come from their last message. */
export function personStats(s: AppState, i: PartnerIndex, today: string, streak: number): PersonStats {
  const p = s.partners[i];
  const week = isoWeek(today);
  const level = LEVELS[Math.min(p.unlocked, LEVELS.length - 1)];
  const remote = i === 1 && C.isLinked(s) ? p.remote : null;
  const localUnits = LEVELS.flatMap(levelUnits).filter((u) => unitPassed(p, u.id)).length;
  const unitsPassed = remote ? remote.unitsPassed : localUnits;
  const levelShare = remote
    ? Math.max(0, Math.min(1, (remote.unitsPassed - unitsBefore(p.unlocked)) / levelUnits(level).length))
    : levelProgress(p, level).share;
  return {
    name: p.name || (i ? "Partner" : "You"),
    levelId: level.id,
    levelShare,
    wordsKnown: remote ? remote.wordsKnown : Object.values(p.known).reduce((n, a) => n + a.length, 0),
    unitsPassed,
    weekXp: p.week.id === week ? p.week.xp : 0,
    todayXp: p.today.date === today ? p.today.xp : 0,
    streak: remote ? remote.streak : streak,
    xp: p.xp,
  };
}

/** Is there a partner to show (linked phones, or two names on a shared phone)? */
export const hasPartner = (s: AppState, accountMode: boolean) => C.isLinked(s) || (!accountMode && !!s.partners[1].name);

export const goalShare = (xp: number) => Math.min(1, xp / DAILY_GOAL);

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const weekdayOf = (date: string) => WEEKDAYS[new Date(date + "T12:00:00Z").getUTCDay()];

/** "3 min ago", "yesterday", "12 Nov". */
export function ago(at: number, now = Date.now()): string {
  const m = Math.round((now - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48) return "yesterday";
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
