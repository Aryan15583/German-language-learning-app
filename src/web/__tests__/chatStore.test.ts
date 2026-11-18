import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { ChatArchive, deleteArchive } from "../chatStore";
import type { ChatItem } from "../../core/state/logic";

const msg = (n: number, extra: Partial<ChatItem> = {}): ChatItem => ({ id: `m${n}`, from: n % 2 ? 1 : 0, kind: "msg", text: `Nachricht ${n}`, at: 1_000 + n, ...extra });

describe("chat archive on the phone", () => {
  let a: ChatArchive;
  beforeEach(() => {
    a = new ChatArchive("test", new IDBFactory());
  });

  it("saves messages and keeps an exact count and size", async () => {
    await a.apply([msg(1), msg(2), msg(3)], []);
    let s = await a.stats();
    expect(s.count).toBe(3);
    expect(s.bytes).toBeGreaterThan(0);
    await a.apply([{ ...msg(2), viewedAt: 5 }], ["m3"]); // update one, delete one
    s = await a.stats();
    expect(s.count).toBe(2);
    await a.apply([], ["nope"]);
    expect((await a.stats()).count).toBe(2);
  });

  it("pages back through history, oldest first", async () => {
    await a.apply(Array.from({ length: 250 }, (_, i) => msg(i)), []);
    const page = await a.before(1_000 + 200, 50);
    expect(page.map((m) => m.id)).toEqual(Array.from({ length: 50 }, (_, i) => `m${150 + i}`));
    expect("size" in page[0]).toBe(false);
    expect(await a.before(1_000, 50)).toEqual([]);
  });

  it("removes the oldest messages at the breakpoint, down to the target", async () => {
    await a.apply(Array.from({ length: 100 }, (_, i) => msg(i)), []);
    const one = (await a.stats()).bytes / 100;
    const removed = await a.trim({ maxMessages: 1_000_000, maxBytes: one * 80, targetBytes: one * 60 });
    expect(removed).toBeGreaterThanOrEqual(40);
    const s = await a.stats();
    expect(s.bytes).toBeLessThanOrEqual(one * 60 + 1);
    expect((await a.before(Infinity, 1000))[0].id).toBe(`m${removed}`); // the newest are kept
    expect(await a.trim({ maxMessages: 1_000_000, maxBytes: one * 80, targetBytes: one * 60 })).toBe(0);
  });

  it("also caps the number of messages", async () => {
    await a.apply(Array.from({ length: 30 }, (_, i) => msg(i)), []);
    await a.trim({ maxMessages: 20, maxBytes: 1e12, targetBytes: 1e12 });
    expect((await a.stats()).count).toBe(20);
  });

  it("deletes disappearing messages whose time is up", async () => {
    const now = 10 * 86_400_000;
    await a.apply([msg(1, { vanish: "1d", at: 0 }), msg(2, { vanish: "30d", at: 0 }), msg(3, { vanish: "seen", from: 1, viewedAt: now - 1 }), msg(4)], []);
    expect(await a.purgeExpired(now)).toBe(2);
    expect((await a.before(Infinity, 10)).map((m) => m.id).sort()).toEqual(["m2", "m4"]);
  });

  it("can be cleared and deleted", async () => {
    await a.apply([msg(1)], []);
    await a.clear();
    expect(await a.stats()).toEqual({ count: 0, bytes: 0 });
    await a.close();
    await deleteArchive("test", new IDBFactory());
  });
});
