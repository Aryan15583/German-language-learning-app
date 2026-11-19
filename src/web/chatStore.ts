// The chat archive on this phone, in IndexedDB (the browser's database for large data).
// Writes are batched and run in the background, so the app never waits for them.
import { CHAT_LIMITS, itemBytes, type ArchiveStats } from "../core/lib/archive";
import { isExpired } from "../core/state/couple";
import type { ChatItem } from "../core/state/logic";

const VERSION = 1;
type Stored = ChatItem & { size: number };

export const archiveName = (storageKey: string) => `zh-chat:${storageKey}`;

const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
const done = (tx: IDBTransaction) =>
  new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });

export class ChatArchive {
  private db: Promise<IDBDatabase>;

  constructor(readonly name: string, factory: IDBFactory = indexedDB) {
    this.db = new Promise((res, rej) => {
      const open = factory.open(name, VERSION);
      open.onupgradeneeded = () => {
        const db = open.result;
        const msgs = db.createObjectStore("msgs", { keyPath: "id" });
        msgs.createIndex("at", "at");
        // Only disappearing messages have this field, so the index stays tiny.
        msgs.createIndex("vanish", "vanish");
        db.createObjectStore("meta");
      };
      open.onsuccess = () => res(open.result);
      open.onerror = () => rej(open.error);
    });
  }

  async stats(): Promise<ArchiveStats> {
    const db = await this.db;
    const s = await req(db.transaction("meta").objectStore("meta").get("stats"));
    return (s as ArchiveStats | undefined) ?? { count: 0, bytes: 0 };
  }

  /** Save new/changed messages and delete removed ones, in one transaction. */
  async apply(put: readonly ChatItem[], del: readonly string[]): Promise<void> {
    if (!put.length && !del.length) return;
    const db = await this.db;
    const tx = db.transaction(["msgs", "meta"], "readwrite");
    const msgs = tx.objectStore("msgs");
    const meta = tx.objectStore("meta");
    const stats = ((await req(meta.get("stats"))) as ArchiveStats | undefined) ?? { count: 0, bytes: 0 };
    for (const m of put) {
      const old = (await req(msgs.get(m.id))) as Stored | undefined;
      const size = itemBytes(m);
      msgs.put({ ...m, size });
      stats.bytes += size - (old?.size ?? 0);
      if (!old) stats.count++;
    }
    for (const id of del) {
      const old = (await req(msgs.get(id))) as Stored | undefined;
      if (!old) continue;
      msgs.delete(id);
      stats.bytes -= old.size;
      stats.count--;
    }
    meta.put(stats, "stats");
    await done(tx);
  }

  /** The breakpoint: over 100 MB (or 1,000,000 messages), remove the oldest until back to 70 MB. */
  async trim(limits: { maxMessages: number; maxBytes: number; targetBytes: number } = CHAT_LIMITS): Promise<number> {
    const before = await this.stats();
    if (before.count <= limits.maxMessages && before.bytes <= limits.maxBytes) return 0;
    const db = await this.db;
    const tx = db.transaction(["msgs", "meta"], "readwrite");
    const stats = { ...before };
    let removed = 0;
    const cursorReq = tx.objectStore("msgs").index("at").openCursor();
    await new Promise<void>((res, rej) => {
      cursorReq.onerror = () => rej(cursorReq.error);
      cursorReq.onsuccess = () => {
        const c = cursorReq.result;
        const enough = stats.count <= limits.maxMessages && stats.bytes <= limits.targetBytes;
        if (!c || enough) return res();
        stats.bytes -= (c.value as Stored).size;
        stats.count--;
        removed++;
        c.delete();
        c.continue();
      };
    });
    tx.objectStore("meta").put(stats, "stats");
    await done(tx);
    return removed;
  }

  /** Disappearing messages whose time is up are deleted here too (and "after seen" ones I've read). */
  async purgeExpired(now: number): Promise<number> {
    const db = await this.db;
    const all = (await req(db.transaction("msgs").objectStore("msgs").index("vanish").getAll())) as Stored[];
    const gone = all.filter((m) => isExpired(m, now) || (m.from === 1 && m.vanish === "seen" && m.viewedAt !== undefined)).map((m) => m.id);
    await this.apply([], gone);
    return gone.length;
  }

  /** Up to `limit` messages older than `beforeAt`, oldest first (for "Show earlier messages"). */
  async before(beforeAt: number, limit: number): Promise<ChatItem[]> {
    const db = await this.db;
    const out: ChatItem[] = [];
    const cursorReq = db.transaction("msgs").objectStore("msgs").index("at").openCursor(IDBKeyRange.upperBound(beforeAt, true), "prev");
    await new Promise<void>((res, rej) => {
      cursorReq.onerror = () => rej(cursorReq.error);
      cursorReq.onsuccess = () => {
        const c = cursorReq.result;
        if (!c || out.length >= limit) return res();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the size field
        const { size, ...m } = c.value as Stored;
        out.push(m);
        c.continue();
      };
    });
    return out.reverse();
  }

  /** Newest-first messages whose text contains `term` (case-insensitive). */
  async search(term: string, limit = 50): Promise<ChatItem[]> {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    const db = await this.db;
    const out: ChatItem[] = [];
    const cursorReq = db.transaction("msgs").objectStore("msgs").index("at").openCursor(null, "prev");
    await new Promise<void>((res, rej) => {
      cursorReq.onerror = () => rej(cursorReq.error);
      cursorReq.onsuccess = () => {
        const c = cursorReq.result;
        if (!c || out.length >= limit) return res();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the size field
        const { size, ...m } = c.value as Stored;
        if (m.kind !== "system" && m.text.toLowerCase().includes(t)) out.push(m);
        c.continue();
      };
    });
    return out;
  }

  /** Delete every message sent at or before `at` (after "clear chat"). */
  async deleteUpTo(at: number): Promise<number> {
    const db = await this.db;
    const tx = db.transaction(["msgs", "meta"], "readwrite");
    const meta = tx.objectStore("meta");
    const stats = ((await req(meta.get("stats"))) as ArchiveStats | undefined) ?? { count: 0, bytes: 0 };
    let removed = 0;
    const cursorReq = tx.objectStore("msgs").index("at").openCursor(IDBKeyRange.upperBound(at));
    await new Promise<void>((res, rej) => {
      cursorReq.onerror = () => rej(cursorReq.error);
      cursorReq.onsuccess = () => {
        const c = cursorReq.result;
        if (!c) return res();
        stats.bytes -= (c.value as Stored).size;
        stats.count--;
        removed++;
        c.delete();
        c.continue();
      };
    });
    meta.put({ count: Math.max(0, stats.count), bytes: Math.max(0, stats.bytes) }, "stats");
    await done(tx);
    return removed;
  }

  async clear(): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(["msgs", "meta"], "readwrite");
    tx.objectStore("msgs").clear();
    tx.objectStore("meta").clear();
    await done(tx);
  }

  async close() {
    (await this.db).close();
  }
}

/** Remove a whole archive (e.g. when someone signs out of this phone). */
export function deleteArchive(name: string, factory: IDBFactory | undefined = typeof indexedDB === "undefined" ? undefined : indexedDB): Promise<void> {
  return new Promise((res) => {
    if (!factory) return res();
    const r = factory.deleteDatabase(name);
    r.onsuccess = r.onerror = r.onblocked = () => res();
  });
}

/** Ask the browser not to clear our data when the phone runs low on space. */
export async function askToKeepData(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
