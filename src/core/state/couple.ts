// Pure rules for linked phones: pairing by code, chat, shared words, secrets
// and remote duels. On every phone, partner 0 is "me" and partner 1 is the
// other person. No React, no storage, no network — fully unit-tested.
import { newId, newKey } from "../lib/crypto";
import { coupleKeyFromDh, newDhPair, PAIR_PROTO, type DhPair } from "../lib/pair";
import { CODE_TTL_MS, type Envelope, type Payload, type PartnerInfo, type SharedWord, type Stats } from "../lib/link";
import { addXp, clearChat, editMessage, setReaction, unitPassed, unsendMessage, type AppState, type ChatItem, type Partner, type PartnerIndex, type RemoteDuel, XP } from "./logic";
import { LEVELS, levelUnits } from "../content/levels";
import type { CoupleContext } from "../lib/game";

const MAX_CHAT = 500;
const MAX_SEEN = 1000;

export const isLinked = (s: AppState) => s.couple?.status === "linked";

// ---- pairing ----

/** I created a code: wait for my partner's hello, encrypted with the code key. With `dh`: safe pairing v2. */
export function startPairing(s: AppState, code: string, couple: { id: string; key: string }, now: number, dh?: DhPair): AppState {
  return { ...s, couple: { id: couple.id, key: couple.key, status: "invited", since: now, code, role: "creator", ...(dh ? { proto: PAIR_PROTO, dh } : {}) }, learner: 0 };
}

/**
 * Safe pairing v2, as the partner who typed the code: we're linked straight away with a key
 * from the X25519 exchange. Send `pub` back (in a "join", encrypted with the code key).
 */
export function joinSafely(s: AppState, couple: { id: string; key: string }, creatorPub: string, now: number): { state: AppState; codeKey: string; pub: string } {
  const mine = newDhPair();
  const key = coupleKeyFromDh(mine.secret, creatorPub, couple.key, creatorPub, mine.pub);
  const state: AppState = {
    ...s,
    couple: { id: couple.id, key, status: "linked", since: now, previousKey: couple.key, role: "joiner", proto: PAIR_PROTO, myPub: mine.pub },
    learner: 0,
  };
  return { state: systemNote(state, "You linked your phones 💞", now), codeKey: couple.key, pub: mine.pub };
}

/**
 * I typed my partner's code: we're linked straight away. Returns the fresh key
 * to send in my hello (encrypted with the code key) and to use from now on.
 */
export function joinWithCode(s: AppState, couple: { id: string; key: string }, now: number): { state: AppState; codeKey: string; freshKey: string } {
  const freshKey = newKey();
  const state: AppState = { ...s, couple: { id: couple.id, key: freshKey, status: "linked", since: now, previousKey: couple.key, role: "joiner" }, learner: 0 };
  return { state: systemNote(state, "You linked your phones 💞", now), codeKey: couple.key, freshKey };
}

export const codeExpired = (createdAt: number, now: number) => now - createdAt > CODE_TTL_MS;

export const unlinkCouple = (s: AppState): AppState => ({ ...s, couple: null });

// ---- what I send ----

export function myInfo(s: AppState): PartnerInfo {
  const p = s.partners[0];
  return { id: p.id, name: p.name || "Partner", lang: p.lang };
}

export function statsFor(s: AppState, today: string, yesterday: string): Stats {
  const p = s.partners[0];
  const streakAlive = s.streak.last === today || s.streak.last === yesterday;
  return {
    xp: p.xp,
    streak: streakAlive ? s.streak.count : 0,
    streakDay: s.streak.last,
    unlocked: p.unlocked,
    examsPassed: p.examsPassed,
    week: { id: p.week.id || "2000-W01", xp: p.week.xp },
    wordsKnown: Object.values(p.known).reduce((n, a) => n + a.length, 0),
    unitsPassed: LEVELS.flatMap(levelUnits).filter((u) => unitPassed(p, u.id)).length,
  };
}

function pushChat(s: AppState, item: ChatItem): AppState {
  if (s.chat.some((c) => c.id === item.id)) return s;
  return { ...s, chat: [...s.chat, item].slice(-MAX_CHAT) };
}

