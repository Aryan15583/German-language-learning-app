import { CHATS, findChat, type Chat } from "../content/chats";
import { LEVEL_IDS } from "../content/levels";
import { acceptedForms, answerChat, chatStars, matchTyped, startChat } from "../lib/chat";

const cafe = findChat("cafe")!;
const okIndex = (chat: Chat, step: number) => chat.steps[step].replies.findIndex((r) => r.ok);
const wrongIndex = (chat: Chat, step: number) => chat.steps[step].replies.findIndex((r) => !r.ok);

describe("chat engine", () => {
  it("opens with the first bot message", () => {
    const s = startChat(cafe);
    expect(s.messages).toEqual([{ from: "bot", line: cafe.steps[0].bot }]);
    expect(s.done).toBe(false);
  });

  it("moves on after a good reply", () => {
    const s = answerChat(cafe, startChat(cafe), { reply: okIndex(cafe, 0) });
    expect(s.step).toBe(1);
    expect(s.mistakes).toBe(0);
    expect(s.messages.at(-2)).toMatchObject({ from: "me", ok: true });
    expect(s.messages.at(-1)).toEqual({ from: "bot", line: cafe.steps[1].bot });
  });

  it("explains a wrong reply and asks again", () => {
    const s = answerChat(cafe, startChat(cafe), { reply: wrongIndex(cafe, 0) });
    expect(s.step).toBe(0);
    expect(s.mistakes).toBe(1);
    expect(s.messages.at(-1)).toMatchObject({ from: "coach", kind: "why" });
  });

  it("accepts typed answers, with umlaut and case freedom", () => {
    const s = answerChat(cafe, startChat(cafe), { text: "einen kaffee bitte" });
    expect(s.step).toBe(1);
    expect(s.messages.at(-2)).toEqual({ from: "me", de: "einen kaffee bitte", ok: true });
  });

  it("accepts a typo but shows the right spelling", () => {
    const s = answerChat(cafe, startChat(cafe), { text: "Einen Kafee, bitte." });
    expect(s.step).toBe(1);
    expect(s.messages).toContainEqual({ from: "coach", kind: "typo", expected: "Einen Kaffee, bitte." });
  });

  it("recognises a typed version of a wrong suggestion and explains it", () => {
    const s = answerChat(cafe, startChat(cafe), { text: "Ich bin ein Kaffee" });
    expect(s.step).toBe(0);
    expect(s.messages.at(-1)).toMatchObject({ from: "coach", kind: "why" });
  });

  it("gives an example when a typed answer is unrelated", () => {
    const s = answerChat(cafe, startChat(cafe), { text: "Ich mag Hunde" });
    expect(s.mistakes).toBe(1);
    expect(s.messages.at(-1)).toMatchObject({ from: "coach", kind: "hint", example: { de: "Einen Kaffee, bitte." } });
  });

  it("ignores empty input and unknown reply indexes", () => {
    const start = startChat(cafe);
    expect(answerChat(cafe, start, { text: "   " })).toBe(start);
    expect(answerChat(cafe, start, { reply: 99 })).toBe(start);
  });

  it("finishes with the closing line and then ignores input", () => {
    let s = startChat(cafe);
    cafe.steps.forEach((_, k) => (s = answerChat(cafe, s, { reply: okIndex(cafe, k) })));
    expect(s.done).toBe(true);
    expect(s.messages.at(-1)).toEqual({ from: "bot", line: cafe.end });
    expect(answerChat(cafe, s, { reply: 0 })).toBe(s);
  });

  it("awards stars by mistakes", () => {
    expect([0, 1, 2, 3, 9].map(chatStars)).toEqual([3, 2, 2, 1, 1]);
  });
});

describe("typed matching", () => {
  it("accepts the first clause of a longer reply", () => {
    expect(acceptedForms("Mit dem Zug, das ist entspannter.")).toEqual(["Mit dem Zug, das ist entspannter.", "Mit dem Zug"]);
    expect(acceptedForms("Hier, bitte. Danke!")).toEqual(["Hier, bitte. Danke!"]); // "Hier" alone is too short
    const replies = findChat("urlaub")!.steps[1].replies;
    expect(matchTyped("mit dem Zug", replies)?.reply.ok).toBe(true);
  });
});

describe("chat content", () => {
  const devanagari = /[ऀ-ॿ]/;

  it("has unique ids and covers every level", () => {
    expect(new Set(CHATS.map((c) => c.id)).size).toBe(CHATS.length);
    for (const id of LEVEL_IDS) expect(CHATS.some((c) => c.level === id)).toBe(true);
  });

  it.each(CHATS.map((c) => [c.id, c] as const))("%s: every step has a good reply and explained mistakes", (_, chat) => {
    expect(chat.steps.length).toBeGreaterThanOrEqual(3);
    expect(chat.intro.mr).toMatch(devanagari);
    expect(chat.end.mr).toMatch(devanagari);
    for (const step of chat.steps) {
      expect(step.bot.mr).toMatch(devanagari);
      expect(step.replies.some((r) => r.ok)).toBe(true);
      for (const r of step.replies) {
        expect(r.mr).toMatch(devanagari);
        if (!r.ok) {
          expect(r.why?.en.length).toBeGreaterThan(5);
          expect(r.why?.mr).toMatch(devanagari);
        }
      }
      // a typed good answer must never be mistaken for a wrong suggestion
      for (const r of step.replies.filter((x) => x.ok)) expect(matchTyped(r.de, step.replies)?.reply).toBe(r);
    }
  });

  it("can be completed with only the good replies", () => {
    for (const chat of CHATS) {
      let s = startChat(chat);
      chat.steps.forEach((_, k) => (s = answerChat(chat, s, { reply: okIndex(chat, k) })));
      expect(s.done).toBe(true);
      expect(chatStars(s.mistakes)).toBe(3);
    }
  });
});
