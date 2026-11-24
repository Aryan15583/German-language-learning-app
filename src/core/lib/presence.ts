// "online" / "last seen today at 14:05", like WhatsApp. The status itself is end-to-end encrypted.
import { open, seal } from "./crypto";

export type Presence = { at: number; online: boolean };

/** While the app is open, each phone says "I'm here" this often. */
export const HEARTBEAT_MS = 40_000;
/** Counted as online if the last "I'm here" is this recent. */
const ONLINE_WINDOW_MS = 100_000;

export const sealPresence = (key: string, p: Presence) => seal(key, { at: Math.round(p.at), online: p.online });

export function openPresence(key: string, payload: string | null, now: number): Presence | null {
  if (!payload) return null;
  try {
    const x = open(key, payload) as Partial<Presence>;
    if (typeof x.at !== "number" || !Number.isFinite(x.at) || typeof x.online !== "boolean") return null;
    return { at: Math.min(x.at, now), online: x.online };
  } catch {
    return null;
  }
}

export const isOnline = (p: Presence | null, now: number) => !!p && p.online && now - p.at < ONLINE_WINDOW_MS;

const hm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "online", "last seen just now", "last seen today at 14:05", "last seen yesterday at 22:10", "last seen 12 Nov". */
export function presenceLabel(p: Presence | null, now: number): string | null {
  if (!p) return null;
  if (isOnline(p, now)) return "online";
  const ago = now - p.at;
  if (ago < 2 * 60_000) return "last seen just now";
  if (ago < 60 * 60_000) return `last seen ${Math.round(ago / 60_000)} min ago`;
  const d = new Date(p.at);
  const days = Math.round((dayStart(now) - dayStart(p.at)) / 86_400_000);
  if (days <= 0) return `last seen today at ${hm(d)}`;
  if (days === 1) return `last seen yesterday at ${hm(d)}`;
  if (days < 7) return `last seen ${d.toLocaleDateString([], { weekday: "long" })} at ${hm(d)}`;
  return `last seen ${d.toLocaleDateString([], { day: "numeric", month: "short" })}`;
}
