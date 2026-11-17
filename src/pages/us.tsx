import { BookHeart, Crown, Lock, Mail, RefreshCw, Send, Sparkles, Swords, Timer } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { AppShell, markChatSeen } from "../components/AppShell";
import { useFallback } from "../components/Fallback";
import { Button, Card, Chip, cx, fieldClass, Script, Speak, Spinner } from "../components/ui";
import { findTopic } from "../core/content/levels";
import { heartLevel, isoWeek, weeklyLeader } from "../core/lib/game";
import { CODE_TTL_MS, formatCode } from "../core/lib/link";
import { couple, currentStreak, partnerName, today, useProgress, type ChatItem } from "../web/progress";
import { appBaseUrl, shareText } from "../web/share";

const VANISH_OPTIONS: { id: "off" | "seen" | "1d" | "30d"; label: string; hint: string }[] = [
  { id: "off", label: "Off", hint: "" },
  { id: "seen", label: "👁 After seen", hint: "Deleted on both phones as soon as your partner has read it and leaves the chat." },
  { id: "1d", label: "1 day", hint: "Deleted on both phones 24 hours after sending." },
  { id: "30d", label: "30 days", hint: "Deleted on both phones 30 days after sending." },
];

const QUICK = ["Guten Morgen, Schatz! ☀️", "Ich vermisse dich 💞", "Ich liebe dich", "Schlaf gut! 🌙", "Ich bin stolz auf dich", "Du fehlst mir"];

/** Our journey: link phones with a code, then chat, battle and share. */
export default function Us() {
  const { state } = useProgress();
  return <AppShell>{!state.couple ? <LinkSetup /> : state.couple.status === "invited" ? <WaitingForPartner /> : <CoupleChat />}</AppShell>;
}

