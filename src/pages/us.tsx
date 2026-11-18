import { BookHeart, ChevronRight, Crown, Lock, Mail, MessageCircle, Sparkles, Swords } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell, useUnread } from "../components/AppShell";
import { useFallback } from "../components/Fallback";
import { Button, Card, cx, fieldClass, Script, Spinner } from "../components/ui";
import { heartLevel, isoWeek, weeklyLeader } from "../core/lib/game";
import { CODE_TTL_MS, formatCode } from "../core/lib/link";
import { couple, partnerName, today, useProgress } from "../web/progress";
import { appBaseUrl, shareText } from "../web/share";

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
      <Card className="mt-4">
        <p className="font-bold text-ink">Once you’re linked 💞</p>
        <ul className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li>💬 Private chat with ❤️ reactions</li>
          <li>⚔️ Quiz duels on two phones</li>
          <li>📈 See each other’s streak and progress</li>
          <li>💞 Together XP and one shared journey</li>
          <li>📖 Save sweet messages to your memory book</li>
          <li>🔒 Secrets that open with your streak</li>
        </ul>
      </Card>
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
            Tell your partner this code. They open the app → <b>Us</b> → enter the code.
          </p>
          <Button
            size="lg"
            full
            onClick={async () => {
              const r = await shareText(`💞 Lass uns zusammen Deutsch lernen! Let’s link our Zwei Herzen ♡ app.\n\n1. Open ${appBaseUrl()}\n2. Go to Us → “Enter your partner’s code”\n3. Type: ${formatCode(cpl.code ?? "")}\n\nBis bald in Berlin! 🇩🇪`);
              setNote(r === "copied" ? "Copied — paste it to your partner." : "");
            }}
          >
            Share the invite
          </Button>
          <Button
            variant="soft"
            full
            className="mt-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(formatCode(cpl.code ?? ""));
                setNote("Code copied ✓");
              } catch {
                setNote("Couldn’t copy — just read the code out loud 😊");
              }
            }}
          >
            Copy just the code
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
  const { state, resendHello, relayOn } = useProgress();
  const fallback = useFallback();
  const me = state.partners[0];
  const them = state.partners[1];
  const name = partnerName(state, 1);
  const week = isoWeek(today());
  const mineWeek = me.week.id === week ? me.week.xp : 0;
  const theirWeek = them.week.id === week ? them.week.xp : 0;
  const leader = weeklyLeader(mineWeek, theirWeek);
  const waitingForConfirm = state.couple!.role === "joiner" && !them.remote;
  const hl = heartLevel(them.xp);
  const last = [...state.chat].reverse().find((m) => m.kind !== "system");
  const unread = useUnread();
  const preview = !last
    ? "Say hallo! 👋"
    : last.kind === "duel"
      ? "⚔️ Duel"
      : last.kind === "secret"
        ? "🔒 Secret"
        : last.kind === "note"
          ? `💌 ${last.text}`
          : `${last.from === 0 ? "You: " : ""}${last.text}`;
  const when = last ? new Date(last.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Script className="text-4xl">Us 💞</Script>
      <p className="text-muted">Your private space with {name}.</p>

      {/* The conversation: tap to open the full chat */}
      <Link href="/messages" className="card-premium mt-5 flex items-center gap-3 rounded-[26px] p-4 transition hover:border-rose">
        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-partner text-2xl font-bold text-white">
          {name.slice(0, 1).toUpperCase()}
          {unread ? <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] font-bold text-white ring-2 ring-surface">{unread}</span> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="flex-1 truncate text-lg font-bold text-ink">{name}</span>
            <span className={cx("shrink-0 text-xs", unread ? "font-bold text-rose" : "text-muted")}>{when}</span>
          </span>
          <span className={cx("block truncate text-sm", unread ? "font-semibold text-ink" : "text-muted")}>
            {last?.vanish ? "⏱ " : ""}
            {preview}
          </span>
          <span className="block text-xs text-muted">
            ❤️ Lv {hl.level} {hl.title} · 🔥 {them.remote?.streak ?? 0} days
          </span>
        </span>
        <ChevronRight className="shrink-0 text-muted" size={20} />
      </Link>
      <Button href="/messages" full size="lg" className="mt-3">
        <MessageCircle size={20} /> Open chat
      </Button>
      <Nudge name={name} learnedToday={them.remote?.streakDay === today()} />

      {waitingForConfirm ? (
        <Card className="mt-4 border-rose-soft">
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
          {fallback.view}
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <p className="text-xs text-muted">{name}</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink">
            {leader === "tie" ? "Gleichstand 🤝" : leader === "me" ? (
              <>
                <Crown size={16} className="text-gold" /> You’re ahead
              </>
            ) : (
              `${name} leads 🔥`
            )}
          </p>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink href="/note" icon={<Mail size={18} />} label="Love note" />
          <QuickLink href="/words" icon={<BookHeart size={18} />} label="Our words" />
          <QuickLink href="/quizzes" icon={<Swords size={18} />} label="Duel" />
          <QuickLink href="/memories" icon={<Sparkles size={18} />} label="Memories" />
        </div>
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted">
        <Lock size={14} /> End-to-end encrypted. Chat settings are in the chat — tap {name}’s name at the top.
      </p>
    </div>
  );
}

/** "Remind Shreya to learn": a sweet chat message (it also buzzes her phone if notifications are on). */
function Nudge({ name, learnedToday }: { name: string; learnedToday: boolean }) {
  const { send, state } = useProgress();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "saved">("idle");
  return (
    <div className="card-premium mt-3 flex items-center gap-3 rounded-[26px] p-4">
      <span className="text-3xl">{learnedToday ? "🌟" : "👋"}</span>
      <p className="min-w-0 flex-1 text-sm text-ink">{learnedToday ? `${name} already learned today. Send some love?` : `${name} hasn’t learned yet today.`}</p>
      <Button
        size="sm"
        variant="soft"
        disabled={status !== "idle"}
        onClick={async () => {
          setStatus("sending");
          const text = learnedToday ? "🌟 Ich bin so stolz auf dich! Weiter so ❤️" : "👋 Lass uns heute Deutsch lernen! Nur 5 Minuten — ich warte auf dich ❤️";
          try {
            const r = await send(state.vanish === "off" ? { kind: "msg", text } : { kind: "msg", text, vanish: state.vanish });
            setStatus(r.delivered ? "sent" : "saved");
          } catch {
            setStatus("saved");
          }
        }}
      >
        {status === "sent" ? "Sent ❤️" : status === "saved" ? "In chat 💬" : status === "sending" ? "…" : learnedToday ? "Send love" : `Nudge ${name}`}
      </Button>
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

