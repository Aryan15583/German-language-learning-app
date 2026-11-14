import { fromBase64Url, hashPin, isValidPin, newKey, open, seal, toBase64Url, verifyPin } from "../lib/crypto";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  coupleFromCode,
  formatCode,
  LinkError,
  makeEnvelope,
  newPairCode,
  normalizeCode,
  openEnvelope,
  sealEnvelope,
  type Stats,
} from "../lib/link";

const me = { id: "aryan123", name: "Aryan", lang: "en" as const };
const stats: Stats = {
  xp: 120,
  streak: 3,
  streakDay: "2026-11-13",
  unlocked: 1,
  examsPassed: ["A1"],
  week: { id: "2026-W46", xp: 80 },
  wordsKnown: 20,
  unitsPassed: 2,
};

describe("base64url", () => {
  it("round-trips every length", () => {
    for (let n = 0; n < 40; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
      const text = toBase64Url(bytes);
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/);
      expect(fromBase64Url(text)).toEqual(bytes);
    }
  });

  it("rejects invalid input", () => {
    expect(() => fromBase64Url("abc$")).toThrow();
    expect(() => fromBase64Url("a")).toThrow();
  });
});

describe("encryption", () => {
  it("round-trips JSON with Unicode", () => {
    const key = newKey();
    const value = { text: "Ich liebe dich 💞 माझं तुझ्यावर प्रेम आहे" };
    expect(open(key, seal(key, value))).toEqual(value);
  });

  it("uses a fresh nonce every time", () => {
    const key = newKey();
    expect(seal(key, { a: 1 })).not.toBe(seal(key, { a: 1 }));
  });

  it("refuses the wrong key", () => {
    expect(() => open(newKey(), seal(newKey(), { a: 1 }))).toThrow();
  });

  it("detects tampering", () => {
    const key = newKey();
    const sealed = seal(key, { text: "hallo" });
    const bytes = fromBase64Url(sealed);
    bytes[bytes.length - 5] ^= 1;
    expect(() => open(key, toBase64Url(bytes))).toThrow();
  });
});

describe("PIN", () => {
  it("verifies the right PIN only", () => {
    const stored = hashPin("2468", 1000);
    expect(verifyPin("2468", stored)).toBe(true);
    expect(verifyPin("2469", stored)).toBe(false);
    expect(stored.hash).not.toContain("2468");
  });

  it("salts every hash", () => {
    expect(hashPin("1234", 1000).hash).not.toBe(hashPin("1234", 1000).hash);
  });

  it("accepts 4–8 digits", () => {
    expect(["1234", "12345678"].every(isValidPin)).toBe(true);
    expect(["123", "123456789", "12a4", ""].some(isValidPin)).toBe(false);
  });
});

