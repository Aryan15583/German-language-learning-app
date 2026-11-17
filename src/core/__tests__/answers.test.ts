import { allowedTypos, checkTypedAnswer, isAccepted, levenshtein, normalizeAnswer } from "../lib/answers";

describe("normalizeAnswer", () => {
  it("ignores case, punctuation and extra spaces", () => {
    expect(normalizeAnswer("  Guten Morgen,   Schatz! ")).toBe("guten morgen schatz");
    expect(normalizeAnswer("„Prost!“")).toBe("prost");
  });

  it("maps umlauts and ß to their ASCII spellings", () => {
    expect(normalizeAnswer("Müde Bäume, Öl, Straße")).toBe("muede baeume oel strasse");
  });
});

describe("levenshtein", () => {
  it.each([
    ["", "", 0],
    ["abc", "", 3],
    ["kitten", "sitting", 3],
    ["schatz", "schatz", 0],
    ["schaz", "schatz", 1],
  ])("distance(%j, %j) = %i", (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
    expect(levenshtein(b, a)).toBe(d);
  });
});

describe("allowedTypos", () => {
  it("forgives nothing on short words and more on long ones", () => {
    expect(allowedTypos(4)).toBe(0);
    expect(allowedTypos(5)).toBe(1);
    expect(allowedTypos(14)).toBe(2);
  });
});

describe("checkTypedAnswer", () => {
  it("accepts exact answers regardless of case and punctuation", () => {
    expect(checkTypedAnswer("ich liebe dich", "Ich liebe dich")).toBe("correct");
    expect(checkTypedAnswer("Gute Nacht.", "Gute Nacht")).toBe("correct");
  });

  it("accepts ASCII spellings of umlauts as fully correct", () => {
    expect(checkTypedAnswer("muede", "müde")).toBe("correct");
    expect(checkTypedAnswer("Ich bin stolz auf dich", "Ich bin stolz auf dich")).toBe("correct");
    expect(checkTypedAnswer("die Kueche", "die Küche")).toBe("correct");
  });

  it("flags small typos as 'typo', which still counts", () => {
    const v = checkTypedAnswer("Schlafzimer", "Schlafzimmer");
    expect(v).toBe("typo");
    expect(isAccepted(v)).toBe(true);
  });

  it("rejects wrong words, empty input and typos in very short words", () => {
    expect(checkTypedAnswer("Hund", "Katze")).toBe("wrong");
    expect(checkTypedAnswer("   ", "Prost")).toBe("wrong");
    expect(checkTypedAnswer("teu", "teuer")).toBe("wrong");
    expect(checkTypedAnswer("das", "die")).toBe("wrong");
    expect(isAccepted("wrong")).toBe(false);
  });

  it("does not accept the wrong article as a typo on short phrases", () => {
    // "der Kino" vs "das Kino" is 2 edits on an 8-letter answer: wrong, not a typo.
    expect(checkTypedAnswer("der Kino", "das Kino")).toBe("wrong");
  });
});
