import { newKey } from "../lib/crypto";
import { ACHIEVEMENTS, DAILY_GOAL, earnedAchievements, heartLevel, isoWeek, weeklyLeader } from "../lib/game";
import { makeEnvelope, type Payload, type Stats } from "../lib/link";
import {
  applyDuelMove,
  codeExpired,
  duelStatus,
  isLinked,
  joinWithCode,
  receive,
  recordOutgoing,
  secretOpen,
  startPairing,
  statsFor,
  unlinkCouple,
} from "../state/couple";
import { addXp, applyPractice, freshState, migrate, type AppState } from "../state/logic";

const now = Date.UTC(2026, 10, 14, 10);
const couple = { id: "couple1", key: newKey() };
const mia = { id: "mia-id", name: "Mia", lang: "mr-Latn" as const };
const miaStats: Stats = {
  xp: 200,
  streak: 4,
  streakDay: "2026-11-14",
  unlocked: 2,
  examsPassed: ["A1", "A2"],
  week: { id: "2026-W46", xp: 90 },
  wordsKnown: 40,
  unitsPassed: 6,
};
const fromMia = (p: Payload, at = now) => makeEnvelope(couple.id, mia, miaStats, p, at);
const named = (): AppState => {
  const s = freshState();
  return { ...s, partners: [{ ...s.partners[0], name: "Aryan" }, s.partners[1]] };
};

