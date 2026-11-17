// The new learning tools: spaced repetition, sentences, practice, missions, journey, duels, phrases, Berlin Ready.
import { BERLIN_READY, JOURNEY, SECRET_PHRASES, stopTopic } from "../content/berlin";
import { COMPARISONS, GRAMMAR_BITES, GUESS_QUESTIONS, PHRASEBOOK, ROLEPLAYS } from "../content/extras";
import { allTopics, levelWords, LEVELS } from "../content/levels";
import { decodeDuel, duelInfo, duelQuestions, duelSentences, encodeDuel, answerPoints, DUEL_MODES } from "../lib/duels";
import { COUPLE_ACHIEVEMENTS } from "../lib/game";
import { journeyPoints, nextStop, postcards, reachedIndex, routeShare, stopState } from "../lib/journey";
import { missionComplete, missionFor, missionTasks } from "../lib/missions";
import { suggestPhrases } from "../lib/phrases";
import { practiceSet, reviewSet } from "../lib/practice";
import { questionKey } from "../lib/questions";
import { readyAnswerOk } from "../lib/ready";
import { blankWord, clozeFor, orderCorrect, sentencePool, sentencesFor, shuffledTiles, tokens, wordOptions } from "../lib/sentences";
import { addDays, dueKeys, nextReviewLabel, recall, stage } from "../lib/srs";
import { seedOf, TOGETHER_MODES, togetherRound } from "../lib/together";
import { seededRng } from "../lib/util";
import { coupleContext } from "../state/couple";
import { bumpMission, claimMission, countUp, finishReadyDay, freshState, meetWord, migrate, recordUnitScore, remember } from "../state/logic";

const T = "2026-11-10";

describe("spaced repetition", () => {
  it("spaces right answers out: 1 → 3 → 7 → 14 → 30 days", () => {
    let m = recall(undefined, true, T);
    const dues = [m.due];
    for (let k = 0; k < 5; k++) {
      m = recall(m, true, T);
      dues.push(m.due);
    }
    expect(dues).toEqual([addDays(T, 1), addDays(T, 3), addDays(T, 7), addDays(T, 14), addDays(T, 30), addDays(T, 30)]);
    expect(stage(m)).toMatchObject({ id: "mastered", emoji: "❤️" });
  });

  it("brings a word back today after a mistake, and counts mistakes", () => {
    const m = recall(recall(recall(undefined, true, T), true, T), false, T);
    expect(m).toMatchObject({ b: 0, due: T, w: 1 });
    expect(stage(m).id).toBe("seed");
  });

  it("doesn't move a slow answer forward", () => {
    const m = recall({ b: 3, due: T, w: 0, seen: T }, true, T, true);
    expect(m.b).toBe(3);
  });

  it("lists due words, most-missed first", () => {
    const mem = { a: recall(undefined, false, T), b: recall(recall(undefined, false, T), false, T), c: recall(undefined, true, T) };
    expect(dueKeys(mem, T)).toEqual(["b", "a"]);
    expect(dueKeys(mem, addDays(T, 1))).toEqual(["b", "a", "c"]);
  });

  it("describes the next review", () => {
    expect(nextReviewLabel(undefined, T)).toBe("Not learned yet");
    expect(nextReviewLabel(recall(undefined, true, T), T)).toBe("Tomorrow");
    expect(nextReviewLabel({ b: 3, due: addDays(T, 7), w: 0, seen: T }, T)).toBe("In 7 days");
  });

  it("stores memory in the state, and survives an upgrade from old saves", () => {
    let s = meetWord(freshState(), 0, "Schatz", T);
    expect(s.partners[0].memory.Schatz.due).toBe(addDays(T, 1));
    s = remember(s, 0, "Schatz", false, T);
    expect(dueKeys(s.partners[0].memory, T)).toEqual(["Schatz"]);
    const old = migrate({ partners: [{ name: "A", counts: { messages: 2, duelsWon: 1 } }, { name: "B" }] });
    expect(old.partners[0]).toMatchObject({ memory: {}, practised: [], mission: null, ready: 0, counts: { messages: 2, duelsWon: 1, notes: 0, hearts: 0 } });
  });
});

