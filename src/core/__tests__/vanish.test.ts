// Disappearing messages in the couple chat.
import { newKey } from "../lib/crypto";
import { makeEnvelope, openEnvelope, sealEnvelope, LinkError, type Stats } from "../lib/link";
import { isExpired, leaveChat, markViewed, purgeExpired, receive, recordOutgoing, SEEN_GRACE_MS, vanishLabel, VANISH_MS } from "../state/couple";
import { freshState, migrate, type AppState } from "../state/logic";

const now = Date.UTC(2026, 10, 17, 12);
const couple = { id: "couple1", key: newKey() };
const mia = { id: "mia-id", name: "Mia", lang: "en" as const };
const stats: Stats = { xp: 0, streak: 0, streakDay: null, unlocked: 0, examsPassed: [], week: { id: "2026-W47", xp: 0 }, wordsKnown: 0, unitsPassed: 0 };
const linked = (): AppState => ({ ...freshState(), couple: { id: couple.id, key: couple.key, status: "linked", since: now, role: "creator" } });

describe("disappearing messages", () => {
  it("travel with their timer, encrypted, and reject made-up timers", () => {
    const env = makeEnvelope(couple.id, mia, stats, { kind: "msg", text: "Geheim 🤫", vanish: "1d" }, now);
    const opened = openEnvelope(couple.key, couple.id, sealEnvelope(couple.key, env), now);
    expect(opened).toMatchObject({ kind: "msg", text: "Geheim 🤫", vanish: "1d" });
    const plain = openEnvelope(couple.key, couple.id, sealEnvelope(couple.key, makeEnvelope(couple.id, mia, stats, { kind: "msg", text: "hi" }, now)), now);
    expect("vanish" in plain).toBe(false);
    const bad = sealEnvelope(couple.key, { ...env, vanish: "forever" } as never);
    expect(() => openEnvelope(couple.key, couple.id, bad, now)).toThrow(LinkError);
  });

  it("disappear after 1 day or 30 days, on both phones", () => {
    let s = recordOutgoing(linked(), "m1", { kind: "msg", text: "Bis morgen", vanish: "1d" }, now);
    s = receive(s, makeEnvelope(couple.id, mia, stats, { kind: "msg", text: "Für einen Monat", vanish: "30d" }, now), now).state;
    s = recordOutgoing(s, "keep", { kind: "msg", text: "Für immer" }, now);
    expect(purgeExpired(s, now + VANISH_MS["1d"] - 1)).toBe(s);
    const dayLater = purgeExpired(s, now + VANISH_MS["1d"]);
    expect(dayLater.chat.map((m) => m.text)).toEqual(["Für einen Monat", "Für immer"]);
    expect(purgeExpired(dayLater, now + VANISH_MS["30d"]).chat.map((m) => m.text)).toEqual(["Für immer"]);
  });

  it("'after seen': disappears when I leave the chat (or soon after reading), and the sender's copy goes too", () => {
    const env = makeEnvelope(couple.id, mia, stats, { kind: "msg", text: "Nur einmal lesen", vanish: "seen" }, now);
    let me = receive(linked(), env, now).state;
    expect(isExpired(me.chat[0], now + 10 * VANISH_MS["30d"])).toBe(false); // unseen messages wait for me
    const viewed = markViewed(me, now + 1000);
    expect(viewed.ids).toEqual([env.id]);
    expect(markViewed(viewed.state, now + 2000).ids).toEqual([]); // only once
    me = viewed.state;
    expect(purgeExpired(me, now + 1000 + SEEN_GRACE_MS).chat).toHaveLength(0);
    expect(leaveChat(me).chat).toHaveLength(0);

    // Mia's phone: her own copy disappears when my "viewed" receipt arrives.
    let hers = recordOutgoing(linked(), env.id, { kind: "msg", text: "Nur einmal lesen", vanish: "seen" }, now);
    expect(vanishLabel(hers.chat[0], now)).toBe("👁 Disappears once seen");
    hers = receive(hers, makeEnvelope(couple.id, { ...mia, id: "me", name: "Aryan" }, stats, { kind: "viewed", ids: [env.id] }, now), now).state;
    expect(hers.chat).toHaveLength(0);
  });

  it("labels the time left and remembers my timer choice", () => {
    expect(vanishLabel({ id: "x", from: 0, kind: "msg", text: "", at: now, vanish: "1d" }, now + 3600e3)).toBe("⏱ 23 h left");
    expect(vanishLabel({ id: "x", from: 0, kind: "msg", text: "", at: now, vanish: "30d" }, now)).toBe("⏱ 30 days left");
    expect(migrate({ vanish: "seen" }).vanish).toBe("seen");
    expect(migrate({ vanish: "nonsense" }).vanish).toBe("off");
  });
});

describe("timer labels right after sending", () => {
  it("never shows more time than the timer has, even if the clock is a moment behind", () => {
    expect(vanishLabel({ id: "x", from: 0, kind: "msg", text: "", at: now, vanish: "1d" }, now - 5000)).toBe("⏱ 24 h left");
  });
});
