// Weekly couple challenges: 4 small goals each week (the same on both phones), +50 XP each.
import type { Counts } from "../state/logic";
import { isoWeek } from "./game";
import { seedOf } from "./together";
import { seededRng, shuffle } from "./util";

export type WeeklyMetric = "xpTogether" | "days" | "duels" | "talks" | "notes" | "messages" | "perfect" | "hearts";
export type WeeklyChallenge = { id: WeeklyMetric; emoji: string; title: string; desc: string; target: number };

export const WEEKLY_POOL: WeeklyChallenge[] = [
  { id: "xpTogether", emoji: "💞", title: "Gemeinsam stark", desc: "Earn XP together this week", target: 400 },
  { id: "days", emoji: "📅", title: "Jeden Tag ein bisschen", desc: "Learn on different days", target: 5 },
  { id: "duels", emoji: "⚔️", title: "Duell-Woche", desc: "Play quiz duels", target: 2 },
  { id: "talks", emoji: "🗣️", title: "Lass uns reden", desc: "Finish conversations or role-plays", target: 2 },
  { id: "notes", emoji: "💌", title: "Liebesbriefe", desc: "Send German love notes", target: 2 },
  { id: "messages", emoji: "💬", title: "Plaudern auf Deutsch", desc: "Send chat messages", target: 20 },
  { id: "perfect", emoji: "🌟", title: "Perfekt!", desc: "Get every answer right in a quiz", target: 1 },
  { id: "hearts", emoji: "❤️", title: "Mission erfüllt", desc: "Complete daily missions", target: 3 },
];
export const WEEKLY_XP = 50;

/** This week's 4 challenges: always "together XP" and "days", plus 2 that change every week. */
export function weeklyChallenges(weekId: string): WeeklyChallenge[] {
  const rest = shuffle(WEEKLY_POOL.slice(2), seededRng(seedOf(`weekly|${weekId}`)));
  return [WEEKLY_POOL[0], WEEKLY_POOL[1], ...rest.slice(0, 2)];
}

export type WeeklyContext = { myWeekXp: number; theirWeekXp: number; days: number; counts: Counts; base: Counts };

export function weeklyProgress(c: WeeklyChallenge, x: WeeklyContext): number {
  const d = (k: keyof Counts) => Math.max(0, (x.counts[k] ?? 0) - (x.base[k] ?? 0));
  switch (c.id) {
    case "xpTogether":
      return x.myWeekXp + x.theirWeekXp;
    case "days":
      return x.days;
    case "duels":
      return d("duels");
    case "talks":
      return d("talks");
    case "notes":
      return d("notes");
    case "messages":
      return d("messages");
    case "perfect":
      return d("perfect");
    case "hearts":
      return d("hearts");
  }
}

/** Days with any learning in the ISO week of `today` (from the daily XP history). */
export const daysThisWeek = (history: Record<string, number>, today: string) => {
  const week = isoWeek(today);
  return Object.entries(history).filter(([date, xp]) => xp > 0 && isoWeek(date) === week).length;
};
