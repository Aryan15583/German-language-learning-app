// Serverless couple link. Everything travels inside URL fragments (#…), which
// browsers never send to a server. Invites carry the couple key; every other
// message is encrypted with it, and everything received is strictly validated.
import { LEVEL_IDS, type Lang, type LevelId } from "../content/levels";
import { fromBase64Url, newId, open, seal, toBase64Url } from "./crypto";

export const LINK_VERSION = 1;
export const LIMITS = { name: 20, text: 1000, word: 80, id: 32 };

export class LinkError extends Error {}

export type PartnerInfo = { id: string; name: string; lang: Lang };

export type Invite = { v: 1; t: "invite"; couple: string; key: string; from: PartnerInfo };

/** A snapshot of the sender's progress, so each phone can show the other's score. */
export type Stats = {
  xp: number;
  streak: number;
  streakDay: string | null;
  unlocked: number;
  examsPassed: LevelId[];
  week: { id: string; xp: number };
  wordsKnown: number;
  unitsPassed: number;
};

export type SharedWord = { de: string; en: string; mr: string };

export type Payload =
  | { kind: "hello" }
  | { kind: "stats" }
  | { kind: "msg"; text: string }
  | { kind: "note"; text: string }
  | { kind: "secret"; text: string; unlockAt: number }
  | { kind: "word"; word: SharedWord };

export type Envelope = {
  v: 1;
  id: string;
  couple: string;
  at: number;
  from: PartnerInfo;
  stats: Stats;
} & Payload;

// ---- validation helpers ----
const fail = (why: string): never => {
  throw new LinkError(why);
};
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
function str(x: unknown, max: number, field: string, allowEmpty = false): string {
  if (typeof x !== "string") return fail(`${field} missing`);
  const t = x.trim();
  if (!allowEmpty && !t) return fail(`${field} empty`);
  if (t.length > max) return fail(`${field} too long`);
  // No control characters (keeps line breaks and tabs).
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) return fail(`${field} has invalid characters`);
  return t;
}
function int(x: unknown, min: number, max: number, field: string): number {
  if (typeof x !== "number" || !Number.isInteger(x) || x < min || x > max) return fail(`${field} invalid`);
  return x;
}
const idStr = (x: unknown, field: string) => {
  const s = str(x, LIMITS.id, field);
  if (!/^[A-Za-z0-9_-]+$/.test(s)) fail(`${field} invalid`);
  return s;
};
const lang = (x: unknown): Lang => (x === "en" || x === "mr" || x === "mr-Latn" ? x : fail("lang invalid"));
const dateStr = (x: unknown) => (x === null ? null : /^\d{4}-\d{2}-\d{2}$/.test(String(x)) ? String(x) : fail("date invalid"));

function partnerInfo(x: unknown): PartnerInfo {
  if (!isObj(x)) return fail("sender missing");
  return { id: idStr(x.id, "sender id"), name: str(x.name, LIMITS.name, "name"), lang: lang(x.lang) };
}

function stats(x: unknown): Stats {
  if (!isObj(x) || !isObj(x.week)) return fail("stats missing");
  const exams = Array.isArray(x.examsPassed) ? x.examsPassed : fail("exams invalid");
  return {
    xp: int(x.xp, 0, 10_000_000, "xp"),
    streak: int(x.streak, 0, 100_000, "streak"),
    streakDay: dateStr(x.streakDay),
    unlocked: int(x.unlocked, 0, LEVEL_IDS.length - 1, "unlocked"),
    examsPassed: [...new Set(exams.map((e) => (LEVEL_IDS.includes(e as LevelId) ? (e as LevelId) : fail("exam invalid"))))],
    week: {
      id: /^\d{4}-W\d{2}$/.test(String(x.week.id)) ? String(x.week.id) : fail("week invalid"),
      xp: int(x.week.xp, 0, 10_000_000, "week xp"),
    },
    wordsKnown: int(x.wordsKnown, 0, 100_000, "words"),
    unitsPassed: int(x.unitsPassed, 0, 10_000, "units"),
  };
}

function payload(x: Record<string, unknown>): Payload {
  switch (x.kind) {
    case "hello":
    case "stats":
      return { kind: x.kind };
    case "msg":
    case "note":
      return { kind: x.kind, text: str(x.text, LIMITS.text, "message") };
    case "secret":
      return { kind: "secret", text: str(x.text, LIMITS.text, "secret"), unlockAt: int(x.unlockAt, 1, 365, "unlock") };
    case "word": {
      const w = isObj(x.word) ? x.word : fail("word missing");
      return {
        kind: "word",
        word: { de: str(w.de, LIMITS.word, "German"), en: str(w.en, LIMITS.word, "meaning"), mr: str(w.mr ?? "", LIMITS.word, "Marathi", true) },
      };
    }
    default:
      return fail("unknown message type");
  }
}

// ---- invites ----
export function makeInvite(from: PartnerInfo, couple: string, key: string): Invite {
  return { v: 1, t: "invite", couple, key, from };
}

export const inviteFragment = (invite: Invite) => toBase64Url(new TextEncoder().encode(JSON.stringify(invite)));

export function parseInvite(fragment: string): Invite {
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(fromBase64Url(fragment.replace(/^#/, ""))));
  } catch {
    return fail("This invite link is damaged. Ask your partner to send it again.");
  }
  if (!isObj(raw) || raw.v !== LINK_VERSION || raw.t !== "invite") return fail("This isn't an invite link.");
  // A 32-byte key is 43 base64url characters.
  const key = typeof raw.key === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw.key) ? raw.key : fail("invite key invalid");
  if (fromBase64Url(key).length !== 32) fail("invite key invalid");
  return { v: 1, t: "invite", couple: idStr(raw.couple, "couple"), key, from: partnerInfo(raw.from) };
}

// ---- messages ----
export function makeEnvelope(couple: string, from: PartnerInfo, s: Stats, p: Payload, at = Date.now()): Envelope {
  return { v: 1, id: newId(), couple, at, from, stats: s, ...p } as Envelope;
}

export const sealEnvelope = (key: string, env: Envelope) => seal(key, env);

/** Decrypt and validate a message link. Throws LinkError with a friendly reason. */
export function openEnvelope(key: string, couple: string, fragment: string, now = Date.now()): Envelope {
  let raw: unknown;
  try {
    raw = open(key, fragment.replace(/^#/, ""));
  } catch {
    return fail("This message isn't for this couple, or the link was changed.");
  }
  if (!isObj(raw) || raw.v !== LINK_VERSION) return fail("Unsupported message.");
  if (raw.couple !== couple) return fail("This message belongs to a different couple.");
  const at = int(raw.at, Date.UTC(2024, 0, 1), now + 864e5, "time");
  return {
    v: 1,
    id: idStr(raw.id, "id"),
    couple,
    at,
    from: partnerInfo(raw.from),
    stats: stats(raw.stats),
    ...payload(raw),
  } as Envelope;
}
