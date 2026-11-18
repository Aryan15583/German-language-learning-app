// Safe pairing v2: X25519 key exchange, authenticated by the 6-letter code.
import { coupleFromCode, makeEnvelope, openEnvelope, sealEnvelope, type Stats } from "../lib/link";
import { coupleKeyFromDh, newDhPair, safetyCode } from "../lib/pair";
import { joinSafely, receive, startPairing } from "../state/couple";
import { freshState } from "../state/logic";

const now = Date.UTC(2026, 10, 19, 12);
const stats: Stats = { xp: 0, streak: 0, streakDay: null, unlocked: 0, examsPassed: [], week: { id: "2026-W47", xp: 0 }, wordsKnown: 0, unitsPassed: 0 };
const who = (name: string) => ({ id: `${name}-id`, name, lang: "en" as const });

describe("safe pairing", () => {
  const code = "K7M2QX";
  const pairing = coupleFromCode(code, 1000);

  it("both phones end up with the same new key, never the code key", () => {
    const dh = newDhPair();
    const creator = startPairing(freshState(), code, pairing, now, dh);
    expect(creator.couple).toMatchObject({ status: "invited", proto: 2, dh });

    const joined = joinSafely(freshState(), pairing, dh.pub, now);
    const key = joined.state.couple!.key;
    expect(joined.state.couple).toMatchObject({ status: "linked", proto: 2, role: "joiner", myPub: joined.pub });
    expect(key).not.toBe(pairing.key);

    // The join travels encrypted with the code key, like before.
    const env = openEnvelope(pairing.key, pairing.id, sealEnvelope(pairing.key, makeEnvelope(pairing.id, who("Shreya"), stats, { kind: "join", pub: joined.pub }, now)), now);
    const linked = receive(creator, env, now).state;
    expect(linked.couple).toMatchObject({ status: "linked", proto: 2, role: "creator", key });
    // The one-time secret and the code key are forgotten.
    expect(linked.couple!.dh).toBeUndefined();
    expect(linked.couple!.previousKey).toBeUndefined();
    expect(safetyCode(linked.couple!.key)).toBe(safetyCode(key));
  });

  it("someone with the code and both public keys can't work out the key", () => {
    const creator = newDhPair();
    const joiner = newDhPair();
    const real = coupleKeyFromDh(joiner.secret, creator.pub, pairing.key, creator.pub, joiner.pub);
    const attacker = newDhPair();
    expect(coupleKeyFromDh(attacker.secret, creator.pub, pairing.key, creator.pub, joiner.pub)).not.toBe(real);
    expect(coupleKeyFromDh(attacker.secret, joiner.pub, pairing.key, creator.pub, joiner.pub)).not.toBe(real);
  });

  it("a man in the middle shows up as different safety codes", () => {
    const creator = newDhPair();
    const joiner = newDhPair();
    const mitm = newDhPair();
    const creatorSide = coupleKeyFromDh(creator.secret, mitm.pub, pairing.key, creator.pub, mitm.pub);
    const joinerSide = coupleKeyFromDh(joiner.secret, mitm.pub, pairing.key, mitm.pub, joiner.pub);
    expect(safetyCode(creatorSide)).not.toBe(safetyCode(joinerSide));
    expect(safetyCode(creatorSide)).toMatch(/^\d{4} \d{4} \d{4}$/);
  });

  it("rejects broken public keys", () => {
    const bad = { kind: "join", pub: "not-a-key" } as const;
    expect(() => openEnvelope(pairing.key, pairing.id, sealEnvelope(pairing.key, makeEnvelope(pairing.id, who("X"), stats, bad, now)), now)).toThrow();
    const dh = newDhPair();
    expect(() => coupleKeyFromDh(dh.secret, "A".repeat(43), pairing.key, dh.pub, "A".repeat(43))).toThrow();
  });

  it("a join for a phone that isn't waiting does nothing", () => {
    const s = freshState();
    const env = openEnvelope(pairing.key, pairing.id, sealEnvelope(pairing.key, makeEnvelope(pairing.id, who("X"), stats, { kind: "join", pub: newDhPair().pub }, now)), now);
    expect(receive(s, env, now).state.couple).toBeNull();
  });
});
