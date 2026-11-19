import { articleRound, cleanMemory, dailyConversation, dailySurprise, isReaction, teamLevel } from "../lib/couplelife";
import { newKey } from "../lib/crypto";
import { makeEnvelope, openEnvelope, sealEnvelope, type Payload, type Stats } from "../lib/link";
import { receive, recordOutgoing } from "../state/couple";
import { addMemory, freshState, migrate, removeMemory, setReaction, type AppState } from "../state/logic";

const now = Date.UTC(2026, 10, 18, 12);
const couple = { id: "couple1", key: newKey() };
const mia = { id: "mia-id", name: "Mia", lang: "en" as const };
const stats: Stats = { xp: 0, streak: 0, streakDay: null, unlocked: 0, examsPassed: [], week: { id: "2026-W47", xp: 0 }, wordsKnown: 0, unitsPassed: 0 };
const roundTrip = (p: unknown) => openEnvelope(couple.key, couple.id, sealEnvelope(couple.key, makeEnvelope(couple.id, mia, stats, p as Payload, now)), now);

describe("Together XP", () => {
  it("adds both partners' XP into one level", () => {
    expect(teamLevel(0, 0)).toMatchObject({ level: 1, xp: 0, title: "Zwei Anfänger" });
    expect(teamLevel(150, 50).level).toBe(2);
    expect(teamLevel(-5, 10).xp).toBe(10);
    const t = teamLevel(100, 0);
    expect(t.progress).toBeCloseTo(0.5);
  });
});

describe("daily picks", () => {
  it("are the same all day and on both phones", () => {
    expect(dailySurprise("2026-11-18")).toBe(dailySurprise("2026-11-18"));
    expect(dailyConversation("A1", "2026-11-18").id).toBe(dailyConversation("A1", "2026-11-18").id);
  });
  it("stay at or below your level", () => {
    for (let d = 1; d <= 28; d++) expect(dailyConversation("A1", `2026-02-${String(d).padStart(2, "0")}`).level).toBe("A1");
  });
});

describe("der / die / das", () => {
  it("builds a repeatable round of real nouns", () => {
    const a = articleRound("x", 10);
    expect(a).toHaveLength(10);
    expect(articleRound("x", 10).map((q) => q.noun.lemma)).toEqual(a.map((q) => q.noun.lemma));
    for (const q of a) expect(["der", "die", "das"]).toContain(q.noun.article);
  });
});

describe("reactions", () => {
  const withMsg = (): AppState => ({ ...freshState(), chat: [{ id: "m1", from: 1, kind: "msg", text: "Hallo", at: 1 }] });
  it("sets, replaces and clears a reaction", () => {
    let s = setReaction(withMsg(), "m1", 0, "❤️");
    expect(s.chat[0].reacts).toEqual({ 0: "❤️" });
    s = setReaction(s, "m1", 1, "😂");
    expect(s.chat[0].reacts).toEqual({ 0: "❤️", 1: "😂" });
    s = setReaction(s, "m1", 0, "");
    expect(s.chat[0].reacts).toEqual({ 1: "😂" });
  });
  it("ignores unknown emoji and unknown messages", () => {
    const s = withMsg();
    expect(setReaction(s, "m1", 0, "💩")).toBe(s);
    expect(setReaction(s, "nope", 0, "❤️")).toBe(s);
    expect(isReaction("")).toBe(true);
  });
  it("travels as a validated message", () => {
    const env = roundTrip({ kind: "react", to: "m1", emoji: "🔥" });
    expect(env).toMatchObject({ kind: "react", to: "m1", emoji: "🔥" });
    expect(() => roundTrip({ kind: "react", to: "m1", emoji: "<script>" })).toThrow();
    // My partner's reaction lands on my message; mine is recorded without a new chat bubble.
    const linked: AppState = { ...withMsg(), couple: { id: couple.id, key: couple.key, status: "linked", since: now, role: "creator" } };
    const got = receive(linked, env, now).state;
    expect(got.chat).toHaveLength(1);
    expect(got.chat[0].reacts).toEqual({ 1: "🔥" });
    expect(recordOutgoing(got, "e2", { kind: "react", to: "m1", emoji: "❤️" }, now).chat[0].reacts).toEqual({ 0: "❤️", 1: "🔥" });
  });
});

describe("memory book", () => {
  it("adds in date order, removes, and survives a reload", () => {
    let s = addMemory(freshState(), { id: "b", at: 20, emoji: "🎉", title: "Second", text: "" });
    s = addMemory(s, { id: "a", at: 10, emoji: "💞", title: "First", text: "We started" });
    expect(s.memories.map((m) => m.id)).toEqual(["a", "b"]);
    expect(migrate(JSON.parse(JSON.stringify(s))).memories).toHaveLength(2);
    expect(removeMemory(s, "a").memories.map((m) => m.id)).toEqual(["b"]);
  });
  it("drops broken entries", () => {
    expect(cleanMemory({ id: "x", at: 1, emoji: "💞", title: "", text: "" })).toBeNull();
    expect(cleanMemory({ at: 1, title: "t" })).toBeNull();
    expect(migrate({ memories: [null, { id: "y", at: 2, title: "ok" }] }).memories).toHaveLength(1);
  });
});