const systemNote = (s: AppState, text: string, at: number) => pushChat(s, { id: newId(), from: 0, kind: "system", text, at });

/** Record something I sent (chat, note, secret, word or duel) in my own thread. */
export function recordOutgoing(s: AppState, envId: string, p: Payload, at: number): AppState {
  let next = s;
  const mine = (kind: ChatItem["kind"], text: string, extra: Partial<ChatItem> = {}) =>
    pushChat(next, { id: envId, from: 0, kind, text, at, ...extra });
  switch (p.kind) {
    case "msg":
      next = mine("msg", p.text, p.vanish ? { vanish: p.vanish } : {});
      break;
    case "note":
      next = mine(p.kind, p.text);
      break;
    case "secret":
      next = mine("secret", p.text, { unlockAt: p.unlockAt });
      break;
    case "word":
      next = addWord(mine("word", `${p.word.de} — ${p.word.en}`), p.word);
      break;
    case "duel":
      next = mine("duel", "", { duelId: p.duel.id });
      break;
    case "react":
      return setReaction(s, p.to, 0, p.emoji);
    case "edit":
      return editMessage(s, p.to, 0, p.text, at);
    case "unsend":
      return unsendMessage(s, p.to, 0);
    case "clear":
      return clearChat(s, p.before, "You cleared the chat for both of you 🧹", at);
    default:
      return s;
  }
  if (p.kind === "msg" || p.kind === "note" || p.kind === "secret") {
    next = { ...next, partners: [{ ...next.partners[0], counts: { ...next.partners[0].counts, messages: next.partners[0].counts.messages + 1 } }, next.partners[1]] };
  }
  return next;
}

export function addWord(s: AppState, word: SharedWord): AppState {
  const key = word.de.trim().toLowerCase();
  if (s.customWords.some((w) => w.de.trim().toLowerCase() === key)) return s;
  return { ...s, customWords: [...s.customWords, word].slice(-300) };
}

// ---- what I receive ----

export type ReceiveResult = { state: AppState; isNew: boolean; envelope: Envelope };

/** Apply a decrypted, validated message from my partner. Opening the same link twice does nothing. */
export function receive(s: AppState, env: Envelope, now: number): ReceiveResult {
  if (s.seen.includes(env.id)) return { state: s, isNew: false, envelope: env };
  let next: AppState = { ...s, seen: [...s.seen, env.id].slice(-MAX_SEEN) };

  // Their profile and progress, as of this message.
  const prev = next.partners[1];
  const them: Partner = {
    ...prev,
    id: env.from.id,
    name: env.from.name,
    lang: env.from.lang,
    xp: Math.max(prev.xp, env.stats.xp),
    unlocked: env.stats.unlocked,
    examsPassed: env.stats.examsPassed,
    week: env.stats.week,
    remote:
      !prev.remote || env.at >= prev.remote.at
        ? { streak: env.stats.streak, streakDay: env.stats.streakDay, wordsKnown: env.stats.wordsKnown, unitsPassed: env.stats.unitsPassed, at: env.at }
        : prev.remote,
  };
  next = { ...next, partners: [next.partners[0], them] };

  const theirs = (kind: ChatItem["kind"], text: string, extra: Partial<ChatItem> = {}) =>
    (next = pushChat(next, { id: env.id, from: 1, kind, text, at: env.at, ...extra }));

  switch (env.kind) {
    case "hello":
      // Older app version (no key exchange): still links, and Us suggests re-linking to upgrade.
      if (next.couple && next.couple.status === "invited") {
        next = { ...next, couple: { id: next.couple.id, key: env.key, status: "linked", since: now, previousKey: next.couple.key, role: "creator" } };
      }
      next = systemNote(next, `${env.from.name} joined — your phones are linked 💞`, now);
      break;
    case "join": {
      const c = next.couple;
      if (!c || c.status !== "invited" || !c.dh) return { state: s, isNew: false, envelope: env };
      let key: string;
      try {
        key = coupleKeyFromDh(c.dh.secret, env.pub, c.key, c.dh.pub, env.pub);
      } catch {
        return { state: s, isNew: false, envelope: env };
      }
      // Linked. The one-time secret and the code key are no longer needed.
      next = { ...next, couple: { id: c.id, key, status: "linked", since: now, role: "creator", proto: PAIR_PROTO } };
      next = systemNote(next, `${env.from.name} joined — your phones are linked 💞`, now);
      break;
    }
    case "offer":
      break;
    case "msg":
      theirs("msg", env.text, env.vanish ? { vanish: env.vanish } : {});
      break;
    case "note":
      theirs(env.kind, env.text);
      break;
    case "viewed":
      // My partner saw my "after seen" messages: delete my copies too.
      next = { ...next, chat: next.chat.filter((m) => !(m.from === 0 && m.vanish === "seen" && env.ids.includes(m.id))) };
      break;
    case "secret":
      theirs("secret", env.text, { unlockAt: env.unlockAt });
      break;
    case "word":
      next = addWord(next, env.word);
      theirs("word", `${env.word.de} — ${env.word.en}`);
      break;
    case "duel":
      next = applyDuelMove(next, 1, env.duel, env.at);
      theirs("duel", "", { duelId: env.duel.id });
      break;
    case "react":
      next = setReaction(next, env.to, 1, env.emoji);
      break;
    case "edit":
      next = editMessage(next, env.to, 1, env.text, env.at);
      break;
    case "unsend":
      next = unsendMessage(next, env.to, 1);
      break;
    case "clear":
      // Never in the future: only what existed when my partner pressed "clear".
      next = clearChat(next, Math.min(env.before, env.at), `${env.from.name} cleared the chat for both of you 🧹`, now);
      break;
    case "stats":
      break;
  }
  return { state: next, isNew: true, envelope: env };
}

