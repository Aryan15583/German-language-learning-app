// Pure progress rules: no React, no storage. Everything here is unit-tested.
import { bump, missionComplete, missionFor, MISSION_XP, type Mission, type MissionKind } from "../lib/missions";
import { meet, recall, type Memory } from "../lib/srs";
import { isLang, LEVELS, levelIndex, levelUnits, type Lang, type Level, type LevelId, type SubLevel } from "../content/levels";
import { newId, type PinHash } from "../lib/crypto";
import { isoWeek } from "../lib/game";
import type { SharedWord, Vanish } from "../lib/link";
import { cleanMemory, isReaction, MAX_MEMORIES, type MemoryEntry } from "../lib/couplelife";

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
  counts: Counts;
  /** Spaced repetition: how well you know each word (by its German). */
  memory: Record<string, Memory>;
  /** Units whose practice step (hear, say, type, use) is done. */
  practised: string[];
  /** Today's couple mission. */
  mission: Mission | null;
  /** Berlin Ready: days of the final trip completed (0–7). */
  ready: number;
  /** XP per calendar day (last 60 days), for the streak chart. */
  history: Record<string, number>;
  /** For the partner on a linked phone: their own streak and totals, from their last message. */
  remote: { streak: number; streakDay: string | null; wordsKnown: number; unitsPassed: number; at: number } | null;
};

export type Counts = {
  messages: number;
  duelsWon: number;
  /** Love notes sent. */
  notes: number;
  /** Quizzes with every answer right. */
  perfect: number;
  /** Daily missions completed (❤️ couple hearts). */
  hearts: number;
  /** Duels played (any kind). */
  duels: number;
  /** Conversations finished (chats, role-plays). */
  talks: number;
};

export const freshCounts = (): Counts => ({ messages: 0, duelsWon: 0, notes: 0, perfect: 0, hearts: 0, duels: 0, talks: 0 });

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
  /** 2 = safe pairing (X25519 key exchange). Missing = older pairing: re-link to upgrade. */
  proto?: 2;
  /** Code maker, while waiting: my one-time X25519 key pair (deleted once linked). */
  dh?: { secret: string; pub: string };
  /** Partner who typed the code: my public key, to re-send the "join" if it got lost. */
  myPub?: string;
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
  /** Disappearing message timer. */
  vanish?: Vanish;
  /** When I first saw a disappearing message from my partner. */
  viewedAt?: number;
  /** Emoji reactions: 0 = mine, 1 = my partner's. */
  reacts?: { 0?: string; 1?: string };
  /** When the sender last edited the text. */
  edited?: number;
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
  /** The first-time "how it works" card was dismissed. */
  welcomeDone: boolean;
  /** When this state last changed (ms) — decides which copy wins: this phone's or the cloud's. */
  updatedAt: number;
  /** Recent things you did, newest last (for "Recent activity"). */
  log: LogEntry[];
  /** Timer for new chat messages I send ("off" = keep). */
  vanish: Vanish | "off";
  /** Our memory book: moments we saved, newest last. */
  memories: MemoryEntry[];
  /** The chat was cleared up to this time (older archived messages are deleted too). */
  chatClearedAt: number;
};

export type LogEntry = { at: number; icon: string; text: string };

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
  counts: freshCounts(),
  remote: null,
  history: {},
  memory: {},
  practised: [],
  mission: null,
  ready: 0,
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
  welcomeDone: false,
  updatedAt: 0,
  log: [],
  vanish: "off",
  memories: [],
  chatClearedAt: 0,
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
    counts: { ...freshCounts(), ...(p?.counts ?? {}) },
    memory: p?.memory && typeof p.memory === "object" ? p.memory : {},
    practised: Array.isArray(p?.practised) ? p.practised : [],
    mission: p?.mission && typeof p.mission === "object" ? p.mission : null,
    ready: typeof p?.ready === "number" ? Math.max(0, Math.min(7, Math.floor(p.ready))) : 0,
    remote: p?.remote ?? null,
    history: p?.history && typeof p.history === "object" ? p.history : {},
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
    welcomeDone: r.welcomeDone === true,
    updatedAt: typeof r.updatedAt === "number" && r.updatedAt > 0 ? r.updatedAt : 0,
    log: Array.isArray(r.log) ? r.log.slice(-40) : [],
    vanish: r.vanish === "seen" || r.vanish === "1d" || r.vanish === "30d" ? r.vanish : "off",
    chatClearedAt: typeof r.chatClearedAt === "number" && r.chatClearedAt > 0 ? r.chatClearedAt : 0,
    memories: Array.isArray(r.memories) ? r.memories.map(cleanMemory).filter((m): m is MemoryEntry => m !== null).slice(-MAX_MEMORIES) : [],
  };
}

// ---- Memory book ----
export const addMemory = (s: AppState, m: MemoryEntry): AppState => {
  const clean = cleanMemory(m);
  if (!clean || s.memories.some((x) => x.id === clean.id)) return s;
  return { ...s, memories: [...s.memories, clean].sort((a, b) => a.at - b.at).slice(-MAX_MEMORIES) };
};
export const removeMemory = (s: AppState, id: string): AppState => ({ ...s, memories: s.memories.filter((m) => m.id !== id) });

