import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Missing } from "../components/NotFound";
import { Button, Card, Chip, cx, fieldClass, PageHeader, Speak } from "../components/ui";
import { findChat, type Chat } from "../core/content/chats";
import { meaning, type Lang } from "../core/content/levels";
import { answerChat, chatStars, startChat, type ChatInput, type ChatMessage } from "../core/lib/chat";
import { useId } from "../web/nav";
import { partnerName, useProgress, XP } from "../web/progress";

const UMLAUTS = ["ä", "ö", "ü", "ß"];

export default function ChatPage() {
  const id = useId();
  const chat = id ? findChat(id) : undefined;
  if (id === null) return <Missing loading />;
  if (!chat) return <Missing />;
  return <GuidedChat key={chat.id} chat={chat} />;
}

/** A guided chat: the character talks, you reply in German (pick or type), a coach explains slips. */
function GuidedChat({ chat }: { chat: Chat }) {
  const { state, practiced, recordChat, log } = useProgress();
  const learner = state.learner;
  const lang = state.partners[learner].lang;
  const [cs, setCs] = useState(() => startChat(chat));
  const [text, setText] = useState("");
  const [help, setHelp] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [cs.messages.length]);

  const send = (input: ChatInput) => {
    const next = answerChat(chat, cs, input);
    if (next === cs) return;
    setCs(next);
    setText("");
    if (next.step > cs.step) practiced(learner, XP.chatTurn);
    if (next.done && !cs.done) {
      recordChat(learner, chat.id, chatStars(next.mistakes));
      practiced(learner, XP.chatDone);
      log("💬", `Finished the chat “${chat.title}” ${"⭐".repeat(chatStars(next.mistakes))}`);
    }
  };
  const step = chat.steps[cs.step];
  const stars = chatStars(cs.mistakes);

  return (
    <AppShell focus>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${chat.level} · ${chat.title}`} />
        <Card className="bg-blush/70">
          <p>
            {chat.emoji} {meaning(chat.intro, lang)}
          </p>
          <Chip className="mt-2" selected={help} onClick={() => setHelp(!help)}>
            {meaning({ en: "Show translations", mr: "भाषांतर दाखवा" }, lang)}
          </Chip>
        </Card>

        <div className="my-4 space-y-2" aria-live="polite">
          {cs.messages.map((m, k) => (
            <Message key={k} m={m} bot={chat.bot} help={help} lang={lang} />
          ))}
          <div ref={endRef} />
        </div>

        {cs.done ? (
          <Card className="text-center anim-pop-in">
            <p className="text-4xl">{"⭐".repeat(stars) + "☆".repeat(3 - stars)}</p>
            <p className="mt-1 text-xl font-bold">Super gemacht!</p>
            <p className="my-2 text-muted">{cs.mistakes === 0 ? "A perfect conversation!" : `${cs.mistakes} ${cs.mistakes === 1 ? "slip" : "slips"} — try again for 3 stars.`}</p>
            <div className="flex flex-col gap-2">
              <Button variant="soft" onClick={() => setCs(startChat(chat))}>
                Chat again
              </Button>
              <Button href="/talk">Back to chats</Button>
            </div>
          </Card>
        ) : step ? (
          <Card className="sticky bottom-3">
            <p className="mb-2 text-xs text-muted">
              {partnerName(state, learner)} · {meaning({ en: "Pick a reply or type your own", mr: "उत्तर निवडा किंवा टाइप करा" }, lang)}
            </p>
            <div className="flex flex-col gap-2">
              {step.replies.map((r, k) => (
                <button key={r.de} type="button" aria-label={`Reply: ${r.de}`} onClick={() => send({ reply: k })} className="rounded-2xl border border-line bg-white px-4 py-2.5 text-left hover:border-rose">
                  <span className="block text-ink">{r.de}</span>
                  {help ? <span className="block text-xs text-muted">{meaning(r, lang)}</span> : null}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) send({ text });
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Auf Deutsch antworten…"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Type your reply in German"
                className={fieldClass}
              />
              <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-plum text-white disabled:opacity-40">
                <Send size={20} />
              </button>
            </form>
            <div className="mt-2 flex gap-2">
              {UMLAUTS.map((u) => (
                <button key={u} type="button" aria-label={`Insert ${u}`} onClick={() => setText((t) => t + u)} className="rounded-lg border border-line px-3 py-1 font-bold hover:border-rose">
                  {u}
                </button>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function Message({ m, bot, help, lang }: { m: ChatMessage; bot: { name: string; avatar: string }; help: boolean; lang: Lang }) {
  if (m.from === "bot") {
    return (
      <div className="flex items-end gap-2">
        <span className="text-2xl">{bot.avatar}</span>
        <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-line bg-white px-4 py-3">
          <p className="text-xs font-bold text-plum">{bot.name}</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-ink">{m.line.de}</p>
            <Speak text={m.line.de} />
          </div>
          {help ? <p className="mt-0.5 text-sm text-muted">{meaning(m.line, lang)}</p> : null}
        </div>
      </div>
    );
  }
  if (m.from === "me") {
    return (
      <div className={cx("ml-auto max-w-[85%] rounded-3xl rounded-br-md px-4 py-3", m.ok ? "bg-blush" : "bg-bad/10")}>
        <p className={cx("text-right text-xs font-bold", m.ok ? "text-good" : "text-bad")}>{m.ok ? "✓" : "✗"}</p>
        <p className="text-ink">{m.de}</p>
      </div>
    );
  }
  const body =
    m.kind === "why"
      ? meaning(m.why, lang)
      : m.kind === "typo"
        ? `${meaning({ en: "Good! Just check the spelling:", mr: "छान! फक्त स्पेलिंग पाहा:" }, lang)} ${m.expected}`
        : `${meaning({ en: "Try something like:", mr: "उदाहरणार्थ असं म्हणा:" }, lang)} „${m.example.de}“ — ${meaning(m.example, lang)}`;
  return <p className={cx("mx-auto max-w-[92%] rounded-2xl px-4 py-2.5 text-sm text-ink", m.kind === "typo" ? "bg-good/12" : "bg-blush/80")}>💡 {body}</p>;
}