describe("partner codes", () => {
  it("are 6 characters without look-alikes", () => {
    for (let i = 0; i < 200; i++) {
      const code = newPairCode();
      expect(code).toHaveLength(CODE_LENGTH);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
    }
    expect(CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });

  it("are random", () => {
    expect(new Set(Array.from({ length: 50 }, newPairCode)).size).toBe(50);
  });

  it("accept friendly input", () => {
    expect(normalizeCode("k7m-2qx")).toBe("K7M2QX");
    expect(normalizeCode(" K7M 2QX ")).toBe("K7M2QX");
    expect(formatCode("K7M2QX")).toBe("K7M-2QX");
  });

  it("reject wrong lengths and look-alike characters", () => {
    expect(normalizeCode("K7M2Q")).toBeNull();
    expect(normalizeCode("K7M2QXX")).toBeNull();
    expect(normalizeCode("K0M2QX")).toBeNull();
    expect(normalizeCode("K7M2Q!")).toBeNull();
  });

  it("give both phones the same couple id and key", () => {
    const a = coupleFromCode("K7M2QX", 1000);
    expect(coupleFromCode("K7M2QX", 1000)).toEqual(a);
    expect(a.id).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(fromBase64Url(a.key)).toHaveLength(32);
    expect(coupleFromCode("K7M2QY", 1000).key).not.toBe(a.key);
  });
});

describe("messages", () => {
  const key = newKey();
  const now = Date.UTC(2026, 10, 13, 12);

  it("round-trips a chat message with stats", () => {
    const env = makeEnvelope("couple1", me, stats, { kind: "msg", text: "Guten Morgen, Schatz!" }, now);
    const back = openEnvelope(key, "couple1", "#" + sealEnvelope(key, env), now);
    expect(back).toEqual(env);
  });

  it("carries a fresh key in the hello message", () => {
    const fresh = newKey();
    const hello = makeEnvelope("couple1", me, stats, { kind: "hello", key: fresh }, now);
    expect(openEnvelope(key, "couple1", sealEnvelope(key, hello), now)).toMatchObject({ kind: "hello", key: fresh });
    const bad = { ...hello, key: "short" };
    expect(() => openEnvelope(key, "couple1", sealEnvelope(key, bad), now)).toThrow(LinkError);
  });

  it("carries remote duel moves", () => {
    const duel = makeEnvelope("couple1", me, stats, { kind: "duel", duel: { id: "d1", topic: "mix-A1", seed: 12345, score: 5 } }, now);
    expect(openEnvelope(key, "couple1", sealEnvelope(key, duel), now)).toMatchObject({ kind: "duel", duel: { seed: 12345, score: 5 } });
    const cheat = { ...duel, duel: { id: "d1", topic: "mix-A1", seed: 12345, score: 999 } };
    expect(() => openEnvelope(key, "couple1", sealEnvelope(key, cheat), now)).toThrow(LinkError);
  });

  it("supports secrets and shared words", () => {
    const secret = makeEnvelope("couple1", me, stats, { kind: "secret", text: "Du bist mein Ein und Alles", unlockAt: 7 }, now);
    expect(openEnvelope(key, "couple1", sealEnvelope(key, secret), now)).toMatchObject({ kind: "secret", unlockAt: 7 });
    const word = makeEnvelope("couple1", me, stats, { kind: "word", word: { de: "Kuscheln", en: "to cuddle", mr: "" } }, now);
    expect(openEnvelope(key, "couple1", sealEnvelope(key, word), now)).toMatchObject({ kind: "word", word: { de: "Kuscheln" } });
  });

  it("rejects another couple's message", () => {
    const env = makeEnvelope("couple2", me, stats, { kind: "msg", text: "hi" }, now);
    expect(() => openEnvelope(key, "couple1", sealEnvelope(key, env), now)).toThrow(LinkError);
  });

  it("rejects a message encrypted with another key", () => {
    const env = makeEnvelope("couple1", me, stats, { kind: "msg", text: "hi" }, now);
    expect(() => openEnvelope(key, "couple1", sealEnvelope(newKey(), env), now)).toThrow(/isn't for this couple/);
  });

  it.each([
    ["an overly long message", { kind: "msg", text: "x".repeat(1001) }],
    ["control characters", { kind: "msg", text: "hi\u0000there" }],
    ["an unknown type", { kind: "script", text: "x" }],
    ["a bogus exam", { kind: "stats", statsOverride: { examsPassed: ["Z9"] } }],
    ["negative xp", { kind: "stats", statsOverride: { xp: -5 } }],
  ])("rejects %s, even when correctly encrypted", (_, p) => {
    const { statsOverride, ...payload } = p as { statsOverride?: Partial<Stats> } & Record<string, unknown>;
    const env = { v: 1, id: "abc", couple: "couple1", at: now, from: me, stats: { ...stats, ...statsOverride }, ...payload };
    expect(() => openEnvelope(key, "couple1", sealEnvelope(key, env as never), now)).toThrow(LinkError);
  });

  it("rejects messages from the far future", () => {
    const env = makeEnvelope("couple1", me, stats, { kind: "msg", text: "hi" }, now + 10 * 864e5);
    expect(() => openEnvelope(key, "couple1", sealEnvelope(key, env), now)).toThrow(LinkError);
  });
});
