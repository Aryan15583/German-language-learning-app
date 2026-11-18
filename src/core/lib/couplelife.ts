// Small couple features: Together XP, the daily picks, the der/die/das game, reactions and the memory book.
import { DIALOGUES, LEVEL_IDS, type Dialogue, type LevelId } from "../content/levels";
import { NOUN_LIST, type NounEntry } from "./forms";
import { seedOf } from "./together";
import { seededRng, shuffle } from "./util";

// ---- Together XP ----
export const TEAM_TITLES = ["Zwei Anfänger", "Lernpaar", "Wortpaar", "Plauderpaar", "Herzpaar", "Sprachpaar", "Fast in Berlin", "Berlin-Paar"];

/** One shared level for the two of you: your XP added together. Each level needs a bit more. */
export function teamLevel(xpA: number, xpB: number) {
  const xp = Math.max(0, xpA) + Math.max(0, xpB);
  let level = 0;
  let floor = 0;
  let span = 200;
  while (xp >= floor + span && level < 99) {
    floor += span;
    level++;
    span = 200 + level * 100;
  }
  return { xp, level: level + 1, title: TEAM_TITLES[Math.min(level, TEAM_TITLES.length - 1)], into: xp - floor, span, progress: (xp - floor) / span };
}

// ---- Daily picks (the same on both phones, changes at midnight) ----
export function dailyPick<T>(list: readonly T[], date: string, salt: string): T {
  const rng = seededRng(seedOf(`${date}|${salt}`));
  return list[Math.floor(rng() * list.length) % list.length];
}

/** Today's conversation to act out together: one at (or below) your level. */
export function dailyConversation(level: LevelId, date: string): Dialogue {
  const max = LEVEL_IDS.indexOf(level);
  const pool = DIALOGUES.filter((d) => LEVEL_IDS.indexOf(d.level) <= Math.max(0, max));
  return dailyPick(pool.length ? pool : DIALOGUES, date, "conversation");
}

export type Surprise = { emoji: string; title: string; text: string };
export const SURPRISES: Surprise[] = [
  { emoji: "💌", title: "Kompliment-Tag", text: "Send your partner one compliment in German. Try: „Du bist wunderschön.“" },
  { emoji: "🎵", title: "Song-Zeit", text: "Listen to one German song together and find three words you know." },
  { emoji: "🍳", title: "Kochen auf Deutsch", text: "Name five things in your kitchen in German — with der, die or das." },
  { emoji: "📸", title: "Foto-Rätsel", text: "Send a photo of something and ask: „Was ist das?“ Your partner answers in German." },
  { emoji: "🌙", title: "Gute-Nacht-Satz", text: "Before bed, tell each other one thing about your day in German." },
  { emoji: "🗺️", title: "Traum-Wochenende", text: "Plan a weekend in Berlin in German: „Am Samstag gehen wir …“" },
  { emoji: "☕", title: "Café-Spiel", text: "One of you is the waiter, one orders. Then swap!" },
  { emoji: "🤫", title: "Geheimwort", text: "Pick a secret German word for today. Use it in chat without the other noticing!" },
  { emoji: "❤️", title: "Drei Gründe", text: "Write three reasons you love your partner — auf Deutsch: „Ich liebe dich, weil …“" },
  { emoji: "🎲", title: "Zahlen-Duell", text: "Say random numbers from 1–100 in German. Whoever hesitates loses a kiss. 😘" },
  { emoji: "📅", title: "Mein Tag", text: "Describe your day with five words only. Can your partner guess what happened?" },
  { emoji: "🏙️", title: "Berlin-Traum", text: "Look up one Berlin place you want to visit together and say why — in German." },
];
export const dailySurprise = (date: string) => dailyPick(SURPRISES, date, "surprise");

// ---- der / die / das ----
export type ArticleQuestion = { noun: NounEntry; options: ["der", "die", "das"] };

/** A round of article questions, the same set for a given seed. */
export function articleRound(seed: string, n = 10, nouns: readonly NounEntry[] = NOUN_LIST): ArticleQuestion[] {
  const rng = seededRng(seedOf(seed));
  return shuffle([...nouns], rng)
    .slice(0, n)
    .map((noun) => ({ noun, options: ["der", "die", "das"] }));
}

/** Little memory tricks for the articles. */
export const ARTICLE_TIPS: Record<"der" | "die" | "das", string> = {
  der: "Many male people, days, months and seasons are der: der Mann, der Montag, der Winter.",
  die: "Most words ending in -ung, -heit, -keit, -schaft and -e are die: die Zeitung, die Liebe.",
  das: "Words ending in -chen and -lein are always das: das Mädchen. Also most -um words: das Museum.",
};

// ---- Chat reactions ----
export const REACTIONS = ["❤️", "😂", "😮", "👏", "🔥", "🥺"] as const;
export const isReaction = (x: unknown): x is string => typeof x === "string" && (x === "" || (REACTIONS as readonly string[]).includes(x));

// ---- Memory book ----
export type MemoryEntry = { id: string; at: number; emoji: string; title: string; text: string };
export const MAX_MEMORIES = 500;
export const LIMITS_MEMORY = { title: 80, text: 600 };

export function cleanMemory(x: unknown): MemoryEntry | null {
  if (!x || typeof x !== "object") return null;
  const m = x as Partial<MemoryEntry>;
  if (typeof m.id !== "string" || !m.id || typeof m.at !== "number" || !Number.isFinite(m.at)) return null;
  const title = typeof m.title === "string" ? m.title.trim().slice(0, LIMITS_MEMORY.title) : "";
  const text = typeof m.text === "string" ? m.text.slice(0, LIMITS_MEMORY.text) : "";
  if (!title && !text) return null;
  return { id: m.id, at: m.at, emoji: typeof m.emoji === "string" && m.emoji.length <= 8 ? m.emoji : "💞", title, text };
}