// ---- remote duels ----

/** Record a duel move by me (0) or my partner (1); settles the duel when both have played. */
export function applyDuelMove(
  s: AppState,
  who: PartnerIndex,
  move: { id: string; topic: string; seed: number; score: number },
  at: number,
  today = new Date(at).toISOString().slice(0, 10),
): AppState {
  const existing = s.remoteDuels.find((d) => d.id === move.id);
  let duel: RemoteDuel = existing ?? {
    id: move.id,
    topic: move.topic,
    seed: move.seed,
    startedBy: who,
    scores: [null, null],
    at,
    settled: false,
  };
  if (duel.scores[who] !== null) return s; // can't play the same duel twice
  const scores: [number | null, number | null] = [...duel.scores];
  scores[who] = move.score;
  duel = { ...duel, scores };

  let next: AppState = { ...s, remoteDuels: existing ? s.remoteDuels.map((d) => (d.id === duel.id ? duel : d)) : [...s.remoteDuels, duel].slice(-100) };
  if (!duel.settled && scores[0] !== null && scores[1] !== null) {
    next = { ...next, remoteDuels: next.remoteDuels.map((d) => (d.id === duel.id ? { ...d, settled: true } : d)) };
    if (scores[0] > scores[1]) {
      next = addXp(next, 0, XP.duelWin, today);
      const me = next.partners[0];
      next = { ...next, partners: [{ ...me, counts: { ...me.counts, duelsWon: me.counts.duelsWon + 1 } }, next.partners[1]] };
    }
  }
  return next;
}

export type DuelStatus = "your-turn" | "their-turn" | "won" | "lost" | "tie";

/** The duel from my point of view. */
export function duelStatus(d: RemoteDuel): DuelStatus {
  const [me, them] = d.scores;
  if (me === null) return "your-turn";
  if (them === null) return "their-turn";
  return me === them ? "tie" : me > them ? "won" : "lost";
}

// ---- secrets ----

/** A secret from my partner opens once my streak reaches its target. My own secrets are always visible to me. */
export const secretOpen = (item: ChatItem, myStreak: number) => item.from === 0 || myStreak >= (item.unlockAt ?? 0);

// ---- achievements ----

