import { archiveDiff, CHAT_LIMITS, itemBytes, overLimit, trimmedEnough } from "../lib/archive";
import type { ChatItem } from "../state/logic";

const msg = (id: string, at: number, extra: Partial<ChatItem> = {}): ChatItem => ({ id, from: 0, kind: "msg", text: `m${id}`, at, ...extra });

describe("chat archive", () => {
  it("archives new and changed messages", () => {
    const a = msg("a", 1);
    const b = msg("b", 2);
    const prev = [a, b];
    const seen = { ...b, viewedAt: 9 };
    const next = [a, seen, msg("c", 3)];
    const d = archiveDiff(prev, next);
    expect(d.put.map((m) => m.id)).toEqual(["b", "c"]);
    expect(d.del).toEqual([]);
  });

  it("keeps messages that only scrolled out of the recent window", () => {
    const prev = [msg("a", 1), msg("b", 2), msg("c", 3)];
    const next = [msg("b", 2), msg("c", 3), msg("d", 4)].map((m, i) => (i < 2 ? prev[i + 1] : m));
    expect(archiveDiff(prev, next).del).toEqual([]);
  });

  it("deletes messages removed on purpose (disappearing messages)", () => {
    const prev = [msg("a", 1), msg("b", 2, { vanish: "1d" }), msg("c", 3)];
    const next = [prev[0], prev[2]];
    expect(archiveDiff(prev, next).del).toEqual(["b"]);
    expect(archiveDiff(prev, []).del).toEqual(["a", "b", "c"]);
  });

  it("knows the 1,000,000-message limit, the 100 MB breakpoint and the 70 MB target", () => {
    expect(CHAT_LIMITS.maxBytes).toBe(100 * 1024 * 1024);
    expect(CHAT_LIMITS.targetBytes).toBe(70 * 1024 * 1024);
    expect(overLimit({ count: 10, bytes: CHAT_LIMITS.maxBytes + 1 })).toBe(true);
    expect(overLimit({ count: CHAT_LIMITS.maxMessages + 1, bytes: 1 })).toBe(true);
    expect(overLimit({ count: 10, bytes: 100 })).toBe(false);
    expect(trimmedEnough({ count: 10, bytes: CHAT_LIMITS.targetBytes })).toBe(true);
    expect(trimmedEnough({ count: 10, bytes: CHAT_LIMITS.targetBytes + 1 })).toBe(false);
    expect(itemBytes(msg("a", 1))).toBeGreaterThan(40);
  });
});
