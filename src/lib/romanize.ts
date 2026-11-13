// Marathi (Devanagari) → casual English letters, the way people text in Marathi:
// "माझं तुझ्यावर प्रेम आहे" → "majha tujhyavar prem aahe".
// Rule-based, so every Marathi line in the app (and any added later) gets it for free.

const INDEPENDENT_VOWELS: Record<string, string> = {
  अ: "a", आ: "aa", इ: "i", ई: "i", उ: "u", ऊ: "u", ऋ: "ru", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऍ: "e", ऑ: "o",
};

const MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ru", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o",
};

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "f", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ऱ: "r", ल: "l", ळ: "l", व: "v",
  श: "sh", ष: "sh", स: "s", ह: "h",
};

const VIRAMA = "्";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";
const NUKTA = "़";
const DIGITS = "०१२३४५६७८९";
const LABIALS = new Set(["p", "f", "b", "bh"]);
const SEMIVOWELS = new Set(["y", "r", "l", "v"]);

/**
 * English loanwords are texted in English spelling ("coffee", not "kofi").
 * A word that starts with one of these keeps any Marathi ending: बजेटच्या → budgetchya.
 */
const LOANWORDS: Record<string, string> = {
  अपॉइंटमेंट: "appointment", आयटी: "IT", आयशेनडॉर्फ: "Eichendorff", आर्टिकल: "article", ऑनलाइन: "online",
  कार्ड: "card", कॅफे: "cafe", केक: "cake", कॉफी: "coffee", चिअर्स: "cheers", जर्मन: "German", टोमॅटो: "tomato",
  ट्रीट: "treat", ट्रेकिंग: "trekking", ट्रेन: "train", डेट: "date", डॉक्टरां: "doctoran", डॉक्टर: "doctor",
  पार्टीत: "partyt", पार्टी: "party", पास्ता: "pasta", पिझ्झा: "pizza", पेमेंट: "payment", पॉपकॉर्न: "popcorn",
  पोलिसांना: "policela", प्रेट्झेल: "pretzel", प्लीज: "please", फोटो: "photo", बजेट: "budget", बर्लिन: "Berlin",
  बाथरूम: "bathroom", रेल्वे: "railway", ऑर्डर: "order", टाइप: "type", बिल: "bill", मूड: "mood", युरो: "euro", योनास: "Jonas", वाईन: "wine", वीकेंड: "weekend",
  व्हॅक्यूम: "vacuum", सुपरमार्केट: "supermarket", सूटकेस: "suitcase", सोफा: "sofa", स्टेशन: "station", हॉटेल: "hotel",
};
const LOAN_KEYS = Object.keys(LOANWORDS).sort((a, b) => b.length - a.length);
/** Characters that can't start a word on their own (vowel signs, virama, nasal marks). */
const DEPENDENT = /^[ऀ-ःऺ-ॏॢॣ]/;

type Syllable = {
  /** Consonant sound(s), "" for a bare vowel. */
  cons: string;
  /** Vowel sound: "a" for the inherent vowel, "" when silenced by a virama. */
  vowel: string;
  inherent: boolean;
  /** Vowel silenced by an explicit virama (part of a consonant cluster). */
  virama: boolean;
  nasal: boolean;
  visarga: boolean;
};

/** Split one Devanagari word into syllables. */
function syllables(word: string): Syllable[] {
  const out: Syllable[] = [];
  const chars = Array.from(word.replace(/[‌‍]/g, "").replace(new RegExp(NUKTA, "g"), ""));
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const last = out[out.length - 1];
    if (ch in INDEPENDENT_VOWELS) {
      out.push({ cons: "", vowel: INDEPENDENT_VOWELS[ch], inherent: false, virama: false, nasal: false, visarga: false });
    } else if (ch in CONSONANTS) {
      // ज्ञ is pronounced "dny" in Marathi (ज्ञान → dnyan).
      if (ch === "ज" && chars[i + 1] === VIRAMA && chars[i + 2] === "ञ") {
        out.push({ cons: "dny", vowel: "a", inherent: true, virama: false, nasal: false, visarga: false });
        i += 2;
        continue;
      }
      out.push({ cons: CONSONANTS[ch], vowel: "a", inherent: true, virama: false, nasal: false, visarga: false });
    } else if (ch in MATRAS && last) {
      last.vowel = MATRAS[ch];
      last.inherent = false;
    } else if (ch === VIRAMA && last) {
      last.vowel = "";
      last.inherent = false;
      last.virama = true;
    } else if ((ch === ANUSVARA || ch === CHANDRABINDU) && last) {
      last.nasal = true;
    } else if (ch === VISARGA && last) {
      last.visarga = true;
    }
  }
  return out;
}