/** Messages that can be edited or deleted by whoever sent them. */
export const EDITABLE: ChatItem["kind"][] = ["msg", "note"];

/** Change the text of a message — only the person who sent it can. */
export function editMessage(s: AppState, msgId: string, by: PartnerIndex, text: string, at: number): AppState {
  const t = text.trim();
  if (!t) return s;
  let hit = false;
  const chat = s.chat.map((m) => {
    if (m.id !== msgId || m.from !== by || !EDITABLE.includes(m.kind) || m.text === t) return m;
    hit = true;
    return { ...m, text: t, edited: at };
  });
  return hit ? { ...s, chat } : s;
}

/** Empty the chat up to `before` (ms). Memories, words and progress stay. */
export function clearChat(s: AppState, before: number, note: string, now: number): AppState {
  const chat = s.chat.filter((m) => m.at > before);
  return { ...s, chat: [...chat, { id: newId(), from: 0, kind: "system", text: note, at: now }], chatClearedAt: Math.max(s.chatClearedAt, before) };
}

/** Delete a message for both of us — only the person who sent it can. */
export function unsendMessage(s: AppState, msgId: string, by: PartnerIndex): AppState {
  const chat = s.chat.filter((m) => !(m.id === msgId && m.from === by && (EDITABLE.includes(m.kind) || m.kind === "secret")));
  return chat.length === s.chat.length ? s : { ...s, chat };
}

/** Set (or clear, with "") one person's reaction on a chat message. */
export function setReaction(s: AppState, msgId: string, who: PartnerIndex, emoji: string): AppState {
  if (!isReaction(emoji)) return s;
  let hit = false;
  const chat = s.chat.map((m) => {
    if (m.id !== msgId) return m;
    hit = true;
    const reacts = { ...(m.reacts ?? {}) };
    if (emoji) reacts[who] = emoji;
    else delete reacts[who];
    return { ...m, reacts };
  });
  return hit ? { ...s, chat } : s;
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
    history: trimHistory({ ...p.history, [today]: (p.history[today] ?? 0) + gain }),
  }));
}

const HISTORY_DAYS = 60;
function trimHistory(h: Record<string, number>): Record<string, number> {
  const days = Object.keys(h).sort();
  return days.length <= HISTORY_DAYS ? h : Object.fromEntries(days.slice(-HISTORY_DAYS).map((d) => [d, h[d]]));
}

/** Remember something worth showing under "Recent activity". */
export const logActivity = (s: AppState, icon: string, text: string, at: number): AppState => ({
  ...s,
  log: [...s.log, { at, icon, text }].slice(-40),
});

/** Days (most recent last) with the XP earned on each, e.g. for a Mon–Sun chart. */
export function lastDays(p: Partner, today: string, n = 7): { date: string; xp: number }[] {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: n }, (_, k) => {
    const date = new Date(Date.UTC(y, m - 1, d - (n - 1 - k))).toISOString().slice(0, 10);
    return { date, xp: p.history[date] ?? 0 };
  });
}

/** How many different days this person has learned on. */
export const daysLearned = (p: Partner) => Object.values(p.history).filter((x) => x > 0).length;

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

// ---- Memory, practice, missions ----

/** A quiz answer about one word: move it along its review schedule. */
export const remember = (s: AppState, i: PartnerIndex, key: string, correct: boolean, today: string, slow = false): AppState =>
  withPartner(s, i, (p) => ({ ...p, memory: { ...p.memory, [key]: recall(p.memory[key], correct, today, slow) } }));

/** Met a word in flashcards: it starts its review schedule (seen again tomorrow). */
export const meetWord = (s: AppState, i: PartnerIndex, key: string, today: string): AppState =>
  withPartner(s, i, (p) => (p.memory[key] ? p : { ...p, memory: { ...p.memory, [key]: meet(undefined, today) } }));

export const markPractised = (s: AppState, i: PartnerIndex, unitId: string): AppState =>
  withPartner(s, i, (p) => (p.practised.includes(unitId) ? p : { ...p, practised: [...p.practised, unitId] }));

export const bumpMission = (s: AppState, i: PartnerIndex, kind: MissionKind, today: string, n = 1): AppState =>
  withPartner(s, i, (p) => ({ ...p, mission: bump(p.mission, kind, today, n) }));

export const countUp = (s: AppState, i: PartnerIndex, key: keyof Counts, n = 1): AppState =>
  withPartner(s, i, (p) => ({ ...p, counts: { ...p.counts, [key]: p.counts[key] + n } }));

/** Claim today's mission reward: +100 XP and a couple heart. Only once, and only when done. */
export function claimMission(s: AppState, i: PartnerIndex, today: string): AppState {
  const m = missionFor(s.partners[i].mission, today);
  if (m.claimed || !missionComplete(m)) return s;
  const claimed = withPartner(s, i, (p) => ({ ...p, mission: { ...m, claimed: true }, counts: { ...p.counts, hearts: p.counts.hearts + 1 } }));
  return addXp(claimed, i, MISSION_XP, today);
}

/** Berlin Ready: finish a day of the trip (in order). */
export const finishReadyDay = (s: AppState, i: PartnerIndex, day: number): AppState =>
  withPartner(s, i, (p) => ({ ...p, ready: Math.max(p.ready, Math.min(7, day)) }));

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
