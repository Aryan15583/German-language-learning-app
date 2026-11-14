// Pure progress rules: no React, no storage. Everything here is unit-tested.
import { isLang, LEVELS, levelIndex, levelUnits, type Lang, type Level, type LevelId, type SubLevel } from "../content/levels";
import { newId, type PinHash } from "../lib/crypto";
import { isoWeek } from "../lib/game";
import type { SharedWord } from "../lib/link";

export type PartnerIndex = 0 | 1;

export type Partner = {
  /** Random id; on linked phones it identifies who sent a message. */
  id: string;
  name: string;
  /** Optional PIN lock for this profile (stored only as a salted hash). */
  pin: PinHash | null;
  /** Language this partner learns German through (meanings, quizzes, chat help). */
  lang: Lang;
  xp: number;
  /** Highest unlocked level (index into LEVELS). */
  unlocked: number;
  /** Mastered flashcard indexes per unit id. */
  known: Record<string, number[]>;
  /** Best unit-test score per unit id, 0–1. */
  unitScores: Record<string, number>;
  /** Levels whose final exam this partner has passed. */
  examsPassed: LevelId[];
  /** Best chat result per scenario id: number of stars (1–3). */
  chatStars: Record<string, number>;
  /** XP earned this ISO week and today, for the weekly battle and daily goal. */
  week: { id: string; xp: number };
  today: { date: string; xp: number };
  counts: { messages: number; duelsWon: number };
  /** For the partner on a linked phone: their own streak and totals, from their last message. */
  remote: { streak: number; streakDay: string | null; wordsKnown: number; unitsPassed: number; at: number } | null;
};

export type Couple = {
  id: string;
  key: string;
  /** "invited": invite sent, waiting for the partner's reply. "linked": both phones paired. */
  status: "invited" | "linked";
  since: number;
  /** While invited: the 6-character code to show again. */
  code?: string;
  /** Who made the code ("creator") and who typed it in ("joiner"). */
  role?: "creator" | "joiner";
  /** The pairing (code) key, kept so the first "hello" link can still be opened or re-sent. */
  previousKey?: string;
};

export type ChatKind = "msg" | "note" | "secret" | "word" | "duel" | "system";

export type ChatItem = {
  id: string;
  from: PartnerIndex;
  kind: ChatKind;
  text: string;
  at: number;
  /** Secrets open when the reader's streak reaches this many days. */
  unlockAt?: number;
  duelId?: string;
};

/** A duel played on two phones: same questions (same seed), one after the other. */
export type RemoteDuel = {
  id: string;
  topic: string;
  seed: number;
  startedBy: PartnerIndex;
  /** [me, partner] — null until that person has played. */
  scores: [number | null, number | null];
  at: number;
  settled: boolean;
};

export type DuelResult = { title: string; scores: [number, number]; date: string };

export type AppState = {
  partners: [Partner, Partner];
  learner: PartnerIndex;
  streak: { count: number; last: string | null };
  duels: DuelResult[];
  couple: Couple | null;
  chat: ChatItem[];
  /** Ids of links already opened, so opening one twice does nothing. */
  seen: string[];
  customWords: SharedWord[];
  remoteDuels: RemoteDuel[];
  /** Last message id read from each relay mailbox. */
  relayCursor: Record<string, number>;
};

// ---- Rules ----
export const UNIT_TEST_QUESTIONS = 8;
export const UNIT_PASS = 0.8;
export const EXAM_QUESTIONS = 12;
export const EXAM_PASS = 0.75;
export const PLACEMENT_QUESTIONS = 4;
export const PLACEMENT_PASS = 3; // correct answers needed to move up a level
export const XP = { chatTurn: 5, chatDone: 15, flashcard: 5, correctAnswer: 2, unitPassed: 20, examPassed: 100, duelCorrect: 10, duelWin: 15, dialogue: 10, note: 5 };

const MAX_LEVEL = LEVELS.length - 1;