/**
 * Marathi drops most "inherent a" sounds that the script implies:
 * at the end of a word (प्रेम → prem) and between vowels (समजून → samjun).
 */
function deleteSchwas(sy: Syllable[]) {
  const hasVowel = (s: Syllable | undefined) => !!s && s.vowel !== "";
  const n = sy.length;
  // Word-final: drop it, unless the word is a single syllable, ends in a nasal (बरं → bara)
  // or ends in a consonant cluster (लग्न → lagna, दृश्य → drushya).
  const lastSy = sy[n - 1];
  const afterCluster = n > 1 && sy[n - 2].virama;
  if (n > 1 && lastSy.inherent && !lastSy.nasal && !lastSy.visarga && !afterCluster) lastSy.vowel = "";
  // Medial, right to left: V C(a) C V → drop the a (समजून → samjun, ओळींमधला → olinmadhla).
  // Also before a cluster ending in y/r/l/v (आपल्याला → aaplyala), except after h (महत्त्व).
  for (let i = n - 2; i >= 1; i--) {
    const s = sy[i];
    if (!s.inherent || s.nasal || s.visarga || !s.cons) continue;
    const prev = sy[i - 1];
    const next = sy[i + 1];
    if (!hasVowel(prev) || !next.cons) continue;
    const semivowelCluster = next.virama && i + 2 < n && SEMIVOWELS.has(sy[i + 2].cons) && s.cons !== "h";
    if (hasVowel(next) || semivowelCluster) s.vowel = "";
  }
}

function romanizeWord(word: string): string {
  for (const key of LOAN_KEYS) {
    if (!word.startsWith(key)) continue;
    const rest = word.slice(key.length);
    if (!rest) return LOANWORDS[key];
    if (!DEPENDENT.test(rest)) return LOANWORDS[key] + romanizeWord(rest);
  }
  const sy = syllables(word);
  if (!sy.length) return "";
  deleteSchwas(sy);
  let out = "";
  sy.forEach((s, i) => {
    out += s.cons + s.vowel;
    if (s.nasal) {
      const isLast = i === sy.length - 1;
      // Final anusvara after an inherent vowel is just the vowel: माझं → majha, सगळं → sagla.
      if (isLast && s.inherent) return;
      const next = sy[i + 1];
      // Colloquial -तंय is said "-tay" (लागतंय → lagtay); otherwise संयुक्त → sanyukta.
      if (next && next.cons === "y" && s.inherent && i + 1 === sy.length - 1 && next.vowel === "") return;
      out += next && LABIALS.has(next.cons) ? "m" : "n";
    }
    if (s.visarga) out += "h";
  });
  return out;
}

const cache = new Map<string, string>();

/** Romanize any text: Devanagari runs are converted, everything else is kept. */
export function romanizeMarathi(text: string): string {
  const hit = cache.get(text);
  if (hit !== undefined) return hit;
  const result = text
    .replace(/[ऀ-ॿ‌‍]+/g, (run) => {
      // Danda and digits are not part of words.
      return run
        .split(/([।॥०-९])/)
        .map((part) => {
          if (part === "।" || part === "॥") return ".";
          if (part.length === 1 && DIGITS.includes(part)) return String(DIGITS.indexOf(part));
          return romanizeWord(part);
        })
        .join("");
    })
    .replace(/(^|[.!?]\s+|["„“(]\s*)([a-z])/g, (_, pre: string, ch: string) => pre + ch.toUpperCase());
  cache.set(text, result);
  return result;
}
