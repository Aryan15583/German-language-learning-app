// The chat archive: the full history on this phone (up to 1,000,000 messages / 100 MB).
// The app's saved state keeps only the newest messages (fast, and small enough for the
// encrypted cloud backup); every message is also copied into the archive.
import type { ChatItem } from "../state/logic";

export const CHAT_LIMITS = {
  /** Most messages kept on this phone. */
  maxMessages: 1_000_000,
  /** The breakpoint: above this, the oldest messages are removed… */
  maxBytes: 100 * 1024 * 1024,
  /** …until the archive is back down to this, so trimming doesn't run on every message. */
  targetBytes: 70 * 1024 * 1024,
} as const;

/** About how much space one message takes in the browser's database. */
export const itemBytes = (m: ChatItem) => JSON.stringify(m).length * 2;

/**
 * What changed between two versions of the recent chat window:
 * - put: new messages, and messages that changed (e.g. "seen" by me);
 * - del: messages that were deleted on purpose (disappearing timers, "after seen", receipts).
 * Messages that only scrolled out of the window (it keeps the newest N) stay in the archive.
 */
export function archiveDiff(prev: readonly ChatItem[], next: readonly ChatItem[]): { put: ChatItem[]; del: string[] } {
  const before = new Map(prev.map((m) => [m.id, m]));
  const after = new Set(next.map((m) => m.id));
  const put = next.filter((m) => before.get(m.id) !== m);
  const oldestKept = next.length ? Math.min(...next.map((m) => m.at)) : Infinity;
  const del = prev.filter((m) => !after.has(m.id) && (next.length === 0 || m.at >= oldestKept)).map((m) => m.id);
  return { put, del };
}

export type ArchiveStats = { count: number; bytes: number };

/** Is the archive over its limits? */
export const overLimit = (s: ArchiveStats) => s.count > CHAT_LIMITS.maxMessages || s.bytes > CHAT_LIMITS.maxBytes;

/** Trim until it's under both the message cap and the target size. */
export const trimmedEnough = (s: ArchiveStats) => s.count <= CHAT_LIMITS.maxMessages && s.bytes <= CHAT_LIMITS.targetBytes;

export const formatMB = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(0.1, bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
