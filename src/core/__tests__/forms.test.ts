import { ADJ_LIST, formsIn, NOUN_LIST, pastFor, PERSONS, VERB_LIST, indefinite, possessive, type VerbEntry, type NounEntry } from "../lib/forms";

describe("word forms", () => {
  it("has six present forms and a past for every verb", () => {
    expect(VERB_LIST.length).toBeGreaterThan(60);
    for (const v of VERB_LIST) {
      expect(v.present).toHaveLength(PERSONS.length);
      expect(v.perfect).toMatch(/^(hat|ist) /);
      expect(v.en && v.mr).toBeTruthy();
    }
    expect(new Set(VERB_LIST.map((v) => v.lemma)).size).toBe(VERB_LIST.length);
  });

  it("gives every noun its article and plural", () => {
    expect(NOUN_LIST.length).toBeGreaterThan(90);
    for (const n of NOUN_LIST) {
      expect(["der", "die", "das"]).toContain(n.article);
      if (n.plural && !n.plural.startsWith("(")) expect(n.plural).toMatch(/^die /);
    }
    expect(new Set(NOUN_LIST.map((n) => n.lemma)).size).toBe(NOUN_LIST.length);
  });

  it("has comparisons for adjectives", () => {
    const gut = ADJ_LIST.find((a) => a.lemma === "gut")!;
    expect([gut.comparative, gut.superlative]).toEqual(["besser", "am besten"]);
  });

  it("finds the forms inside phrases", () => {
    expect(formsIn("Ich habe Hunger").map((e) => e.lemma)).toEqual(["haben", "der Hunger"]);
    expect(formsIn("Ich habe meinen Schlüssel vergessen.").map((e) => e.lemma)).toEqual(["haben", "der Schlüssel", "vergessen"]);
    expect(formsIn("Du siehst wunderschön aus.").map((e) => e.lemma)).toEqual(["aussehen", "wunderschön"]);
    expect(formsIn("Bis später").map((e) => e.lemma)).toEqual(["spät"]);
    expect(formsIn("die Küche").map((e) => e.lemma)).toEqual(["die Küche"]);
    expect(formsIn("Die Bahnhöfe")[0]?.lemma).toBe("der Bahnhof");
    expect(formsIn("heute")).toEqual([]);
  });

  it("writes the past and the little words", () => {
    const trinken = VERB_LIST.find((v) => v.lemma === "trinken") as VerbEntry;
    expect(pastFor(trinken)).toBe("ich habe getrunken");
    expect(pastFor(VERB_LIST.find((v) => v.lemma === "gehen")!, 2)).toBe("er ist gegangen");
    const kueche = NOUN_LIST.find((n) => n.lemma === "die Küche") as NounEntry;
    expect([indefinite(kueche), possessive(kueche)]).toEqual(["eine", "meine"]);
  });
});
