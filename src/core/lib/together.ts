// Couple learning mode: each phone shows only its half of the puzzle.
// Both phones build the same round from the same seed (date + mode + level + round),
// so it works on two phones with no messages at all — you just talk to each other.
import { GUESS_QUESTIONS, type GuessQuestion } from "../content/extras";
import { DIALOGUES, LEVEL_IDS, type Dialogue, type LevelId } from "../content/levels";
import { blankWord, pickSentences, sentencesFor, shuffledTiles, type Sentence } from "./sentences";
import { seededRng } from "./util";

export type TogetherMode = "complete" | "arrange" | "say" | "swap" | "translate" | "guess";

export const TOGETHER_MODES: { id: TogetherMode; emoji: string; title: string; desc: string }[] = [
  { id: "complete", emoji: "🧩", title: "Complete my sentence", desc: "One of you has the sentence, the other has the missing word." },
  { id: "arrange", emoji: "🔀", title: "Arrange together", desc: "You each hold half the word tiles. Build the sentence together." },
  { id: "say", emoji: "🗣️", title: "Say it together", desc: "Each phone shows only your own lines of a scene." },
  { id: "swap", emoji: "🎭", title: "Role swap", desc: "The same scenes, with your roles swapped." },
  { id: "translate", emoji: "💬", title: "Translate for me", desc: "One says it in German, the other checks the answer." },
  { id: "guess", emoji: "❤️", title: "Guess what I'd say", desc: "Pick your answer, guess your partner's, then compare — in German." },
];

export const TOGETHER_ROUNDS = 5;

/** Small, stable string hash → seed. */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) % 2 ** 31;
}

export type Round =
  | { mode: "complete"; s: Sentence; prompt: string; word: string }
  | { mode: "arrange"; s: Sentence; a: string[]; b: string[] }
  | { mode: "say" | "swap"; d: Dialogue }
  | { mode: "translate"; s: Sentence; speaker: "a" | "b" }
  | { mode: "guess"; q: GuessQuestion };

export function togetherRound(mode: TogetherMode, level: LevelId, date: string, round: number): Round {
  const rng = seededRng(seedOf(`${date}|${mode}|${level}|${round}`));
  const pool = sentencesFor(level, 3, 8);
  const pick = () => pickSentences(pool, 1, rng)[0];
  switch (mode) {
    case "complete": {
      const s = pick();
      const b = blankWord(s.de, rng);
      return { mode, s, prompt: b.prompt, word: b.answer };
    }
    case "arrange": {
      const s = pick();
      const tiles = shuffledTiles(s.de, rng);
      return { mode, s, a: tiles.filter((_, k) => k % 2 === 0), b: tiles.filter((_, k) => k % 2 === 1) };
    }
    case "say":
    case "swap": {
      const ds = DIALOGUES.filter((d) => LEVEL_IDS.indexOf(d.level) <= LEVEL_IDS.indexOf(level));
      return { mode, d: ds[Math.floor(rng() * ds.length)] };
    }
    case "translate":
      return { mode, s: pick(), speaker: round % 2 === 1 ? "a" : "b" };
    case "guess":
      return { mode, q: GUESS_QUESTIONS[Math.floor(rng() * GUESS_QUESTIONS.length)] };
  }
}