export const newPartner = (): Partner => ({
  id: newId(),
  name: "",
  pin: null,
  lang: "en",
  xp: 0,
  unlocked: 0,
  known: {},
  unitScores: {},
  examsPassed: [],
  chatStars: {},
  week: { id: "", xp: 0 },
  today: { date: "", xp: 0 },
  counts: { messages: 0, duelsWon: 0 },
  remote: null,
});

export const freshState = (): AppState => ({
  partners: [newPartner(), newPartner()],
  learner: 0,
  streak: { count: 0, last: null },
  duels: [],
  couple: null,
  chat: [],
  seen: [],
  customWords: [],
  remoteDuels: [],
  relayCursor: {},
});

const clampLevel = (n: unknown) => (typeof n === "number" && n >= 0 ? Math.min(Math.floor(n), MAX_LEVEL) : 0);

/** Load saved data from any earlier version, filling in anything missing. */
export function migrate(raw: unknown): AppState {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  const partner = (p: Partial<Partner> | undefined): Partner => ({
    ...newPartner(),
    ...p,
    unlocked: clampLevel(p?.unlocked),
    known: p?.known ?? {},
    unitScores: p?.unitScores ?? {},
    examsPassed: p?.examsPassed ?? [],
    chatStars: p?.chatStars ?? {},
    lang: isLang(p?.lang) ? p.lang : "en",
    id: typeof p?.id === "string" && p.id ? p.id : newId(),
    pin: p?.pin && typeof p.pin === "object" ? p.pin : null,
    week: p?.week ?? { id: "", xp: 0 },
    today: p?.today ?? { date: "", xp: 0 },
    counts: p?.counts ?? { messages: 0, duelsWon: 0 },
    remote: p?.remote ?? null,
  });
  return {
    partners: [partner(r.partners?.[0]), partner(r.partners?.[1])],
    learner: r.learner === 1 ? 1 : 0,
    streak: r.streak ?? base.streak,
    duels: Array.isArray(r.duels) ? r.duels : [],
    couple: r.couple && typeof r.couple === "object" ? r.couple : null,
    chat: Array.isArray(r.chat) ? r.chat : [],
    seen: Array.isArray(r.seen) ? r.seen : [],
    customWords: Array.isArray(r.customWords) ? r.customWords : [],
    remoteDuels: Array.isArray(r.remoteDuels) ? r.remoteDuels : [],
    relayCursor: r.relayCursor && typeof r.relayCursor === "object" ? r.relayCursor : {},
  };
}

function withPartner(s: AppState, i: PartnerIndex, fn: (p: Partner) => Partner): AppState {
  const partners = [...s.partners] as [Partner, Partner];
  partners[i] = fn(partners[i]);
  return { ...s, partners };
}

/** Add XP to the total, this week and today (no streak change). */
export function addXp(s: AppState, i: PartnerIndex, xp: number, today: string): AppState {
  const gain = Math.max(0, xp);
  const week = isoWeek(today);
  return withPartner(s, i, (p) => ({
    ...p,
    xp: p.xp + gain,
    week: { id: week, xp: (p.week.id === week ? p.week.xp : 0) + gain },
    today: { date: today, xp: (p.today.date === today ? p.today.xp : 0) + gain },
  }));
}

/** Award XP and keep the shared streak alive (one bump per calendar day). */
export function applyPractice(s: AppState, i: PartnerIndex, xp: number, today: string, yesterday: string): AppState {
  const next = addXp(s, i, xp, today);
  if (s.streak.last === today) return next;
  const count = s.streak.last === yesterday ? s.streak.count + 1 : 1;
  return { ...next, streak: { count, last: today } };
}

export const streakToShow = (s: AppState, today: string, yesterday: string) =>
  s.streak.last === today || s.streak.last === yesterday ? s.streak.count : 0;

