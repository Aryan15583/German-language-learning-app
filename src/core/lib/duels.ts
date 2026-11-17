// Duel types. The mode travels inside the duel's topic ("speed-mix-A1"), so a remote
// duel needs no new message format: same seed + same mode = same questions on both phones.
import { levelWords } from "../content/levels";
import { makeQuestions, type Question } from "./questions";
import { sentencesFor, pickSentences, type Sentence } from "./sentences";
import { resolveTopic } from "./topics";
import { seededRng } from "./util";
import type { Lang } from "../content/levels";

export type DuelMode = "classic" | "speed" | "knowledge" | "sentence" | "translate" | "streak";

export const DUEL_MODES: { id: DuelMode; emoji: string; title: string; desc: string }[] = [
  { id: "classic", emoji: "⚔️", title: "Classic", desc: "6 questions, most right wins." },
  { id: "speed", emoji: "⚡", title: "Speed", desc: "Fast right answers score double." },
  { id: "knowledge", emoji: "🧠", title: "Knowledge", desc: "Harder: mostly typing, no rush." },
  { id: "sentence", emoji: "🧩", title: "Sentence", desc: "Build German sentences in the right order." },
  { id: "translate", emoji: "🗣️", title: "Translation", desc: "German → your language." },
  { id: "streak", emoji: "🎯", title: "Streak", desc: "Keep going until 3 mistakes." },
];

const PREFIXES = DUEL_MODES.filter((m) => m.id !== "classic").map((m) => m.id);

export const encodeDuel = (mode: DuelMode, topic: string) => (mode === "classic" ? topic : `${mode}-${topic}`);

export function decodeDuel(raw: string): { mode: DuelMode; topic: string } {
  for (const p of PREFIXES) if (raw.startsWith(p + "-")) return { mode: p, topic: raw.slice(p.length + 1) };
  return { mode: "classic", topic: raw };
}

export const STREAK_LIVES = 3;
export const SPEED_FAST_MS = 5000;
export const SENTENCE_ROUNDS = 5;

/** Points for one answer: speed duels reward quick right answers. */
export const answerPoints = (mode: DuelMode, correct: boolean, ms: number) => (!correct ? 0 : mode === "speed" && ms < SPEED_FAST_MS ? 2 : 1);

export function duelInfo(raw: string) {
  const { mode, topic } = decodeDuel(raw);
  const base = resolveTopic(topic);
  if (!base) return null;
  const m = DUEL_MODES.find((x) => x.id === mode)!;
  return { ...base, mode, title: mode === "classic" ? base.title : `${m.emoji} ${m.title} · ${base.title}` };
}

/** Questions for a duel (not sentence mode). Same seed → same questions. */
export function duelQuestions(raw: string, lang: Lang, seed: number): Question[] {
  const info = duelInfo(raw);
  if (!info) return [];
  const rng = seededRng(seed);
  const all = levelWords(info.level);
  switch (info.mode) {
    case "knowledge":
      return makeQuestions(info.pool, all, { count: 8, typingShare: 0.75, lang, rng });
    case "translate":
      return makeQuestions(info.pool, all, { count: 8, lang, rng, direction: "de-x" });
    case "streak": {
      // Plenty of questions, cycling through the pool; the duel stops at the 3rd mistake.
      const out: Question[] = [];
      while (out.length < 40) out.push(...makeQuestions(info.pool, all, { count: info.pool.length, lang, rng }));
      return out.slice(0, 40);
    }
    default:
      return makeQuestions(info.pool, all, { count: 6, lang, rng });
  }
}

export function duelSentences(raw: string, seed: number): Sentence[] {
  const info = duelInfo(raw);
  if (!info) return [];
  return pickSentences(sentencesFor(info.level.id, 3, 8), SENTENCE_ROUNDS, seededRng(seed));
}