describe("game", () => {
  it.each([
    ["2026-11-13", "2026-W46"],
    ["2026-01-01", "2026-W01"],
    ["2027-01-01", "2026-W53"],
    ["2024-12-30", "2025-W01"],
  ])("isoWeek(%s) = %s", (d, w) => expect(isoWeek(d)).toBe(w));

  it("levels up hearts with growing steps", () => {
    expect(heartLevel(0)).toMatchObject({ level: 1, title: "Neuling", into: 0, span: 100 });
    expect(heartLevel(100)).toMatchObject({ level: 2, title: "Anfänger", into: 0, span: 150 });
    expect(heartLevel(260)).toMatchObject({ level: 3, into: 10 });
    expect(heartLevel(1e7).title).toBe("Berlin-bereit");
  });

  it("earns achievements from progress", () => {
    const none = { streak: 0, wordsKnown: 0, unitsPassed: 0, examsPassed: 0, chatStars: 0, messages: 0, duelsWon: 0, linked: false };
    expect(earnedAchievements(none)).toEqual([]);
    const all = { streak: 30, wordsKnown: 150, unitsPassed: 1, examsPassed: 1, chatStars: 6, messages: 10, duelsWon: 3, linked: true };
    expect(earnedAchievements(all)).toHaveLength(ACHIEVEMENTS.length);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("names the weekly leader", () => {
    expect([weeklyLeader(5, 3), weeklyLeader(3, 5), weeklyLeader(4, 4)]).toEqual(["me", "them", "tie"]);
  });

  it("tracks weekly and daily XP, resetting each week and day", () => {
    let s = addXp(freshState(), 0, 30, "2026-11-13");
    s = addXp(s, 0, 25, "2026-11-13");
    expect(s.partners[0].today).toEqual({ date: "2026-11-13", xp: 55 });
    expect(s.partners[0].today.xp).toBeGreaterThan(DAILY_GOAL);
    s = addXp(s, 0, 10, "2026-11-16"); // Monday: new week
    expect(s.partners[0].week).toEqual({ id: "2026-W47", xp: 10 });
    expect(s.partners[0].xp).toBe(65);
    expect(applyPractice(freshState(), 1, 5, "2026-11-13", "2026-11-12").partners[1].week.xp).toBe(5);
  });
});

describe("pairing by code", () => {
  it("creator waits; joiner is linked at once with a fresh key", () => {
    const creator = startPairing(named(), "K7M2QX", couple, now);
    expect(creator.couple).toMatchObject({ status: "invited", code: "K7M2QX", key: couple.key });
    expect(isLinked(creator)).toBe(false);

    const { state: joiner, codeKey, freshKey } = joinWithCode(named(), couple, now);
    expect(codeKey).toBe(couple.key);
    expect(freshKey).not.toBe(couple.key);
    expect(joiner.couple).toMatchObject({ status: "linked", key: freshKey, previousKey: couple.key });
  });

  it("the joiner's hello links the creator and switches to the fresh key", () => {
    const creator = startPairing(named(), "K7M2QX", couple, now);
    const fresh = newKey();
    const { state, isNew } = receive(creator, fromMia({ kind: "hello", key: fresh }), now);
    expect(isNew).toBe(true);
    expect(state.couple).toMatchObject({ status: "linked", key: fresh, previousKey: couple.key });
    expect(state.partners[1]).toMatchObject({ name: "Mia", lang: "mr-Latn", unlocked: 2 });
    expect(state.chat.at(-1)?.text).toContain("Mia joined");
  });

  it("a second hello after linking doesn't swap keys again", () => {
    const linked = receive(startPairing(named(), "K7M2QX", couple, now), fromMia({ kind: "hello", key: newKey() }), now).state;
    const again = receive(linked, fromMia({ kind: "hello", key: newKey() }), now).state;
    expect(again.couple!.key).toBe(linked.couple!.key);
  });

  it("codes expire after a day", () => {
    expect(codeExpired(now, now + 23 * 3600e3)).toBe(false);
    expect(codeExpired(now, now + 25 * 3600e3)).toBe(true);
  });

  it("unlinking forgets the couple", () => {
    expect(unlinkCouple(startPairing(named(), "K7M2QX", couple, now)).couple).toBeNull();
  });
});

describe("receiving", () => {
  const linked = () => joinWithCode(named(), couple, now).state;

  it("adds messages once, even if the link is opened twice", () => {
    const env = fromMia({ kind: "msg", text: "Hallo Schatz!" });
    const first = receive(linked(), env, now);
    const second = receive(first.state, env, now);
    expect(second.isNew).toBe(false);
    expect(second.state).toBe(first.state);
    expect(first.state.chat.filter((c) => c.text === "Hallo Schatz!")).toHaveLength(1);
  });

  it("updates the partner's scores and keeps the newest streak", () => {
    const s = receive(linked(), fromMia({ kind: "stats" }, now), now).state;
    expect(s.partners[1]).toMatchObject({ xp: 200, week: { id: "2026-W46", xp: 90 }, remote: { streak: 4, wordsKnown: 40 } });
    const older = makeEnvelope(couple.id, mia, { ...miaStats, streak: 1 }, { kind: "stats" }, now - 1000);
    expect(receive(s, older, now).state.partners[1].remote!.streak).toBe(4);
  });

  it("adds shared words without duplicates", () => {
    let s = receive(linked(), fromMia({ kind: "word", word: { de: "Kuscheln", en: "to cuddle", mr: "" } }), now).state;
    s = receive(s, fromMia({ kind: "word", word: { de: "kuscheln", en: "cuddle", mr: "" } }), now).state;
    expect(s.customWords).toHaveLength(1);
  });

  it("keeps secrets closed until my streak is long enough", () => {
    const s = receive(linked(), fromMia({ kind: "secret", text: "Für meine Baiko", unlockAt: 7 }), now).state;
    const secret = s.chat.find((c) => c.kind === "secret")!;
    expect(secretOpen(secret, 6)).toBe(false);
    expect(secretOpen(secret, 7)).toBe(true);
    expect(secretOpen({ ...secret, from: 0 }, 0)).toBe(true);
  });

  it("caps stored history", () => {
    let s = linked();
    for (let i = 0; i < 520; i++) s = receive(s, fromMia({ kind: "msg", text: `m${i}` }, now + i), now).state;
    expect(s.chat.length).toBe(500);
    expect(s.chat.at(-1)?.text).toBe("m519");
  });
});

describe("sending", () => {
  it("records my messages and counts them", () => {
    let s = joinWithCode(named(), couple, now).state;
    s = recordOutgoing(s, "e1", { kind: "msg", text: "Guten Morgen!" }, now);
    s = recordOutgoing(s, "e1", { kind: "msg", text: "Guten Morgen!" }, now);
    expect(s.chat.filter((c) => c.id === "e1")).toHaveLength(1);
    expect(s.partners[0].counts.messages).toBe(2);
  });

  it("shares my progress in every message", () => {
    let s = applyPractice(named(), 0, 40, "2026-11-14", "2026-11-13");
    s = { ...s, partners: [{ ...s.partners[0], known: { essen: [1, 2, 3] } }, s.partners[1]] };
    expect(statsFor(s, "2026-11-14", "2026-11-13")).toMatchObject({ xp: 40, streak: 1, wordsKnown: 3, week: { id: "2026-W46", xp: 40 } });
    expect(statsFor(s, "2026-11-20", "2026-11-19").streak).toBe(0);
  });
});

describe("remote duels", () => {
  const move = { id: "d1", topic: "mix-A1", seed: 42, score: 5 };

  it("goes from my turn to their turn to a result", () => {
    let s = joinWithCode(named(), couple, now).state;
    s = applyDuelMove(s, 1, { ...move, score: 4 }, now);
    expect(duelStatus(s.remoteDuels[0])).toBe("your-turn");
    expect(s.remoteDuels[0].startedBy).toBe(1);
    s = applyDuelMove(s, 0, move, now);
    expect(duelStatus(s.remoteDuels[0])).toBe("won");
    expect(s.remoteDuels[0].settled).toBe(true);
    expect(s.partners[0].counts.duelsWon).toBe(1);
  });

  it("waits for my partner after I play first", () => {
    const s = applyDuelMove(freshState(), 0, move, now);
    expect(duelStatus(s.remoteDuels[0])).toBe("their-turn");
  });

  it("can't be replayed to improve a score", () => {
    const s = applyDuelMove(freshState(), 0, move, now);
    expect(applyDuelMove(s, 0, { ...move, score: 6 }, now)).toBe(s);
  });

  it("reports losses and ties without awarding a win", () => {
    let lost = applyDuelMove(freshState(), 0, { ...move, score: 2 }, now);
    lost = applyDuelMove(lost, 1, move, now);
    expect(duelStatus(lost.remoteDuels[0])).toBe("lost");
    expect(lost.partners[0].counts.duelsWon).toBe(0);
    let tie = applyDuelMove(freshState(), 0, move, now);
    tie = applyDuelMove(tie, 1, move, now);
    expect(duelStatus(tie.remoteDuels[0])).toBe("tie");
  });

  it("arrive through messages too", () => {
    const s = receive(joinWithCode(named(), couple, now).state, fromMia({ kind: "duel", duel: move }), now).state;
    expect(duelStatus(s.remoteDuels[0])).toBe("your-turn");
    expect(s.chat.at(-1)).toMatchObject({ kind: "duel", duelId: "d1", from: 1 });
  });
});

describe("migration", () => {
  it("adds the new fields to data saved by older versions", () => {
    const s = migrate({ partners: [{ name: "Aryan", xp: 10 }, { name: "Mia" }] });
    expect(s.partners[0].id).toBeTruthy();
    expect(s.partners[0].id).not.toBe(s.partners[1].id);
    expect(s.partners[0]).toMatchObject({ pin: null, counts: { messages: 0, duelsWon: 0 }, remote: null });
    expect(s).toMatchObject({ couple: null, chat: [], seen: [], customWords: [], remoteDuels: [] });
  });

  it("keeps ids it already has", () => {
    expect(migrate({ partners: [{ id: "keep-me" }, {}] }).partners[0].id).toBe("keep-me");
  });
});

describe("achievement context", () => {
  it("uses local progress on the same phone and my partner's reported numbers when linked", () => {
    const { achievementContext } = jest.requireActual("../state/couple") as typeof import("../state/couple");
    let s = named();
    s = { ...s, partners: [{ ...s.partners[0], known: { essen: [0, 1, 2] }, unitScores: { essen: 1 } }, s.partners[1]] };
    expect(achievementContext(s, 0, 2)).toMatchObject({ wordsKnown: 3, unitsPassed: 1, streak: 2, linked: false });
    const linked = receive(joinWithCode(s, couple, now).state, fromMia({ kind: "stats" }), now).state;
    expect(achievementContext(linked, 1, 0)).toMatchObject({ wordsKnown: 40, unitsPassed: 6, streak: 4, linked: true });
  });
});
