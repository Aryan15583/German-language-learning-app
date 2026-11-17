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
  /** Quizzes with every answer right. */
  perfect: number;
  /** Passed the A1 big test. */
  a1: boolean;
};

export type Achievement = { id: string; emoji: string; title: string; desc: string; test: (c: AchievementContext) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-words", emoji: "🌱", title: "Erste Worte", desc: "Learn 10 words", test: (c) => c.wordsKnown >= 10 },
  { id: "wortschatz", emoji: "📚", title: "Wortschatz", desc: "Learn 50 words", test: (c) => c.wordsKnown >= 50 },
  { id: "hundert", emoji: "💯", title: "Hundert", desc: "Learn 100 words", test: (c) => c.wordsKnown >= 100 },
  { id: "bibliothek", emoji: "🏛️", title: "Bibliothek", desc: "Learn 150 words", test: (c) => c.wordsKnown >= 150 },
  { id: "streak-3", emoji: "🔥", title: "Warm geworden", desc: "3-day streak", test: (c) => c.streak >= 3 },
  { id: "streak-7", emoji: "💞", title: "Eine Woche", desc: "7-day streak", test: (c) => c.streak >= 7 },
  { id: "streak-30", emoji: "🌙", title: "Ein Monat", desc: "30-day streak", test: (c) => c.streak >= 30 },
  { id: "unit", emoji: "⭐", title: "Erster Stern", desc: "Pass a unit test", test: (c) => c.unitsPassed >= 1 },
  { id: "exam", emoji: "🎓", title: "Bestanden", desc: "Pass a level exam", test: (c) => c.examsPassed >= 1 },
  { id: "a1", emoji: "🥨", title: "A1 geschafft", desc: "Complete A1", test: (c) => c.a1 },
  { id: "perfect", emoji: "✨", title: "Perfekt!", desc: "Get every answer right in a quiz", test: (c) => c.perfect >= 1 },
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

// ---- Couple achievements: earned together ----
export type CoupleContext = {
  /** Both of you have passed at least one lesson. */
  bothLearned: boolean;
  streak: number;
  duels: number;
  talks: number;
  notes: number;
  a1Both: boolean;
  missions: number;
  postcards: number;
  berlinReady: boolean;
};

export type CoupleAchievement = { id: string; emoji: string; title: string; desc: string; test: (c: CoupleContext) => boolean };

export const COUPLE_ACHIEVEMENTS: CoupleAchievement[] = [
  { id: "together", emoji: "💞", title: "Erste Lektion zusammen", desc: "Both pass a lesson", test: (c) => c.bothLearned },
  { id: "couple-streak", emoji: "🔥", title: "7 Tage zusammen", desc: "7-day couple streak", test: (c) => c.streak >= 7 },
  { id: "first-duel", emoji: "⚔️", title: "Erstes Duell", desc: "Play your first duel", test: (c) => c.duels >= 1 },
  { id: "first-talk", emoji: "💬", title: "Erstes Gespräch", desc: "Finish a German conversation", test: (c) => c.talks >= 1 },
  { id: "mission", emoji: "🎯", title: "Mission erfüllt", desc: "Complete a daily mission", test: (c) => c.missions >= 1 },
  { id: "postcard", emoji: "💌", title: "Grüße aus Berlin", desc: "Collect a Berlin postcard", test: (c) => c.postcards >= 1 },
  { id: "notes-100", emoji: "❤️", title: "100 Liebesbriefe", desc: "Send 100 love notes", test: (c) => c.notes >= 100 },
  { id: "a1-both", emoji: "🇩🇪", title: "A1 zusammen", desc: "Both complete A1", test: (c) => c.a1Both },
  { id: "berlin-ready", emoji: "✈️", title: "Berlin Ready", desc: "Finish the Berlin Ready trip", test: (c) => c.berlinReady },
];
