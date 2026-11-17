// Look up how a German word changes: verb endings, plurals, "more / most".
// Works for single words and for phrases ("Ich habe Hunger" → haben + der Hunger).
import { ADJECTIVES, NOUNS, VERBS } from "../content/forms";

export const PERSONS = ["ich", "du", "er / sie / es", "wir", "ihr", "sie / Sie"] as const;

export type VerbEntry = { pos: "verb"; lemma: string; en: string; mr: string; present: string[]; perfect: string };
export type NounEntry = { pos: "noun"; lemma: string; article: "der" | "die" | "das"; word: string; en: string; plural: string | null };
export type AdjEntry = { pos: "adj"; lemma: string; en: string; mr: string; comparative: string | null; superlative: string | null };
export type FormEntry = VerbEntry | NounEntry | AdjEntry;

const lines = (block: string) =>
  block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split("|").map((x) => x.trim()));

export const VERB_LIST: VerbEntry[] = lines(VERBS).map(([lemma, en, mr, present, perfect]) => ({ pos: "verb", lemma, en, mr, present: present.split(","), perfect }));

export const NOUN_LIST: NounEntry[] = lines(NOUNS).map(([lemma, en, plural]) => {
  const [article, ...rest] = lemma.split(" ");
  return { pos: "noun", lemma, article: article as NounEntry["article"], word: rest.join(" "), en, plural: plural === "-" ? null : plural };
});

export const ADJ_LIST: AdjEntry[] = lines(ADJECTIVES).map(([lemma, en, mr, comparative, superlative]) => ({
  pos: "adj",
  lemma,
  en,
  mr,
  comparative: comparative === "-" ? null : comparative,
  superlative: superlative === "-" ? null : superlative,
}));

const firstWord = (s: string) => s.split(" ")[0];
const lastWord = (s: string) => s.split(" ").slice(-1)[0];

// Nouns are capitalised, so they're looked up as written; verbs and adjectives in lower case.
let nounIndex: Map<string, NounEntry> | null = null;
let otherIndex: Map<string, FormEntry> | null = null;
function indexes() {
  if (nounIndex && otherIndex) return { nounIndex, otherIndex };
  nounIndex = new Map();
  otherIndex = new Map();
  const put = (m: Map<string, FormEntry>, k: string, e: FormEntry) => !m.has(k) && m.set(k, e);
  for (const n of NOUN_LIST) {
    put(nounIndex as Map<string, FormEntry>, n.word, n);
    if (n.plural && !n.plural.startsWith("(")) put(nounIndex as Map<string, FormEntry>, lastWord(n.plural), n);
  }
  for (const v of VERB_LIST) {
    put(otherIndex, lastWord(v.lemma).toLowerCase(), v); // "sich freuen" → "freuen"
    for (const f of v.present) put(otherIndex, firstWord(f).toLowerCase(), v);
    put(otherIndex, lastWord(v.perfect).toLowerCase(), v);
  }
  for (const a of ADJ_LIST) {
    put(otherIndex, a.lemma.toLowerCase(), a);
    if (a.comparative) put(otherIndex, a.comparative.toLowerCase(), a);
    if (a.superlative) put(otherIndex, lastWord(a.superlative).toLowerCase(), a);
  }
  return { nounIndex, otherIndex };
}

/** Function words that would only add noise. */
const SKIP = new Set(["ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "dich", "sich", "uns", "euch", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "und", "oder", "zu", "um", "auf", "in", "im", "am", "an", "mit", "für", "bitte", "nicht", "mein", "meine", "meinen", "meiner", "dein", "deine", "deinen"]);

/** Commands ("Lass uns …", "Ruh dich aus") point at their verb too. */
const IMPERATIVE: Record<string, string> = { lass: "lassen", ruh: "sich ausruhen", mach: "machen", komm: "kommen", geh: "gehen", hör: "hören", schau: "schauen", sag: "sagen", warte: "warten" };

/** Every word in this German text whose forms we know, in order, without repeats. */
export function formsIn(text: string): FormEntry[] {
  const { nounIndex, otherIndex } = indexes();
  const words = text.replace(/[.,!?;:„“"…()]/g, " ").split(/\s+/).filter(Boolean);
  const lower = words.map((w) => w.toLowerCase());
  // Separable verbs: "Du siehst … aus" is aussehen, not sehen (the little word jumps to the end).
  const separable = new Map<string, VerbEntry>();
  for (const v of VERB_LIST) {
    for (const f of v.present) {
      const [stem, particle] = f.toLowerCase().split(" ");
      if (!particle || ["mich", "dich", "sich", "uns", "euch"].includes(particle)) continue;
      const at = lower.indexOf(stem);
      if (at >= 0 && lower.slice(at + 1).includes(particle)) separable.set(stem, v);
    }
  }
  const out: FormEntry[] = [];
  for (const raw of words) {
    if (SKIP.has(raw.toLowerCase())) continue;
    const imp = IMPERATIVE[raw.toLowerCase()];
    const e = separable.get(raw.toLowerCase()) ?? nounIndex.get(raw) ?? otherIndex.get(raw.toLowerCase()) ?? (imp ? VERB_LIST.find((v) => v.lemma === imp) : undefined);
    if (e && !out.includes(e)) out.push(e);
  }
  return out;
}

/** Past tense for "ich": "hat getrunken" → "ich habe getrunken". */
export function pastFor(v: VerbEntry, person = 0): string {
  const [aux, ...rest] = v.perfect.split(" ");
  const haben = ["habe", "hast", "hat", "haben", "habt", "haben"];
  const sein = ["bin", "bist", "ist", "sind", "seid", "sind"];
  const conj = aux === "ist" ? sein[person] : haben[person];
  return `${PERSONS[person].split(" ")[0]} ${conj} ${rest.join(" ")}`;
}

/** "ein / eine" and "mein / meine" for a noun's gender. */
export const indefinite = (n: NounEntry) => (n.article === "die" ? "eine" : "ein");
export const possessive = (n: NounEntry) => (n.article === "die" ? "meine" : "mein");
