import { CHATS } from "../content/chats";
import { DIALOGUES, LEVELS, levelWords, meaning } from "../content/levels";
import { romanizeMarathi } from "../lib/romanize";

describe("romanizeMarathi", () => {
  it.each([
    ["माझं तुझ्यावर प्रेम आहे", "Majha tujhyavar prem aahe"],
    ["मला तुझी आठवण येते", "Mala tujhi aathvan yete"],
    ["मला भूक लागली आहे", "Mala bhuk lagli aahe"],
    ["सुप्रभात, सोनू!", "Suprabhat, sonu!"],
    ["शुभ रात्री", "Shubh ratri"],
    ["नाश्ता", "Nashta"],
    ["चविष्ट", "Chavishta"],
    ["जेवण", "Jevan"],
    ["तू मला मदत करशील का?", "Tu mala madat karshil ka?"],
    ["स्वयंपाकघर", "Svayampakghar"],
    ["आपण नाचूया का?", "Aapan nachuya ka?"],
    ["समजून", "Samjun"],
    ["आपल्याला", "Aaplyala"],
    ["हे खूप छान लागतंय", "He khup chhan lagtay"],
  ])("%s → %s", (mr, latin) => {
    expect(romanizeMarathi(mr)).toBe(latin);
  });

  it.each([
    ["लग्न", "Lagna"],
    ["स्वप्न", "Svapna"],
    ["प्रयत्न", "Prayatna"],
    ["खऱ्या", "Kharya"],
    ["ओळींमधला", "Olinmadhla"],
    ["संयुक्त", "Sanyukta"],
    ["सुरक्षित", "Surakshit"],
    ["फुलपाखरं", "Fulpakhra"],
  ])("handles clusters and special letters: %s → %s", (mr, latin) => {
    expect(romanizeMarathi(mr)).toBe(latin);
  });

  it.each([
    ["एक कॉफी, प्लीज.", "Ek coffee, please."],
    ["सुपरमार्केट", "Supermarket"],
    ["आपल्या बजेटच्या बाहेर", "Aaplya budgetchya baher"],
    ["जर्मनमध्ये", "Germanmadhye"],
  ])("writes English loanwords the English way: %s → %s", (mr, latin) => {
    expect(romanizeMarathi(mr)).toBe(latin);
  });

  it("handles final anusvara as a vowel (बरं → bara, सगळं → sagla)", () => {
    expect(romanizeMarathi("बरं")).toBe("Bara");
    expect(romanizeMarathi("सगळं")).toBe("Sagla");
  });

  it("uses the Marathi pronunciation of ज्ञ", () => {
    expect(romanizeMarathi("ज्ञान")).toBe("Dnyan");
  });

  it("keeps Latin text, punctuation and German words as they are", () => {
    expect(romanizeMarathi("जर्मन du/Sie हे मराठी तू/तुम्ही सारखेच आहेत")).toBe("German du/Sie he marathi tu/tumhi sarkhech aahet");
    expect(romanizeMarathi('"Einen Kaffee, bitte." म्हणा.')).toBe('"Einen Kaffee, bitte." Mhana.');
  });

  it("converts Devanagari digits and danda", () => {
    expect(romanizeMarathi("आठ वाजता १२।")).toBe("Aath vajta 12.");
  });

  it("produces only Latin letters for every Marathi line in the course", () => {
    const all = [
      ...LEVELS.flatMap(levelWords).map((w) => w.mr),
      ...DIALOGUES.flatMap((d) => d.lines.map((l) => l.mr)),
      ...CHATS.flatMap((c) => c.steps.flatMap((s) => [s.bot.mr, ...s.replies.map((r) => r.mr)])),
    ];
    for (const mr of all) expect(romanizeMarathi(mr)).not.toMatch(/[ऀ-ॿ]/);
  });

  it("keeps quiz answers unambiguous within each level", () => {
    for (const level of LEVELS) {
      const latin = levelWords(level).map((w) => meaning(w, "mr-Latn"));
      expect(new Set(latin).size).toBe(latin.length);
    }
  });
});
