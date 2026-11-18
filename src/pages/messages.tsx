import { ArrowLeft, Bell, BookHeart, ShieldCheck, ChevronRight, Lock, Mail, Plus, RefreshCw, Send, Swords, Timer, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChatRow, QUICK, VANISH_OPTIONS } from "../components/ChatRow";
import { useFallback } from "../components/Fallback";
import { Button, Chip, cx, Spinner, Toggle } from "../components/ui";
import { safetyCode } from "../core/lib/pair";
import { heartLevel } from "../core/lib/game";
import { couple, currentStreak, partnerName, useProgress, type ChatItem } from "../web/progress";
import { markChatSeen } from "../components/AppShell";
import { NotifyCard } from "../components/NotifyCard";
import { notifyStatus } from "../web/notify";
import { usePrefs } from "../web/prefs";

/** The couple chat on its own full screen, like a messenger. Tap the name for chat settings. */
export default function Messages() {
  const router = useRouter();
  const { state } = useProgress();
  const linked = couple.isLinked(state);
  useEffect(() => {
    if (!linked) router.replace("/us");
  }, [linked, router]);
  if (!linked) return null;
  const info = router.query.info === "1";
  return info ? <ChatInfo onBack={() => router.back()} /> : <Chat onInfo={() => router.push("/messages?info=1")} />;
}

function Avatar({ name, size = "h-10 w-10 text-base" }: { name: string; size?: string }) {
  return <span className={cx("grid shrink-0 place-items-center rounded-full bg-partner font-bold text-white", size)}>{name.slice(0, 1).toUpperCase()}</span>;
}

