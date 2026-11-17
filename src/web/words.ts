import { journeyWords } from "../core/content/berlin";
import { allWords, type Word } from "../core/content/levels";
import type { AppState } from "../core/state/logic";

/** Every word the app knows, by its German (course, journey and your own words). */
export function wordIndex(s: AppState): Map<string, Word> {
  const m = new Map<string, Word>();
  for (const w of [...allWords(), ...journeyWords(), ...s.customWords]) if (!m.has(w.de)) m.set(w.de, w);
  return m;
}
