// Photos, videos and voice messages kept on this phone, decrypted, like Signal does.
// IndexedDB stores the files as Blobs; the server copy is deleted once the file is safe here.
type Saved = { path: string; blob: Blob; mime: string; at: number; from: 0 | 1; inGallery: boolean };

const DB = "zh-media";
const STORE = "files";

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    if (typeof indexedDB === "undefined") return rej(new Error("no IndexedDB"));
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => {
      const s = open.result.createObjectStore(STORE, { keyPath: "path" });
      s.createIndex("at", "at");
    };
    open.onsuccess = () => res(open.result);
    open.onerror = () => rej(open.error);
  });
  return dbp;
}
const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

export async function getLocal(path: string): Promise<Saved | null> {
  const d = await db();
  return ((await req(d.transaction(STORE).objectStore(STORE).get(path))) as Saved | undefined) ?? null;
}

export async function putLocal(item: Saved): Promise<void> {
  const d = await db();
  await req(d.transaction(STORE, "readwrite").objectStore(STORE).put(item));
}

export async function deleteLocal(path: string): Promise<void> {
  const d = await db();
  await req(d.transaction(STORE, "readwrite").objectStore(STORE).delete(path));
}

/** After "clear chat": remove files from messages sent at or before `at`. */
export async function deleteLocalUpTo(at: number): Promise<void> {
  const d = await db();
  const tx = d.transaction(STORE, "readwrite");
  const cur = tx.objectStore(STORE).index("at").openCursor(IDBKeyRange.upperBound(at));
  await new Promise<void>((res, rej) => {
    cur.onerror = () => rej(cur.error);
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c) return res();
      c.delete();
      c.continue();
    };
  });
}

/** How many files and bytes are kept on this phone. */
export async function localStats(): Promise<{ count: number; bytes: number }> {
  const d = await db();
  const all = (await req(d.transaction(STORE).objectStore(STORE).getAll())) as Saved[];
  return { count: all.length, bytes: all.reduce((n, f) => n + f.blob.size, 0) };
}

/** Received photos and videos that aren't in the phone's gallery yet. */
export async function notInGallery(): Promise<Saved[]> {
  const d = await db();
  const all = (await req(d.transaction(STORE).objectStore(STORE).getAll())) as Saved[];
  return all.filter((f) => f.from === 1 && !f.inGallery && (f.mime.startsWith("image/") || f.mime.startsWith("video/"))).sort((a, b) => a.at - b.at);
}

export async function markInGallery(paths: string[]): Promise<void> {
  const d = await db();
  const tx = d.transaction(STORE, "readwrite");
  const s = tx.objectStore(STORE);
  for (const p of paths) {
    const f = (await req(s.get(p))) as Saved | undefined;
    if (f) s.put({ ...f, inGallery: true });
  }
}

export async function clearLocal(): Promise<void> {
  const d = await db();
  await req(d.transaction(STORE, "readwrite").objectStore(STORE).clear());
}

export function deleteLocalDatabase(): Promise<void> {
  dbp = null;
  return new Promise((res) => {
    if (typeof indexedDB === "undefined") return res();
    const r = indexedDB.deleteDatabase(DB);
    r.onsuccess = r.onerror = r.onblocked = () => res();
  });
}