function Chat({ onInfo }: { onInfo: () => void }) {
  const { state, send, syncStatus, syncNow, viewMessages, leaveChat, archive } = useProgress();
  const [text, setText] = useState("");
  const [secret, setSecret] = useState(false);
  const [sending, setSending] = useState(false);
  const [tray, setTray] = useState(false);
  const fallback = useFallback();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // A clock for the "23 h left" labels (ticks every minute).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  // Long chats stay fast: show the newest messages, and load older ones on request.
  const PAGE = 60;
  const [shown, setShown] = useState(PAGE);
  const [older, setOlder] = useState<ChatItem[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const recent = state.chat.slice(-shown);
  const recentIds = new Set(state.chat.map((m) => m.id));
  const visible = [...older.filter((m) => !recentIds.has(m.id) && !couple.isExpired(m, now)), ...recent];
  const canLoadMore = shown < state.chat.length || (!!archive && !noMore && state.chat.length > 0);
  const loadEarlier = async () => {
    if (shown < state.chat.length) return setShown(shown + PAGE);
    if (!archive || loadingOlder) return;
    setLoadingOlder(true);
    const oldestAt = (older[0] ?? state.chat[0])?.at ?? Date.now();
    const page = await archive.before(oldestAt, PAGE).catch(() => []);
    setOlder((o) => [...page, ...o]);
    if (page.length < PAGE) setNoMore(true);
    setLoadingOlder(false);
  };
  const them = state.partners[1];
  const name = partnerName(state, 1);
  const myStreak = currentStreak(state);
  const vanish = VANISH_OPTIONS.find((o) => o.id === state.vanish)!;
  const [prefs] = usePrefs();
  // Ask once (gently) about notifications.
  const [askNotify, setAskNotify] = useState(() => {
    try {
      return notifyStatus() === "off" && window.localStorage.getItem("zh-notify-asked") !== "1";
    } catch {
      return false;
    }
  });
  const dismissNotify = () => {
    setAskNotify(false);
    try {
      window.localStorage.setItem("zh-notify-asked", "1");
    } catch {
      // fine
    }
  };

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

  useEffect(() => {
    if (!tray) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTray(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tray]);

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
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col bg-surface lg:border-x lg:border-line/60">
      {/* Header: back, then the name — tap it for chat settings */}
      <header className="glass sticky top-0 z-20 flex items-center gap-1 border-b border-line/60 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link href="/us" aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-blush">
          <ArrowLeft size={22} />
        </Link>
        <button type="button" onClick={onInfo} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1.5 py-1 text-left hover:bg-blush/60" aria-label={`${name} — chat settings`}>
          <Avatar name={name} />
          <span className="min-w-0">
            <span className="block truncate font-bold text-ink">{name}</span>
            <span className="block truncate text-xs text-muted">
              {state.vanish !== "off" ? (
                <span className="font-semibold text-plum">
                  <Timer size={12} className="mr-0.5 inline" /> {vanish.label}
                </span>
              ) : (
                <>🔥 {them.remote?.streak ?? 0} days · tap for settings</>
              )}
            </span>
          </span>
        </button>
        <button type="button" onClick={syncNow} aria-label="Check for new messages" className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted hover:bg-blush">
          <RefreshCw size={14} /> {syncStatus === "ok" ? "🟢" : syncStatus === "offline" ? "🟠" : "🔗"}
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {askNotify ? (
          <div className="mx-auto mb-3 flex max-w-md items-center gap-3 rounded-3xl bg-card p-3 shadow-card ring-1 ring-line/60">
            <span className="text-2xl">🔔</span>
            <p className="min-w-0 flex-1 text-sm text-ink">Get notified when {name} writes?</p>
            <Button size="sm" onClick={onInfo}>
              Turn on
            </Button>
            <button type="button" aria-label="Not now" onClick={dismissNotify} className="rounded-full p-1.5 text-muted hover:bg-blush">
              <X size={16} />
            </button>
          </div>
        ) : null}
        <p className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-blush/70 px-3 py-1 text-[11px] text-muted">
          <Lock size={11} /> End-to-end encrypted · only you two can read this
        </p>
        {state.chat.length === 0 ? <p className="py-8 text-center text-muted">Say hallo! 👋 Every message also shares your progress for the weekly battle.</p> : null}
        {canLoadMore ? (
          <div className="py-2 text-center">
            <button type="button" onClick={loadEarlier} disabled={loadingOlder} className="rounded-full bg-blush px-4 py-1.5 text-xs font-semibold text-plum hover:bg-rose-soft/60 disabled:opacity-50">
              {loadingOlder ? "Loading…" : "↑ Show earlier messages"}
            </button>
          </div>
        ) : state.chat.length > PAGE ? (
          <p className="py-2 text-center text-xs text-muted">That’s the very beginning of your chat 💞</p>
        ) : null}
        {visible.map((m) => (
          <ChatRow key={m.id + m.from} m={m} myStreak={myStreak} now={now} />
        ))}
        <div ref={endRef} />
      </main>

      {/* Composer */}
      <footer className="glass sticky bottom-0 z-20 border-t border-line/60 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {fallback.view}
        {prefs.quickPhrases ? (
        <div
          className="desk-scroll mb-2 flex gap-1.5 overflow-x-auto pb-0.5"
          onWheel={(e) => {
            // Mouse wheel scrolls the phrases sideways on computers.
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          {QUICK.map((q) => (
            <Chip key={q} className="shrink-0 !py-1 text-sm" onClick={() => setText(q)}>
              {q}
            </Chip>
          ))}
        </div>
        ) : null}
        {secret ? (
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-rose">
            🔒 Secret message — opens when {name} reaches a 7-day streak
            <button type="button" aria-label="Cancel secret" onClick={() => setSecret(false)} className="ml-auto rounded-full p-1 hover:bg-blush">
              <X size={14} />
            </button>
          </p>
        ) : state.vanish !== "off" ? (
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-plum">
            <Timer size={13} /> Disappearing: {vanish.label}
          </p>
        ) : null}
        <form onSubmit={submit} className="relative flex items-end gap-2">
          {tray ? (
            <>
              <button type="button" aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={() => setTray(false)} />
              <div role="menu" aria-label="More options" className="desk-scroll absolute bottom-[calc(100%+0.6rem)] left-0 z-40 max-h-[min(26rem,60vh)] w-[min(19rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-3xl bg-card p-1.5 shadow-soft ring-1 ring-line/70 anim-fade-up">
                <MenuItem
                  icon="🔒"
                  title={secret ? "Secret is on" : "Secret message"}
                  sub={`Opens when ${name} hits a 7-day streak`}
                  active={secret}
                  onClick={() => {
                    setSecret(!secret);
                    setTray(false);
                    inputRef.current?.focus();
                  }}
                />
                <MenuItem icon="⏱️" title="Disappearing messages" sub={state.vanish === "off" ? "Off" : vanish.label} onClick={() => { setTray(false); onInfo(); }} />
                <MenuItem icon="💌" title="Love note" sub="A pretty note in German" href="/note" />
                <MenuItem icon="📖" title="Share a word" sub="Add to your shared words" href="/words" />
                <MenuItem icon="⚔️" title="Quiz duel" sub={`Challenge ${name}`} href="/quizzes" />
                <MenuItem icon="📸" title="Memory book" sub="Your saved moments" href="/memories" />
              </div>
            </>
          ) : null}
          <button
            type="button"
            aria-label={tray ? "Close menu" : "More: secret, love note, words, duel"}
            aria-haspopup="menu"
            aria-expanded={tray}
            onClick={() => setTray(!tray)}
            className={cx(
              "relative z-40 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-card text-plum shadow-card transition duration-300 hover:bg-blush active:scale-95",
              (tray || secret) && "border-rose bg-blush",
            )}
          >
            <Plus size={22} className={cx("transition-transform duration-300", tray && "rotate-45")} />
          </button>
          <textarea
            ref={inputRef}
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
            placeholder={secret ? "🔒 A secret…" : state.vanish !== "off" ? "⏱ Disappearing message…" : "Auf Deutsch, bitte… 💬"}
            className={cx(
              "max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-line bg-card px-4 py-3 text-ink outline-none placeholder:text-muted/80 focus:border-rose",
              secret && "border-rose",
            )}
          />
          {sending ? (
            <span className="grid h-12 w-12 place-items-center">
              <Spinner />
            </span>
          ) : (
            <button type="submit" aria-label="Send" disabled={!text.trim()} className="btn-primary grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-soft transition active:scale-95 disabled:opacity-40">
              <Send size={20} />
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

function MenuItem({ icon, title, sub, onClick, href, active }: { icon: string; title: string; sub: string; onClick?: () => void; href?: string; active?: boolean }) {
  const cls = cx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-blush", active && "bg-blush");
  const body = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{sub}</span>
      </span>
      {active ? <span className="text-xs font-bold text-rose">ON</span> : null}
    </>
  );
  return href ? (
    <Link href={href} role="menuitem" className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" role={active === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={active} onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** Chat settings, like a messenger's contact page: disappearing messages, shortcuts, unlink. */
function ChatInfo({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { state, setVanish, unlink, relayOn, syncStatus } = useProgress();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [prefs, setPrefs] = usePrefs();
  const them = state.partners[1];
  const name = partnerName(state, 1);
  const hl = heartLevel(them.xp);
  const since = state.couple?.since ? new Date(state.couple.since).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : null;
  const media = state.chat.filter((m) => m.kind === "note").length;
  const secrets = state.chat.filter((m) => m.kind === "secret").length;

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-surface pb-10">
      <header className="glass sticky top-0 z-20 flex items-center gap-2 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Back to chat" className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-blush">
          <ArrowLeft size={22} />
        </button>
        <p className="font-bold text-ink">Chat settings</p>
      </header>

      <div className="flex flex-col items-center px-4 pt-4 text-center anim-fade-up">
        <Avatar name={name} size="h-24 w-24 text-4xl shadow-soft" />
        <h1 className="mt-3 font-script text-4xl text-plum">{name}</h1>
        <p className="text-sm text-muted">
          ❤️ Lv {hl.level} {hl.title} · 🔥 {them.remote?.streak ?? 0} days · {them.remote?.wordsKnown ?? 0} words
        </p>
        {since ? <p className="mt-1 text-xs text-muted">Linked since {since} 💞</p> : null}
        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          <QuickAction icon={<Mail size={20} />} label="Love note" href="/note" />
          <QuickAction icon={<Swords size={20} />} label="Duel" href="/quizzes" />
          <QuickAction icon={<BookHeart size={20} />} label="Memories" href="/memories" />
        </div>
      </div>

      {state.couple?.proto !== 2 ? (
        <section className="mx-4 mt-5 rounded-3xl bg-blush p-4 ring-1 ring-rose-soft">
          <p className="font-bold text-ink">🔒 Security upgrade available</p>
          <p className="mt-1 text-sm text-muted">
            You linked before the safer pairing existed. Re-link once to get it: tap “Unlink phones” below, then make a new code on one phone and type it on the other. Your chat history stays.
          </p>
        </section>
      ) : null}

      <Section title="Notifications" icon={<Bell size={16} />}>
        <div className="px-4 pb-2 pt-1">
          <NotifyCard compact />
          <Toggle on={prefs.notifyPreview} onChange={(on) => setPrefs({ notifyPreview: on })} title="Show message text" hint="Off: notifications only say “New message 💌”." />
        </div>
      </Section>

      <Section title="Chat">
        <div className="px-4 pb-2">
          <Toggle on={prefs.quickPhrases} onChange={(on) => setPrefs({ quickPhrases: on })} title="Quick phrases" hint="Little German phrases above the message box." />
        </div>
      </Section>

      {state.couple?.proto === 2 ? (
        <Section title="Safety code" icon={<ShieldCheck size={16} />}>
          <p className="px-4 text-sm text-muted">Compare this with {name}’s phone (in person or on a call). If both show the same numbers, nobody could have listened in when you linked.</p>
          <p className="px-4 pb-4 pt-2 text-center font-mono text-2xl font-bold tracking-wider text-plum" aria-label="Safety code">
            {safetyCode(state.couple.key)}
          </p>
        </Section>
      ) : null}

      <Section title="Disappearing messages" icon={<Timer size={16} />}>
        <p className="px-4 pb-2 text-sm text-muted">New messages you send disappear from both phones after the time you choose.</p>
        <div role="radiogroup" aria-label="Disappearing messages">
          {VANISH_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={state.vanish === o.id}
              onClick={() => setVanish(o.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blush/60"
            >
              <span className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", state.vanish === o.id ? "border-plum" : "border-line")}>
                {state.vanish === o.id ? <span className="h-2.5 w-2.5 rounded-full bg-plum" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{o.label}</span>
                {o.hint ? <span className="block text-xs text-muted">{o.hint}</span> : <span className="block text-xs text-muted">Messages stay until you delete the chat.</span>}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Shared with each other">
        <Row href="/words" emoji="📖" title="Our words" detail={`${state.customWords.length} words`} />
        <Row href="/memories" emoji="📸" title="Memory book" detail={`${state.memories.length} moments`} />
        <Row href="/note" emoji="💌" title="Love notes" detail={`${media} in this chat`} />
        <Row href="/goals" emoji="🔐" title="Secrets" detail={`${secrets} sent or received · open with your streak`} />
      </Section>

      <Section title="Privacy" icon={<Lock size={16} />}>
        <p className="px-4 pb-3 text-sm text-muted">
          Messages are end-to-end encrypted on your phones. {relayOn ? "The mailbox only ever sees scrambled data." : "They travel as secure links you send each other."} Status:{" "}
          {syncStatus === "ok" ? "🟢 live" : syncStatus === "offline" ? "🟠 offline — will retry" : "🔗 links"}.
        </p>
      </Section>

      <div className="mt-4 px-4">
        {confirmUnlink ? (
          <div className="card-premium rounded-3xl p-4">
            <p className="text-sm text-muted">Unlinking keeps your chat history on this phone, but you’ll need a new code to link again.</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="soft"
                onClick={() => {
                  unlink();
                  router.replace("/us");
                }}
              >
                Unlink
              </Button>
              <Button onClick={() => setConfirmUnlink(false)}>Keep linked</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmUnlink(true)} className="w-full rounded-3xl px-4 py-3 text-left font-semibold text-bad hover:bg-blush/60">
            Unlink phones
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-4 mt-5 overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-line/50">
      <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-sm font-bold text-plum">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ href, emoji, title, detail }: { href: string; emoji: string; title: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-blush/60">
      <span className="text-xl">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{detail}</span>
      </span>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}

function QuickAction({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 rounded-2xl bg-card py-3 text-xs font-semibold text-plum shadow-card ring-1 ring-line/50 hover:bg-blush">
      {icon}
      {label}
    </Link>
  );
}