describe("edit and delete messages", () => {
  const linked = (): AppState => ({
    ...freshState(),
    couple: { id: couple.id, key: couple.key, status: "linked", since: now, role: "creator" },
    chat: [
      { id: "mine", from: 0, kind: "msg", text: "Halo", at: 1 },
      { id: "theirs", from: 1, kind: "msg", text: "Hallo!", at: 2 },
      { id: "sys", from: 0, kind: "system", text: "linked", at: 0 },
    ],
  });
  it("I can edit and delete only my own messages", () => {
    let s = recordOutgoing(linked(), "e1", { kind: "edit", to: "mine", text: "Hallo ❤️" }, now);
    expect(s.chat[0]).toMatchObject({ text: "Hallo ❤️", edited: now });
    expect(recordOutgoing(s, "e2", { kind: "edit", to: "theirs", text: "hacked" }, now).chat[1].text).toBe("Hallo!");
    expect(recordOutgoing(s, "e3", { kind: "edit", to: "sys", text: "x" }, now)).toBe(s);
    s = recordOutgoing(s, "e4", { kind: "unsend", to: "mine" }, now);
    expect(s.chat.map((m) => m.id)).toEqual(["theirs", "sys"]);
    expect(recordOutgoing(s, "e5", { kind: "unsend", to: "theirs" }, now).chat).toHaveLength(2);
  });
  it("my partner's edit and delete arrive encrypted and only touch their messages", () => {
    const edit = roundTrip({ kind: "edit", to: "theirs", text: "Hallo, Schatz!" });
    let s = receive(linked(), edit, now).state;
    expect(s.chat[1]).toMatchObject({ text: "Hallo, Schatz!" });
    expect(s.chat[1].edited).toBeGreaterThan(0);
    // They can't change what I wrote.
    s = receive(s, roundTrip({ kind: "edit", to: "mine", text: "nope" }), now).state;
    expect(s.chat[0].text).toBe("Halo");
    s = receive(s, roundTrip({ kind: "unsend", to: "mine" }), now).state;
    expect(s.chat.some((m) => m.id === "mine")).toBe(true);
    s = receive(s, roundTrip({ kind: "unsend", to: "theirs" }), now).state;
    expect(s.chat.some((m) => m.id === "theirs")).toBe(false);
    expect(() => roundTrip({ kind: "edit", to: "theirs", text: "" })).toThrow();
  });
});

describe("clear chat", () => {
  const withChat = (): AppState => ({
    ...freshState(),
    couple: { id: couple.id, key: couple.key, status: "linked", since: now, role: "creator" },
    memories: [{ id: "m", at: 1, emoji: "💞", title: "kept", text: "" }],
    chat: [
      { id: "a", from: 0, kind: "msg", text: "eins", at: now - 2000 },
      { id: "b", from: 1, kind: "msg", text: "zwei", at: now - 1000 },
    ],
  });
  it("clears everything up to the time, keeps memories, leaves a note", () => {
    const s = recordOutgoing(withChat(), "c1", { kind: "clear", before: now }, now);
    expect(s.chat.map((m) => m.kind)).toEqual(["system"]);
    expect(s.chatClearedAt).toBe(now);
    expect(s.memories).toHaveLength(1);
  });
  it("my partner's clear empties my copy too, but never messages from after they pressed it", () => {
    const later: AppState = { ...withChat(), chat: [...withChat().chat, { id: "c", from: 0, kind: "msg", text: "später", at: now + 5000 }] };
    // A clear claiming a future time only counts up to when it was sent.
    const s = receive(later, roundTrip({ kind: "clear", before: now + 999_999 }), now).state;
    expect(s.chat.filter((m) => m.kind !== "system").map((m) => m.id)).toEqual(["c"]);
    expect(s.chatClearedAt).toBe(now);
    expect(() => roundTrip({ kind: "clear", before: -5 })).toThrow();
  });
  it("survives a reload", () => {
    const s = recordOutgoing(withChat(), "c1", { kind: "clear", before: now }, now);
    expect(migrate(JSON.parse(JSON.stringify(s))).chatClearedAt).toBe(now);
  });
});

describe("replies and read receipts", () => {
  const linkedChat = (): AppState => ({
    ...freshState(),
    couple: { id: couple.id, key: couple.key, status: "linked", since: now, role: "creator" },
    chat: [{ id: "q", from: 1, kind: "msg", text: "Wie geht's?", at: now - 1000 }],
  });
  it("a reply keeps its quote, seen from each phone", () => {
    const mine = recordOutgoing(linkedChat(), "r1", { kind: "msg", text: "Gut!", reply: { id: "q", text: "Wie geht's?", mine: false } }, now);
    expect(mine.chat[1].reply).toEqual({ id: "q", text: "Wie geht's?", from: 1 });
    // On my partner's phone, the quoted message is their own.
    const env = roundTrip({ kind: "msg", text: "Gut!", reply: { id: "q", text: "Wie geht's?", mine: false } });
    const theirs = receive({ ...freshState(), couple: linkedChat().couple }, env, now).state;
    expect(theirs.chat[0].reply).toEqual({ id: "q", text: "Wie geht's?", from: 0 });
    expect(() => roundTrip({ kind: "msg", text: "x", reply: { id: "<bad>", text: "", mine: true } })).toThrow();
  });
  it("read receipts move forward only, and never past when they were sent", () => {
    let s = receive(linkedChat(), roundTrip({ kind: "read", upTo: now - 500 }), now).state;
    expect(s.partnerReadAt).toBe(now - 500);
    s = receive(s, roundTrip({ kind: "read", upTo: now - 900 }), now).state;
    expect(s.partnerReadAt).toBe(now - 500);
    s = receive(s, roundTrip({ kind: "read", upTo: now + 99_999 }), now).state;
    expect(s.partnerReadAt).toBe(now);
    const sent = recordOutgoing(linkedChat(), "x", { kind: "read", upTo: now - 1000 }, now);
    expect(sent.myReadSent).toBe(now - 1000);
    expect(sent.chat).toHaveLength(1);
  });
});
