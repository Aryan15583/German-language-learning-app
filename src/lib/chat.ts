// The guided-chat engine: pure functions, so the conversation logic is easy to test.
import type { Chat, Explained, Reply, Text3 } from "../content/chats";
import { checkTypedAnswer, type AnswerVerdict } from "./answers";

export type ChatMessage =
  | { from: "bot"; line: Text3 }
  | { from: "me"; de: string; ok: boolean }
  | { from: "coach"; kind: "why"; why: Explained }
  | { from: "coach"; kind: "typo"; expected: string }
  | { from: "coach"; kind: "hint"; example: Text3 };

export type ChatState = {
  step: number;
  messages: ChatMessage[];
  mistakes: number;
  done: boolean;
};

export type ChatInput = { reply: number } | { text: string };

export const startChat = (chat: Chat): ChatState => ({
  step: 0,
  messages: [{ from: "bot", line: chat.steps[0].bot }],
  mistakes: 0,
  done: false,
});

/**
 * Ways of saying a reply that we accept when typed: the full sentence, or just its
 * first clause ("Mit dem Zug" for "Mit dem Zug, das ist entspannter.").
 */
export function acceptedForms(de: string): string[] {
  const first = de.split(/[,.!?;–—]/)[0].trim();
  return first && first !== de && first.split(/\s+/).length >= 2 ? [de, first] : [de];
}

/** Find the suggested reply a typed message is closest to. */
export function matchTyped(text: string, replies: readonly Reply[]): { reply: Reply; verdict: AnswerVerdict } | null {
  let best: { reply: Reply; verdict: AnswerVerdict } | null = null;
  for (const reply of replies) {
    for (const form of acceptedForms(reply.de)) {
      const verdict = checkTypedAnswer(text, form);
      if (verdict === "correct") return { reply, verdict };
      if (verdict === "typo" && !best) best = { reply, verdict };
    }
  }
  return best;
}

function advance(chat: Chat, s: ChatState, messages: ChatMessage[]): ChatState {
  const next = s.step + 1;
  if (next >= chat.steps.length) {
    return { ...s, step: next, messages: [...messages, { from: "bot", line: chat.end }], done: true };
  }
  return { ...s, step: next, messages: [...messages, { from: "bot", line: chat.steps[next].bot }] };
}

/** Apply the learner's answer. Wrong answers get coaching and the same question again. */
export function answerChat(chat: Chat, s: ChatState, input: ChatInput): ChatState {
  if (s.done) return s;
  const step = chat.steps[s.step];

  if ("reply" in input) {
    const reply = step.replies[input.reply];
    if (!reply) return s;
    const messages: ChatMessage[] = [...s.messages, { from: "me", de: reply.de, ok: reply.ok }];
    if (reply.ok) return advance(chat, s, messages);
    return wrong(s, [...messages, { from: "coach", kind: "why", why: reply.why ?? { en: "Not quite.", mr: "अगदी बरोबर नाही." } }]);
  }

  const text = input.text.trim();
  if (!text) return s;
  const match = matchTyped(text, step.replies);

  if (match && match.reply.ok) {
    const messages: ChatMessage[] = [...s.messages, { from: "me", de: text, ok: true }];
    if (match.verdict === "typo") messages.push({ from: "coach", kind: "typo", expected: match.reply.de });
    return advance(chat, s, messages);
  }

  const messages: ChatMessage[] = [...s.messages, { from: "me", de: text, ok: false }];
  if (match) return wrong(s, [...messages, { from: "coach", kind: "why", why: match.reply.why ?? { en: "Not quite.", mr: "अगदी बरोबर नाही." } }]);
  const example = step.replies.find((r) => r.ok)!;
  return wrong(s, [...messages, { from: "coach", kind: "hint", example }]);
}

const wrong = (s: ChatState, messages: ChatMessage[]): ChatState => ({ ...s, messages, mistakes: s.mistakes + 1 });

/** 3 stars for no mistakes, 2 for one or two, 1 otherwise. */
export const chatStars = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