function LinkSetup() {
  const { state, createCode, joinCode, relayOn, accountMode } = useProgress();
  const [busy, setBusy] = useState<"" | "create" | "join">("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const fallback = useFallback();

  return (
    <div className="mx-auto max-w-3xl">
      <Script className="text-4xl">Our Journey 💞</Script>
      <p className="text-muted">Link your phones to chat, duel and see each other’s progress — from Mumbai to the USA and anywhere else.</p>
      {!accountMode && state.partners[1].name ? (
        <p className="mt-2 rounded-2xl bg-blush/70 p-3 text-sm text-ink">
          You two share this device right now. Linking is for when each of you has your own phone.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card className="bg-blush/60">
          <p className="text-lg font-bold text-ink">1 · Get your code</p>
          <p className="my-2 text-muted">Make a 6-character code and tell it to your partner.</p>
          {busy === "create" ? (
            <Spinner />
          ) : (
            <Button
              full
              onClick={async () => {
                setBusy("create");
                await createCode();
                setBusy("");
              }}
            >
              <Sparkles size={18} /> Get my partner code
            </Button>
          )}
        </Card>
        <Card>
          <p className="text-lg font-bold text-ink">2 · Or enter your partner’s code</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (code.replace(/[\s-]/g, "").length !== 6) return;
              setBusy("join");
              const r = await joinCode(code);
              setBusy("");
              if (!r.ok) setError(r.error);
              else fallback.handle(r.result);
            }}
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="K7M-2QX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={8}
              aria-label="Partner code"
              className={cx(fieldClass, "my-3 text-center text-2xl font-extrabold tracking-[0.3em]", error && "border-bad")}
            />
            {error ? (
              <p role="alert" className="mb-2 text-bad">
                {error}
              </p>
            ) : null}
            {busy === "join" ? (
              <Spinner />
            ) : (
              <Button type="submit" full disabled={code.replace(/[\s-]/g, "").length !== 6}>
                💞 Link with my partner
              </Button>
            )}
          </form>
        </Card>
      </div>
      {fallback.view}
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted">
        <Lock size={14} /> End-to-end encrypted.{" "}
        {relayOn ? "Messages arrive inside the app; the mailbox only ever sees scrambled data." : "Messages travel as secure links you send each other."}
      </p>
    </div>
  );
}

function WaitingForPartner() {
  const { state, unlink, relayOn } = useProgress();
  const cpl = state.couple!;
  const [now] = useState(() => Date.now());
  const expired = couple.codeExpired(cpl.since, now);
  const hoursLeft = Math.max(0, Math.ceil((cpl.since + CODE_TTL_MS - now) / 3600e3));
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto max-w-md text-center">
      <Script className="text-4xl">Your partner code</Script>
      <Card className="mt-5 py-8">
        <p aria-label={`Code ${cpl.code}`} className="text-5xl font-extrabold tracking-[0.2em] text-plum">
          {cpl.code ? formatCode(cpl.code) : "——"}
        </p>
        <p className="mt-2 text-muted">{expired ? "This code expired." : `Valid for ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"}`}</p>
      </Card>
      {expired ? (
        <Button size="lg" full className="mt-5" onClick={unlink}>
          Make a new code
        </Button>
      ) : (
        <>
          <p className="my-4 text-ink">
            Tell your partner this code. They open the app → <b>Couple</b> → enter the code.
          </p>
          <Button
            size="lg"
            full
            onClick={async () => {
              const r = await shareText(`💞 Let’s link our Zwei Herzen ♡ app!\nMy code: ${formatCode(cpl.code ?? "")}\n${appBaseUrl()}`);
              setNote(r === "copied" ? "Copied — paste it to your partner." : "");
            }}
          >
            Share the code
          </Button>
          {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
          <p className="mt-5 flex items-center justify-center gap-2 text-muted">
            {relayOn ? <span className="h-3 w-3 animate-ping rounded-full bg-rose" /> : null}
            {relayOn ? "Waiting for your partner… this links by itself." : "When your partner sends you their hello link, open it."}
          </p>
        </>
      )}
      <button type="button" onClick={unlink} className="mt-6 text-sm text-muted underline">
        Cancel
      </button>
    </div>
  );
}

function CoupleChat() {
  const router = useRouter();
  const { state, send, resendHello, relayOn, syncStatus, syncNow, unlink, setVanish, viewMessages, leaveChat } = useProgress();
  const [text, setText] = useState("");
  const [secret, setSecret] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const fallback = useFallback();
  const endRef = useRef<HTMLDivElement>(null);
  // A clock for the "23 h left" labels (ticks every minute).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const me = state.partners[0];
  const them = state.partners[1];
  const myStreak = currentStreak(state);
  const week = isoWeek(today());
  const mineWeek = me.week.id === week ? me.week.xp : 0;
  const theirWeek = them.week.id === week ? them.week.xp : 0;
  const leader = weeklyLeader(mineWeek, theirWeek);
  const waitingForConfirm = state.couple!.role === "joiner" && !them.remote;
  const hl = heartLevel(them.xp);

  useEffect(() => {
    markChatSeen();
    endRef.current?.scrollIntoView({ block: "end" });
    // Reading the chat starts the "after seen" countdown (and tells my partner's phone).
    if (document.visibilityState === "visible") viewMessages();
  }, [state.chat.length]); // eslint-disable-line react-hooks/exhaustive-deps -- run when messages change

  // Leaving the chat (or hiding the app): "after seen" messages I've read are gone.
  useEffect(() => {
    const onHide = () => (document.visibilityState === "hidden" ? leaveChat() : viewMessages());
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", leaveChat);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", leaveChat);
      leaveChat();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per visit

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const r = await send(secret ? { kind: "secret", text: t, unlockAt: 7 } : state.vanish === "off" ? { kind: "msg", text: t } : { kind: "msg", text: t, vanish: state.vanish });
    setSending(false);
    setText("");
    setSecret(false);
    fallback.handle(r);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="order-2 min-w-0 lg:order-1">
        <Card className="flex min-h-[60vh] flex-col p-0">
          <div className="flex items-center gap-3 border-b border-line/60 px-5 py-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-partner text-lg font-bold text-white">{partnerName(state, 1).slice(0, 1)}</span>
            <div className="flex-1">
              <p className="font-bold text-ink">{partnerName(state, 1)}</p>
              <p className="text-xs text-muted">
                ❤️ Lv {hl.level} {hl.title} · 🔥 {them.remote?.streak ?? 0} days
              </p>
            </div>
            <button type="button" onClick={syncNow} aria-label="Check for new messages" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-blush">
              <RefreshCw size={14} /> {syncStatus === "ok" ? "🟢 live" : syncStatus === "offline" ? "🟠 offline" : "🔗 links"}
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
            {state.chat.length === 0 ? <p className="py-8 text-center text-muted">Say hallo! Every message also shares your progress for the weekly battle.</p> : null}
            {state.chat.map((m) => (
              <ChatRow key={m.id + m.from} m={m} myStreak={myStreak} now={now} />
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line/60 p-4">
            {fallback.view}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK.map((q) => (
                <Chip key={q} className="shrink-0" onClick={() => setText(q)}>
                  {q}
                </Chip>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                maxLength={1000}
                aria-label="Message"
                placeholder={secret ? "🔒 A secret (opens at their 7-day streak)…" : state.vanish !== "off" ? "⏱ Disappearing…" : "Auf Deutsch, bitte… 💬"}
                className={cx(fieldClass, "max-h-32 resize-none", secret && "border-rose")}
              />
              {sending ? (
                <Spinner />
              ) : (
                <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-plum text-white shadow-soft disabled:opacity-40">
                  <Send size={20} />
                </button>
              )}
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-2xl bg-blush/60 px-2.5 py-2" role="radiogroup" aria-label="Disappearing messages">
              <span className="mr-1 flex items-center gap-1 text-xs font-semibold text-plum">
                <Timer size={14} /> Disappearing:
              </span>
              {VANISH_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={state.vanish === o.id}
                  onClick={() => setVanish(o.id)}
                  className={cx("rounded-full px-2.5 py-1 text-xs font-semibold transition", state.vanish === o.id ? "btn-primary text-white" : "text-ink hover:bg-surface")}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {state.vanish !== "off" && !secret ? <p className="mt-1 text-xs text-muted">{VANISH_OPTIONS.find((o) => o.id === state.vanish)!.hint}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip selected={secret} onClick={() => setSecret(!secret)}>
                🔒 Secret
              </Chip>
              <Chip onClick={() => router.push("/note")}>💌 Love note</Chip>
              <Chip onClick={() => router.push("/words")}>📖 Our words</Chip>
              <Chip onClick={() => router.push("/quizzes")}>⚔️ Duel</Chip>
            </div>
          </div>
        </Card>
      </div>

      <aside className="order-1 flex flex-col gap-4 lg:order-2">
        {waitingForConfirm ? (
          <Card className="border-rose-soft">
            <p className="font-bold">Almost there 💫</p>
            <p className="my-1.5 text-sm text-muted">
              {relayOn ? "Your hello is on its way. You’re linked as soon as your partner’s app picks it up." : "Send your hello link so your partner’s phone links too."}
            </p>
            {!relayOn ? (
              <Button
                onClick={async () => {
                  const r = await resendHello();
                  if (r) fallback.handle(r);
                }}
              >
                Send hello link
              </Button>
            ) : null}
          </Card>
        ) : null}
        <Card>
          <p className="flex items-center gap-2 font-bold text-ink">
            <Swords size={18} className="text-plum" /> This week’s battle
          </p>
          <div className="mt-3 flex items-end justify-around text-center">
            <div>
              <p className="text-3xl font-extrabold text-plum">{mineWeek}</p>
              <p className="text-xs text-muted">You</p>
            </div>
            <p className="pb-4 text-sm text-muted">vs</p>
            <div>
              <p className="text-3xl font-extrabold text-partner">{theirWeek}</p>
              <p className="text-xs text-muted">{partnerName(state, 1)}</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink">
            {leader === "tie" ? "Gleichstand 🤝" : leader === "me" ? (
              <>
                <Crown size={16} className="text-gold" /> You’re ahead
              </>
            ) : (
              `${partnerName(state, 1)} leads 🔥`
            )}
          </p>
        </Card>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          <QuickLink href="/note" icon={<Mail size={18} />} label="Love note" />
          <QuickLink href="/words" icon={<BookHeart size={18} />} label="Our words" />
          <QuickLink href="/quizzes" icon={<Swords size={18} />} label="Duel" />
        </div>
        <button type="button" onClick={() => setConfirmUnlink(true)} className="text-xs text-muted underline">
          Unlink phones
        </button>
        {confirmUnlink ? (
          <Card>
            <p className="text-sm text-muted">Unlinking keeps your chat history here, but you’ll need a new code to link again.</p>
            <div className="mt-2 flex gap-2">
              <Button variant="soft" onClick={unlink}>
                Unlink
              </Button>
              <Button onClick={() => setConfirmUnlink(false)}>Keep linked</Button>
            </div>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Button href={href} variant="soft" className="!justify-start !rounded-2xl">
      {icon} {label}
    </Button>
  );
}

function ChatRow({ m, myStreak, now }: { m: ChatItem; myStreak: number; now: number }) {
  const { state } = useProgress();
  if (m.kind === "system") return <p className="py-1 text-center text-xs text-muted">{m.text}</p>;
  const mine = m.from === 0;
  const bubble = cx("max-w-[86%] rounded-3xl px-4 py-3", mine ? "ml-auto rounded-br-md bg-blush" : "mr-auto rounded-bl-md bg-partner-soft");
  const time = new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (m.kind === "duel") {
    const d = state.remoteDuels.find((x) => x.id === m.duelId);
    const status = d ? couple.duelStatus(d) : "their-turn";
    const topic = d ? (d.topic.startsWith("mix-") ? `${d.topic.slice(4)} mix` : (findTopic(d.topic)?.title ?? d.topic)) : "Duel";
    const label = {
      "your-turn": "Your turn! ⚔️",
      "their-turn": `Waiting for ${partnerName(state, 1)}…`,
      won: "You won 🏆",
      lost: `${partnerName(state, 1)} won 💪`,
      tie: "Tie 🤝",
    }[status];
    return (
      <div className={bubble}>
        <p className="font-bold">⚔️ Remote duel · {topic}</p>
        {d && d.scores[0] !== null && d.scores[1] !== null ? (
          <p>
            {d.scores[0]} : {d.scores[1]}
          </p>
        ) : null}
        <p className="text-sm text-muted">{label}</p>
        {status === "your-turn" ? (
          <Button size="sm" className="mt-2" href={`/remote-duel?id=${m.duelId}`}>
            Play now
          </Button>
        ) : null}
      </div>
    );
  }

  if (m.kind === "secret" && !couple.secretOpen(m, myStreak)) {
    return (
      <div className={cx(bubble, "border border-dashed border-rose")}>
        <p className="font-bold">🔒 A secret from {partnerName(state, 1)}</p>
        <p className="text-sm text-muted">
          Opens at a {m.unlockAt}-day streak · you’re at {myStreak} 🔥
        </p>
      </div>
    );
  }

  return (
    <div className={bubble}>
      {m.kind === "secret" ? <p className="text-xs font-bold text-rose">✨ Secret{mine ? " (sent)" : " unlocked"}</p> : null}
      {m.kind === "note" ? <p className="text-xs font-bold text-rose">💌 Love note</p> : null}
      {m.kind === "word" ? <p className="text-xs font-bold text-rose">📖 New shared word</p> : null}
      <div className="flex items-center gap-2">
        <p className={cx("flex-1 whitespace-pre-wrap break-words text-ink", m.kind === "note" && "font-script text-2xl")}>{m.text}</p>
        {m.kind !== "word" ? <Speak text={m.text} /> : null}
      </div>
      <p className={cx("mt-0.5 text-[11px] text-muted", mine && "text-right")}>
        {time}
        {m.vanish ? <span className="ml-2 font-semibold text-plum">{couple.vanishLabel(m, now)}</span> : null}
      </p>
    </div>
  );
}
