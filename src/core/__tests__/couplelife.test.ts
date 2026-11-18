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
