// Berlin Ready: free typing, checked by the words that matter.
import { READY_LEVEL, type ReadyPrompt } from "../content/berlin";
import type { Partner } from "../state/logic";
import { normalizeAnswer } from "./answers";

export function readyAnswerOk(answer: string, prompt: ReadyPrompt): boolean {
  const a = ` ${normalizeAnswer(answer)} `;
  return prompt.keywords.every((group) => group.some((k) => a.includes(normalizeAnswer(k))));
}

export const readyOpen = (p: Partner) => p.examsPassed.includes(READY_LEVEL);