describe("sentences", () => {
  it("collects real sentences with translations and levels", () => {
    const pool = sentencePool();
    expect(pool.length).toBeGreaterThan(80);
    for (const s of pool) {
      expect(s.en.trim()).not.toBe("");
      expect(s.mr.trim()).not.toBe("");
    }
    expect(new Set(pool.map((s) => s.de)).size).toBe(pool.length);
  });

  it("filters by level and length", () => {
    const a1 = sentencesFor("A1", 3, 6);
    expect(a1.length).toBeGreaterThan(10);
    for (const s of a1) {
      expect(s.level).toBe("A1");
      expect(tokens(s.de).length).toBeLessThanOrEqual(6);
    }
  });

  it("builds word tiles and checks the order", () => {
    const de = "Heute gehen wir ins Kino.";
    expect(tokens(de)).toEqual(["Heute", "gehen", "wir", "ins", "Kino"]);
    const tiles = shuffledTiles(de, seededRng(1));
    expect([...tiles].sort()).toEqual([...tokens(de)].sort());
    expect(tiles.join(" ")).not.toBe(tokens(de).join(" "));
    expect(orderCorrect(tokens(de), de)).toBe(true);
    expect(orderCorrect(["wir", "gehen", "heute", "ins", "Kino"], de)).toBe(false);
  });

  it("finds a word in a real sentence and blanks it", () => {
    const c = clozeFor({ de: "der Schlüssel", en: "the key", mr: "किल्ली" });
    expect(c).not.toBeNull();
    expect(c!.answer).toBe("Schlüssel");
    expect(c!.prompt).toContain("___");
    expect(c!.prompt).not.toContain("Schlüssel");
  });

  it("blanks a meaningful word and offers options", () => {
    const b = blankWord("Ich trinke heute Kaffee.", seededRng(3));
    expect(b.prompt).toContain("___");
    expect(tokens("Ich trinke heute Kaffee.")).toContain(b.answer);
    const opts = wordOptions(b.answer, sentencePool(), seededRng(4));
    expect(opts).toHaveLength(4);
    expect(opts).toContain(b.answer);
  });
});

describe("practice and review sets", () => {
  const unit = allTopics()[0];
  const others = levelWords(LEVELS[0]);

  it("gives one exercise per word, mixing listen, say, type and use", () => {
    const qs = practiceSet(unit.words, others, "en", seededRng(5));
    expect(qs).toHaveLength(unit.words.length);
    expect(new Set(qs.map(questionKey))).toEqual(new Set(unit.words.map((w) => w.de)));
    const kinds = new Set(qs.map((q) => q.kind));
    expect(kinds.has("listen")).toBe(true);
    expect(kinds.has("say")).toBe(true);
    for (const q of qs) if ("options" in q) expect(q.options).toContain(q.answer);
  });

  it("reviews each due word once", () => {
    const words = others.slice(0, 6);
    const qs = reviewSet(words, others, "mr", seededRng(6));
    expect(qs.map(questionKey)).toEqual(words.map((w) => w.de));
  });
});

describe("daily mission", () => {
  it("resets each day and pays out once when everything is done", () => {
    let s = freshState();
    s = bumpMission(s, 0, "words", T, 5);
    s = bumpMission(s, 0, "talks", T);
    s = bumpMission(s, 0, "duels", T);
    expect(missionComplete(missionFor(s.partners[0].mission, T))).toBe(false);
    expect(claimMission(s, 0, T)).toBe(s);
    s = bumpMission(s, 0, "notes", T);
    expect(missionTasks(missionFor(s.partners[0].mission, T)).every((t) => t.done)).toBe(true);
    const claimed = claimMission(s, 0, T);
    expect(claimed.partners[0].xp).toBe(100);
    expect(claimed.partners[0].counts.hearts).toBe(1);
    expect(claimMission(claimed, 0, T)).toBe(claimed);
    expect(missionFor(claimed.partners[0].mission, addDays(T, 1))).toMatchObject({ words: 0, claimed: false });
  });
});

