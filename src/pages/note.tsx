import { useRouter } from "next/router";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Chip, PageHeader, Script, Speak } from "../components/ui";
import { meaning, NOTE_PARTS } from "../core/content/levels";
import { couple, partnerName, useProgress, XP } from "../web/progress";
import { shareText } from "../web/share";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Build a little German love note from pieces, then send it in-app (or share it). */
export default function Note() {
  const router = useRouter();
  const { state, practiced, send, log } = useProgress();
  const linked = couple.isLinked(state);
  const from = state.learner;
  const to = from === 0 ? 1 : 0;
  const [opener, setOpener] = useState(0);
  const [middles, setMiddles] = useState<number[]>([0]);
  const [closer, setCloser] = useState(1);
  const [status, setStatus] = useState("");
  const lang = state.partners[from].lang;

  const signature = closer === 3 ? `\n${state.partners[from].name}` : "";
  const text =
    `${NOTE_PARTS.openers[opener]}\n` +
    `${[...middles].sort((x, y) => x - y).map((i) => cap(NOTE_PARTS.middles[i].de)).join(" ")}\n` +
    `${NOTE_PARTS.closers[closer]}${signature}`;
  const toggle = (i: number) => setMiddles((m) => (m.includes(i) ? (m.length > 1 ? m.filter((x) => x !== i) : m) : [...m, i]));

  const go = async () => {
    if (linked) {
      const r = await send({ kind: "note", text });
      practiced(from, XP.note);
      log("💌", `Sent a love note to ${partnerName(state, 1)}`);
      if (r.delivered) {
        setStatus("Sent to your partner’s app 💌");
        setTimeout(() => router.push("/us"), 900);
      } else {
        await shareText(`💌 Zwei Herzen ♡ — a love note for you:\n${r.link}`);
        setStatus("Shared as a secure link 💌");
      }
      return;
    }
    const r = await shareText(text);
    if (r !== "cancelled") {
      practiced(from, XP.note);
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