/** Everything the achievements need, for me (0) or my partner (1). On linked phones my partner's numbers come from their last message. */
export function achievementContext(s: AppState, i: PartnerIndex, streak: number) {
  const p = s.partners[i];
  const remote = i === 1 && isLinked(s) ? p.remote : null;
  const localWords = Object.values(p.known).reduce((n, a) => n + a.length, 0);
  const localUnits = LEVELS.flatMap(levelUnits).filter((u) => unitPassed(p, u.id)).length;
  return {
    streak: remote ? remote.streak : streak,
    wordsKnown: remote ? remote.wordsKnown : localWords,
    unitsPassed: remote ? remote.unitsPassed : localUnits,
    examsPassed: p.examsPassed.length,
    chatStars: Object.values(p.chatStars).reduce((n, x) => n + x, 0),
    messages: p.counts.messages,
    duelsWon: p.counts.duelsWon,
    linked: isLinked(s),
    perfect: p.counts.perfect,
    a1: p.examsPassed.includes("A1"),
  };
}

/** Numbers for the couple achievements. On linked phones some of my partner's numbers aren't known, so those use what I can see. */
export function coupleContext(s: AppState, streak: number, hasPartner: boolean, postcardCount: number): CoupleContext {
  const [a, b] = s.partners;
  const unitsOf = (i: 0 | 1) => achievementContext(s, i, streak).unitsPassed;
  const notesFromPartner = isLinked(s) ? s.chat.filter((m) => m.from === 1 && m.kind === "note").length : 0;
  return {
    bothLearned: hasPartner && unitsOf(0) >= 1 && unitsOf(1) >= 1,
    streak,
    duels: a.counts.duels + b.counts.duels + s.remoteDuels.length,
    talks: a.counts.talks + b.counts.talks,
    notes: a.counts.notes + b.counts.notes + notesFromPartner,
    a1Both: hasPartner && a.examsPassed.includes("A1") && b.examsPassed.includes("A1"),
    missions: a.counts.hearts + b.counts.hearts,
    postcards: postcardCount,
    berlinReady: a.ready >= 7 || b.ready >= 7,
  };
}

// ---- disappearing messages ----

export const VANISH_MS = { "1d": 864e5, "30d": 30 * 864e5 } as const;
/** An "after seen" message stays readable this long after you first see it (or until you leave the chat). */
export const SEEN_GRACE_MS = 2 * 60 * 1000;
/** If my partner never opens it (or can't send the receipt), my copy still goes after 30 days. */
export const SEEN_FALLBACK_MS = VANISH_MS["30d"];

export function isExpired(m: ChatItem, now: number): boolean {
  if (!m.vanish) return false;
  if (m.vanish === "seen") {
    if (m.from === 1) return m.viewedAt !== undefined && now - m.viewedAt >= SEEN_GRACE_MS;
    return now - m.at >= SEEN_FALLBACK_MS;
  }
  return now - m.at >= VANISH_MS[m.vanish];
}

/** Remove every message whose time is up. Returns the same state when nothing changed. */
export function purgeExpired(s: AppState, now: number): AppState {
  const chat = s.chat.filter((m) => !isExpired(m, now));
  return chat.length === s.chat.length ? s : { ...s, chat };
}

/** I'm looking at these messages now: start the "after seen" countdown. Returns the ids seen for the first time. */
export function markViewed(s: AppState, now: number): { state: AppState; ids: string[] } {
  const ids: string[] = [];
  const chat = s.chat.map((m) => {
    if (m.from === 1 && m.vanish === "seen" && m.viewedAt === undefined) {
      ids.push(m.id);
      return { ...m, viewedAt: now };
    }
    return m;
  });
  return ids.length ? { state: { ...s, chat }, ids } : { state: s, ids };
}

/** Leaving the chat: "after seen" messages I've already seen are gone right away. */
export function leaveChat(s: AppState): AppState {
  const chat = s.chat.filter((m) => !(m.from === 1 && m.vanish === "seen" && m.viewedAt !== undefined));
  return chat.length === s.chat.length ? s : { ...s, chat };
}

/** A short "when does this disappear?" label. */
export function vanishLabel(m: ChatItem, now: number): string | null {
  if (!m.vanish) return null;
  if (m.vanish === "seen") return m.from === 0 ? "👁 Disappears once seen" : "👁 Disappears when you leave the chat";
  const total = VANISH_MS[m.vanish];
  const left = Math.min(total, m.at + total - now);
  const h = Math.max(0, Math.ceil(left / 3600e3));
  return h <= 24 ? `⏱ ${h} h left` : `⏱ ${Math.ceil(h / 24)} days left`;
}
