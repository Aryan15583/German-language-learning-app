import { useRouter } from "next/router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Chip, fieldClass, PageHeader, Script, Speak } from "../components/ui";
import { SECRET_PHRASES } from "../core/content/berlin";
import { meaning, NOTE_PARTS, type Word } from "../core/content/levels";
import { suggestPhrases } from "../core/lib/phrases";
import { couple, currentStreak, partnerName, useProgress, XP } from "../web/progress";
import { shareText } from "../web/share";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Build a little German love note from pieces, then send it in-app (or share it). */
export default function Note() {
  const router = useRouter();
  const { state, practiced, send, log, did, addOurWord } = useProgress();
  const linked = couple.isLinked(state);
  const from = state.learner;
  const to = from === 0 ? 1 : 0;
  const [opener, setOpener] = useState(0);
  const [middles, setMiddles] = useState<number[]>([0]);
  const [closer, setCloser] = useState(1);
  const [status, setStatus] = useState("");
  const [extras, setExtras] = useState<Word[]>([]);
  const [feel, setFeel] = useState("");
  const [learned, setLearned] = useState<string[]>([]);
  const streak = currentStreak(state);
  const secrets = SECRET_PHRASES.filter((p) => streak >= p.day);
  const suggestions = suggestPhrases(feel);
  const toggleExtra = (w: Word) => setExtras((x) => (x.some((e) => e.de === w.de) ? x.filter((e) => e.de !== w.de) : [...x, w]));
  const lang = state.partners[from].lang;

  const signature = closer === 3 ? `\n${state.partners[from].name}` : "";
  const text =
    `${NOTE_PARTS.openers[opener]}\n` +
    `${[...[...middles].sort((x, y) => x - y).map((i) => cap(NOTE_PARTS.middles[i].de)), ...extras.map((w) => w.de)].join(" ")}\n` +
    `${NOTE_PARTS.closers[closer]}${signature}`;
  const toggle = (i: number) => setMiddles((m) => (m.includes(i) ? (m.length > 1 ? m.filter((x) => x !== i) : m) : [...m, i]));

  const go = async () => {
    if (linked) {
      const r = await send({ kind: "note", text });
      practiced(from, XP.note);
      log("💌", `Sent a love note to ${partnerName(state, 1)}`);
      if (r.delivered) {
        setStatus("Sent to your partner’s app 💌");
        setTimeout(() => router.push("/messages"), 900);
      } else {
        await shareText(`💌 Zwei Herzen ♡ — a love note for you:\n${r.link}`);
        setStatus("Shared as a secure link 💌");
      }
      return;
    }
    const r = await shareText(text);
    if (r !== "cancelled") {
      practiced(from, XP.note);
      did(from, "note");
      log("💌", "Wrote a love note");
      setStatus(r === "copied" ? "Copied! Paste it into your chat 💬" : "Sent 💌");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader title="" />
        <Script className="text-4xl">Love note 💌</Script>
        <p className="text-muted">
          From {partnerName(state, from)} to {partnerName(state, to)}. Build it, then send it!
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <Section title="Start">
              {NOTE_PARTS.openers.map((o, i) => (
                <Chip key={o} selected={i === opener} onClick={() => setOpener(i)}>
                  {o}
                </Chip>
              ))}
            </Section>
            <Section title="Say something sweet">
              {NOTE_PARTS.middles.map((m, i) => (
                <Chip key={m.de} selected={middles.includes(i)} onClick={() => toggle(i)}>
                  {meaning(m, lang)}
                </Chip>
              ))}
            </Section>
            <Section title="✍️ Write what you feel">
              <div className="w-full">
                <input
                  className={fieldClass}
                  value={feel}
                  onChange={(e) => setFeel(e.target.value)}
                  placeholder="e.g. I miss you so much · मला तुझी आठवण येते"
                  aria-label="Write what you feel"
                />
                {feel.trim() && !suggestions.length ? <p className="mt-2 text-sm text-muted">No match yet — try simpler words like “miss”, “proud”, “sleep well”.</p> : null}
                <div className="mt-2 flex flex-col gap-2">
                  {suggestions.map((w) => {
                    const inNote = extras.some((e) => e.de === w.de);
                    return (
                      <div key={w.de} className="rounded-2xl border border-line bg-surface p-3">
                        <div className="flex items-center gap-2">
                          <p className="flex-1 font-bold text-plum">🇩🇪 {w.de}</p>
                          <Speak text={w.de} />
                        </div>
                        <p className="text-sm text-muted">{meaning(w, lang)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Chip selected={inNote} onClick={() => toggleExtra(w)}>
                            {inNote ? "✓ In my note" : "+ Add to note"}
                          </Chip>
                          <Chip
                            selected={learned.includes(w.de)}
                            onClick={async () => {
                              if (learned.includes(w.de)) return;
                              setLearned([...learned, w.de]);
                              await addOurWord({ de: w.de, en: w.en, mr: w.mr });
                            }}
                          >
                            {learned.includes(w.de) ? "✓ In Our words" : "📖 Learn this phrase"}
                          </Chip>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">Matched from a phrasebook of real German — no AI, nothing leaves your phone.</p>
              </div>
            </Section>
            <Section title={`🔐 Secret phrases (${secrets.length}/${SECRET_PHRASES.length})`}>
              {SECRET_PHRASES.map((p) =>
                streak >= p.day ? (
                  <Chip key={p.de} selected={extras.some((e) => e.de === p.de)} onClick={() => toggleExtra(p)}>
                    {p.de}
                  </Chip>
                ) : (
                  <span key={p.de} className="rounded-full border border-dashed border-line px-3.5 py-1.5 text-sm text-muted">
                    🔒 Day {p.day}
                  </span>
                ),
              )}
            </Section>
            <Section title="End">
              {NOTE_PARTS.closers.map((x, i) => (
                <Chip key={x} selected={i === closer} onClick={() => setCloser(i)}>
                  {x}
                </Chip>
              ))}
            </Section>
          </div>
          <div>
            <Card className="bg-gradient-to-br from-card to-blush">
              <p className="text-xs font-bold uppercase tracking-wider text-rose">Preview</p>
              <p className="mt-2 whitespace-pre-line font-script text-3xl leading-snug text-plum">{text}</p>
            </Card>
            <div className="mt-3 flex items-center gap-2">
              <Speak text={text} />
              <Button full onClick={go}>
                {linked ? `Send to ${state.partners[1].name || "partner"} 💌` : "Send 💌"}
              </Button>
            </div>
            {status ? <p className="mt-3 text-center text-muted">{status}</p> : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 font-bold text-ink">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