describe("the journey to Berlin", () => {
  it("has 8 stops in order, each with words in three languages and a postcard", () => {
    expect(JOURNEY).toHaveLength(8);
    const needs = JOURNEY.map((s) => s.need);
    expect([...needs].sort((a, b) => a - b)).toEqual(needs);
    for (const s of JOURNEY) {
      expect(s.words.length).toBeGreaterThanOrEqual(4);
      for (const w of s.words) expect(w.de && w.en && w.mr).toBeTruthy();
      expect(s.postcard.place).not.toBe("");
    }
    expect(JOURNEY.at(-1)!.need).toBeLessThanOrEqual(allTopics().length);
  });

  it("averages both partners' lessons and unlocks stops", () => {
    expect(journeyPoints(4, null)).toBe(4);
    expect(journeyPoints(5, 2)).toBe(3);
    expect(reachedIndex(0)).toBe(-1);
    expect(reachedIndex(2)).toBe(1);
    expect(nextStop(2)).toMatchObject({ stop: { id: "wohnung" }, toGo: 2 });
    expect(routeShare(JOURNEY.at(-1)!.need)).toBe(1);
    let s = freshState();
    const cafe = JOURNEY[1];
    expect(stopState(s.partners[0], cafe, 0)).toBe("locked");
    expect(stopState(s.partners[0], cafe, 2)).toBe("open");
    s = recordUnitScore(s, 0, stopTopic(cafe).id, 1);
    expect(stopState(s.partners[0], cafe, 0)).toBe("explored");
    expect(postcards(s.partners[0]).map((p) => p.id)).toEqual(["cafe"]);
  });

  it("keeps secret phrases in streak order", () => {
    expect(SECRET_PHRASES.map((p) => p.day)).toEqual([7, 14, 30, 50, 100]);
  });
});

describe("duel types", () => {
  it("round-trips the mode in the topic, within the message limits", () => {
    for (const m of DUEL_MODES) {
      const raw = encodeDuel(m.id, "mix-A1");
      expect(decodeDuel(raw)).toEqual({ mode: m.id, topic: "mix-A1" });
      expect(raw).toMatch(/^[a-z0-9-]+$/i);
      expect(raw.length).toBeLessThanOrEqual(40);
      expect(duelInfo(raw)).not.toBeNull();
    }
    expect(decodeDuel("kosenamen")).toEqual({ mode: "classic", topic: "kosenamen" });
  });

  it("gives both phones the same questions for the same seed", () => {
    for (const m of ["classic", "speed", "knowledge", "translate", "streak"] as const) {
      const raw = encodeDuel(m, "mix-A2");
      const a = duelQuestions(raw, "en", 42).map((q) => q.german);
      const b = duelQuestions(raw, "mr", 42).map((q) => q.german);
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThan(0);
    }
    expect(duelQuestions(encodeDuel("translate", "mix-A1"), "en", 1).every((q) => q.kind === "choice" && q.direction === "de-x")).toBe(true);
    expect(duelQuestions(encodeDuel("streak", "mix-A1"), "en", 1).length).toBe(40);
    expect(duelSentences(encodeDuel("sentence", "mix-A1"), 9).map((s) => s.de)).toEqual(duelSentences(encodeDuel("sentence", "mix-A1"), 9).map((s) => s.de));
  });

  it("rewards fast right answers in speed duels", () => {
    expect(answerPoints("speed", true, 2000)).toBe(2);
    expect(answerPoints("speed", true, 8000)).toBe(1);
    expect(answerPoints("classic", true, 1000)).toBe(1);
    expect(answerPoints("speed", false, 1000)).toBe(0);
  });
});