export const markKnown = (s: AppState, i: PartnerIndex, unitId: string, wordIndex: number): AppState =>
  withPartner(s, i, (p) => ({
    ...p,
    known: { ...p.known, [unitId]: Array.from(new Set([...(p.known[unitId] ?? []), wordIndex])) },
  }));

/** Keep the best unit-test score. */
export const recordUnitScore = (s: AppState, i: PartnerIndex, unitId: string, score: number): AppState =>
  withPartner(s, i, (p) => ({
    ...p,
    unitScores: { ...p.unitScores, [unitId]: Math.max(p.unitScores[unitId] ?? 0, score) },
  }));

/** Passing a level's exam marks it passed and unlocks the next level. */
export function recordExam(s: AppState, i: PartnerIndex, level: LevelId, score: number): AppState {
  if (score < EXAM_PASS) return s;
  const idx = levelIndex(level);
  return withPartner(s, i, (p) => ({
    ...p,
    examsPassed: p.examsPassed.includes(level) ? p.examsPassed : [...p.examsPassed, level],
    unlocked: Math.max(p.unlocked, Math.min(idx + 1, MAX_LEVEL)),
  }));
}

export const setLang = (s: AppState, i: PartnerIndex, lang: Lang): AppState => withPartner(s, i, (p) => ({ ...p, lang }));

/** Keep the best chat result (stars). */
export const recordChat = (s: AppState, i: PartnerIndex, chatId: string, stars: number): AppState =>
  withPartner(s, i, (p) => ({
    ...p,
    chatStars: { ...p.chatStars, [chatId]: Math.max(p.chatStars[chatId] ?? 0, stars) },
  }));

/** Placement never takes levels away. */
export const applyPlacement = (s: AppState, i: PartnerIndex, levelIdx: number): AppState =>
  withPartner(s, i, (p) => ({ ...p, unlocked: Math.max(p.unlocked, clampLevel(levelIdx)) }));

// ---- Queries ----
export const unitPassed = (p: Partner, unitId: string) => (p.unitScores[unitId] ?? 0) >= UNIT_PASS;

export const knownInUnit = (p: Partner, unitId: string) => p.known[unitId]?.length ?? 0;

export function subLevelProgress(p: Partner, sub: SubLevel) {
  const passed = sub.units.filter((u) => unitPassed(p, u.id)).length;
  return { passed, total: sub.units.length, done: passed === sub.units.length };
}

export function levelProgress(p: Partner, level: Level) {
  const units = levelUnits(level);
  const passed = units.filter((u) => unitPassed(p, u.id)).length;
  return { passed, total: units.length, share: units.length ? passed / units.length : 0 };
}

/** The exam opens once every unit in the level is passed. */
export const examReady = (p: Partner, level: Level) => levelUnits(level).every((u) => unitPassed(p, u.id));

export const isLocked = (p: Partner, level: Level) => levelIndex(level.id) > p.unlocked;

/** The sub-level a partner is working on: the first unfinished one in their current level. */
export function currentSubLevel(p: Partner): SubLevel {
  const level = LEVELS[p.unlocked];
  return level.subLevels.find((sub) => !subLevelProgress(p, sub).done) ?? level.subLevels[level.subLevels.length - 1];
}

/**
 * Placement: levels are tested in order (A1, A2, …). Each passed level moves you up;
 * the first failed level is where you start. Returns the index of the starting level.
 */
export function placementLevel(correctPerLevel: readonly number[]): number {
  let level = 0;
  for (const correct of correctPerLevel) {
    if (correct < PLACEMENT_PASS) break;
    level++;
  }
  return Math.min(level, MAX_LEVEL);
}

/** Should the placement test continue to the next level? */
export const placementContinues = (correctPerLevel: readonly number[]) =>
  correctPerLevel.length < LEVELS.length &&
  correctPerLevel.every((c) => c >= PLACEMENT_PASS);

export const partnerName = (s: AppState, i: PartnerIndex) => s.partners[i].name || (i ? "Partner B" : "Partner A");
