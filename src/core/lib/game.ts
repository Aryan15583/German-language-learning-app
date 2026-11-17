// Cozy competition: hearts levels, daily goal, weekly battle and achievements.
// Pure functions only; everything here is unit-tested.

/** ISO-8601 week id for a calendar date, e.g. "2026-11-13" → "2026-W46". */
export function isoWeek(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  t.setUTCDate(t.getUTCDate() + 4 - day); // Thursday of this week decides the year
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const DAILY_GOAL = 50;

/** Hearts levels: each one needs a bit more XP than the last. */
export const HEART_TITLES = [
  "Neuling",
  "Anfänger",
  "Lernfreund",
  "Plaudertasche",
  "Wortkünstler",
  "Herzensdichter",
  "Sprachpaar",
  "Berlin-bereit",
];

export function heartLevel(xp: number) {
  let level = 0;
  let floor = 0;
  let span = 100;
  while (xp >= floor + span && level < 99) {
    floor += span;
    level++;
    span = 100 + level * 50;
  }
  return {
    level: level + 1,
    title: HEART_TITLES[Math.min(level, HEART_TITLES.length - 1)],
    into: xp - floor,
    span,
    progress: (xp - floor) / span,
  };
}

export type AchievementContext = {
  streak: number;
  wordsKnown: number;
  unitsPassed: number;
  examsPassed: number;
  chatStars: number;
  messages: number;
  duelsWon: number;
  linked: boolean;
};

export type Achievement = { id: string; emoji: string; title: string; desc: string; test: (c: AchievementContext) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-words", emoji: "🌱", title: "Erste Worte", desc: "Learn 10 words", test: (c) => c.wordsKnown >= 10 },
  { id: "wortschatz", emoji: "📚", title: "Wortschatz", desc: "Learn 50 words", test: (c) => c.wordsKnown >= 50 },
  { id: "bibliothek", emoji: "🏛️", title: "Bibliothek", desc: "Learn 150 words", test: (c) => c.wordsKnown >= 150 },
  { id: "streak-3", emoji: "🔥", title: "Warm geworden", desc: "3-day streak", test: (c) => c.streak >= 3 },
  { id: "streak-7", emoji: "💞", title: "Eine Woche", desc: "7-day streak", test: (c) => c.streak >= 7 },
  { id: "streak-30", emoji: "🌙", title: "Ein Monat", desc: "30-day streak", test: (c) => c.streak >= 30 },
  { id: "unit", emoji: "⭐", title: "Erster Stern", desc: "Pass a unit test", test: (c) => c.unitsPassed >= 1 },
  { id: "exam", emoji: "🎓", title: "Bestanden", desc: "Pass a level exam", test: (c) => c.examsPassed >= 1 },
  { id: "chatter", emoji: "💬", title: "Plaudertasche", desc: "Earn 6 chat stars", test: (c) => c.chatStars >= 6 },
  { id: "linked", emoji: "🌍", title: "Zwei Herzen", desc: "Link your phones", test: (c) => c.linked },
  { id: "lovebird", emoji: "💌", title: "Liebesbote", desc: "Send 10 messages", test: (c) => c.messages >= 10 },
  { id: "champion", emoji: "🏆", title: "Champion", desc: "Win 3 duels", test: (c) => c.duelsWon >= 3 },
];

export const earnedAchievements = (c: AchievementContext) => ACHIEVEMENTS.filter((a) => a.test(c));

/** Who's ahead this week. */
export function weeklyLeader(mine: number, theirs: number): "me" | "them" | "tie" {
  return mine === theirs ? "tie" : mine > theirs ? "me" : "them";
}