describe("love-note phrases", () => {
  it("turns what you feel into German", () => {
    expect(suggestPhrases("I miss you so much")[0].de).toBe("Ich vermisse dich so sehr.");
    expect(suggestPhrases("proud of you").map((w) => w.de)).toContain("Ich bin so stolz auf dich.");
    expect(suggestPhrases("मला तुझी आठवण येते").map((w) => w.de)).toContain("Ich vermisse dich.");
    expect(suggestPhrases("   ")).toEqual([]);
  });
});

describe("Berlin Ready", () => {
  it("accepts free answers that say the right thing", () => {
    const p = BERLIN_READY[0].prompts[1];
    expect(readyAnswerOk("Entschuldigung, wo ist der Ausgang bitte?", p)).toBe(true);
    expect(readyAnswerOk("wo ist der ausgang", p)).toBe(true);
    expect(readyAnswerOk("Ausgang!", p)).toBe(false);
    const cafe = BERLIN_READY[2].prompts[0];
    expect(readyAnswerOk("Zwei Kaffee, bitte", cafe)).toBe(true);
  });

  it("has 7 days and remembers progress", () => {
    expect(BERLIN_READY.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const d of BERLIN_READY) for (const p of d.prompts) expect(readyAnswerOk(p.model, p)).toBe(true);
    expect(finishReadyDay(freshState(), 0, 3).partners[0].ready).toBe(3);
  });
});

describe("extra content", () => {
  it("is complete in three languages", () => {
    for (const r of ROLEPLAYS) {
      expect(r.turns.length).toBeGreaterThanOrEqual(4);
      expect(new Set(r.turns.map((t) => t.who))).toEqual(new Set(["a", "b"]));
      for (const t of r.turns) expect(t.task.en && t.task.mr && t.de).toBeTruthy();
    }
    expect(new Set(ROLEPLAYS.map((r) => r.id)).size).toBe(ROLEPLAYS.length);
    expect(ROLEPLAYS.length).toBe(12);
    for (const q of GUESS_QUESTIONS) expect(q.options).toHaveLength(4);
    for (const b of GRAMMAR_BITES) expect(b.gloss.length).toBeGreaterThan(1);
    for (const c of COMPARISONS) expect(c.mr && c.de && c.en).toBeTruthy();
    for (const p of PHRASEBOOK) expect(p.mr).not.toBe("");
  });
});

describe("couple achievements", () => {
  it("are earned together", () => {
    let s = freshState();
    s = { ...s, partners: [{ ...s.partners[0], name: "A" }, { ...s.partners[1], name: "B" }] };
    expect(COUPLE_ACHIEVEMENTS.filter((a) => a.test(coupleContext(s, 0, true, 0)))).toEqual([]);
    s = recordUnitScore(recordUnitScore(s, 0, allTopics()[0].id, 1), 1, allTopics()[0].id, 1);
    s = countUp(countUp(s, 0, "duels"), 1, "talks");
    const c = coupleContext(s, 7, true, 1);
    const ids = COUPLE_ACHIEVEMENTS.filter((a) => a.test(c)).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["together", "couple-streak", "first-duel", "first-talk", "postcard"]));
    expect(ids).not.toContain("berlin-ready");
  });
});

describe("couple learning mode", () => {
  it("builds the same round on both phones, and different rounds differ", () => {
    for (const m of TOGETHER_MODES) {
      const a = togetherRound(m.id, "A2", T, 1);
      const b = togetherRound(m.id, "A2", T, 1);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
    expect(seedOf("x")).not.toBe(seedOf("y"));
  });

  it("splits the puzzle between the two of you", () => {
    const r = togetherRound("arrange", "A1", T, 2);
    if (r.mode !== "arrange") throw new Error("mode");
    expect([...r.a, ...r.b].sort()).toEqual(tokens(r.s.de).sort());
    const c = togetherRound("complete", "A1", T, 3);
    if (c.mode !== "complete") throw new Error("mode");
    expect(c.prompt).toContain("___");
    expect(c.prompt).not.toContain(` ${c.word} `);
  });
});
