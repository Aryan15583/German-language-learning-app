import { ChevronRight, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { InstallCard } from "../components/InstallCard";
import { useTheme, type ThemePref } from "../web/theme";
import { LangPicker } from "../components/pickers";
import { Button, Card, Chip, fieldClass, ProgressBar, Script, Spinner } from "../components/ui";
import { LEVELS } from "../core/content/levels";
import { ACHIEVEMENTS, earnedAchievements, heartLevel } from "../core/lib/game";
import { CHAT_LIMITS, formatMB, type ArchiveStats } from "../core/lib/archive";
import { useAccount } from "../web/account";
import { couple, currentStreak, partnerName, useProgress, type PartnerIndex } from "../web/progress";

/** Profile & settings, kept out of the way of learning. */
export default function Profile() {
  const router = useRouter();
  const { state, reset, accountMode, setLang } = useProgress();
  const who = state.learner;
  const p = state.partners[who];
  const hearts = heartLevel(p.xp);
  const earned = earnedAchievements(couple.achievementContext(state, who, currentStreak(state)));
  const [confirmReset, setConfirmReset] = useState(false);
  const people: PartnerIndex[] = accountMode || couple.isLinked(state) ? [0] : [0, 1];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Card className="flex flex-col items-center bg-gradient-to-br from-card to-blush py-7 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-plum text-3xl font-bold text-white shadow-soft">{partnerName(state, who).slice(0, 1).toUpperCase()}</span>
          <Script as="h1" className="mt-3 text-4xl">
            {partnerName(state, who)}
          </Script>
          <p className="text-muted">
            {LEVELS[p.unlocked].id} · ❤️ Lv {hearts.level} {hearts.title} · {p.xp} XP
          </p>
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row href="/progress" emoji="📈" title="My progress" detail="Streak, XP and words, day by day" />
          <Row href="/memories" emoji="📖" title="Memory book" detail={`${state.memories.length} saved moments`} />
          <Row href="/achievements" emoji="🏅" title="My badges" detail={`${earned.length} of ${ACHIEVEMENTS.length}`} />
          <Row href="/placement" emoji="🧭" title="Find my level" detail="A short test that puts you in the right place" />
          <Row href="/setup" emoji="✏️" title="Change name or level" detail="Back to the start form" />
          <Row href="/goals" emoji="🎯" title="Couple goals" detail="Targets to chase together" />
        </div>

        <InstallCard />
        <Appearance />
        <ChatStorage />

        <Section title="My language 🌐">
          {people.map((i) => (
            <div key={i} className="my-2 flex flex-wrap items-center gap-3">
              {people.length > 1 ? <span className="min-w-20 font-semibold">{partnerName(state, i)}</span> : null}
              <LangPicker value={state.partners[i].lang} onChange={(l) => setLang(i, l)} />
            </div>
          ))}
          <p className="mt-2 text-sm text-muted">Meanings and help appear in this language.</p>
        </Section>

        {accountMode ? <AccountCard /> : null}
        <PinSettings />

        <Section title="About">
          <p className="text-sm text-muted">
            Zwei Herzen ♡ Until Berlin — learning German together, from A1 to C2. Your progress stays on your device{accountMode ? " and in your encrypted backup" : ""}; messages
            between you two are end-to-end encrypted.
          </p>
        </Section>

        {accountMode ? null : (
          <div className="mt-6 text-center">
            <button type="button" className="text-sm text-muted underline" onClick={() => setConfirmReset(true)}>
              Start over (erase everything)
            </button>
            {confirmReset ? (
              <Card className="mt-3">
                <p className="text-sm text-muted">This erases all names and progress on this device.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button
                    variant="soft"
                    onClick={() => {
                      reset();
                      router.push("/");
                    }}
                  >
                    Erase
                  </Button>
                  <Button onClick={() => setConfirmReset(false)}>Keep everything</Button>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ href, emoji, title, detail }: { href: string; emoji: string; title: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-3xl border border-line/70 bg-card/90 p-4 shadow-card transition hover:border-rose">
      <span className="text-3xl">{emoji}</span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </span>
      <ChevronRight className="text-muted" />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mt-4">
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function PinSettings() {
  const { state, setPin, accountMode } = useProgress();
  const people: PartnerIndex[] = couple.isLinked(state) || accountMode ? [0] : [0, 1];
  const [editing, setEditing] = useState<PartnerIndex | null>(null);
  const [pin, setPinText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  return (
    <Section title="Privacy 🔐">
      {people.map((i) => (
        <div key={i} className="my-2 flex flex-wrap items-center gap-2">
          <span className="min-w-20 font-semibold">{partnerName(state, i)}</span>
          <span className="flex-1 text-sm text-muted">{state.partners[i].pin ? "PIN on 🔒" : "No PIN"}</span>
          <Chip onClick={() => setEditing(i)}>{state.partners[i].pin ? "Change" : "Set PIN"}</Chip>
          {state.partners[i].pin ? (
            <Chip
              onClick={async () => {
                await setPin(i, null);
                setNote("PIN removed.");
              }}
            >
              Remove
            </Chip>
          ) : null}
        </div>
      ))}
      {editing !== null ? (
        <form
          className="mt-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pin.length < 4) return;
            setBusy(true);
            await setPin(editing, pin);
            setBusy(false);
            setEditing(null);
            setPinText("");
            setNote("PIN saved. The app asks for it next time it opens.");
          }}
        >
          <input
            value={pin}
            onChange={(e) => setPinText(e.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            type="password"
            autoFocus
            placeholder="New PIN (4–8 digits)"
            aria-label="New PIN"
            className={`${fieldClass} tracking-[0.3em]`}
          />
          <div className="mt-2 flex gap-2">
            {busy ? (
              <Spinner />
            ) : (
              <Button type="submit" disabled={pin.length < 4}>
                Save PIN
              </Button>
            )}
            <Button variant="soft" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
        <Shield size={14} className="mt-0.5 shrink-0" /> The PIN is stored only as a salted, slow hash on this device. It can’t be recovered — forgetting it means resetting the app.
      </p>
    </Section>
  );
}

function AccountCard() {
  const acct = useAccount();
  const [confirm, setConfirm] = useState(false);
  const backupText = { idle: "Backup ready", saving: "Saving…", saved: "Backed up ✓", error: "Backup failed — will retry" }[acct.backup];
  return (
    <Section title="Account 👤">
      <p className="font-semibold">{acct.account?.email}</p>
      {acct.account?.provider === "google" ? <p className="text-sm text-muted">Signed in with Google</p> : null}
      <p className="text-sm text-muted">
        🔒 {backupText} · encrypted with your {acct.account?.provider === "google" ? "backup passphrase" : "password"}
      </p>
      {confirm ? (
        <div className="mt-3">
          <p className="text-sm text-muted">Your progress is saved in your account. Signing out removes it from this device until you log in again.</p>
          <div className="mt-2 flex gap-2">
            <Button variant="soft" onClick={acct.signOut}>
              Sign out
            </Button>
            <Button onClick={() => setConfirm(false)}>Stay</Button>
          </div>
        </div>
      ) : (
        <Button variant="soft" className="mt-3" onClick={() => setConfirm(true)}>
          <LogOut size={18} /> Sign out
        </Button>
      )}
    </Section>
  );
}

const THEMES: { id: ThemePref; label: string; hint: string }[] = [
  { id: "system", label: "📱 Like my phone", hint: "Light by day, dark at night — follows your phone's setting." },
  { id: "light", label: "☀️ Light", hint: "Rose and cream, always." },
  { id: "dark", label: "🌙 Dark", hint: "Berlin at night: easy on the eyes." },
];

function Appearance() {
  const { pref, setPref } = useTheme();
  return (
    <Section title="Appearance ✨">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Appearance">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={pref === t.id}
            onClick={() => setPref(t.id)}
            className={`rounded-2xl border-2 p-3 text-left transition ${pref === t.id ? "border-plum bg-blush" : "border-line bg-surface hover:border-rose"}`}
          >
            <span className="block font-semibold">{t.label}</span>
            <span className="block text-xs text-muted">{t.hint}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function ChatStorage() {
  const { archive, state } = useProgress();
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  useEffect(() => {
    let alive = true;
    archive
      ?.stats()
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [archive, state.chat.length]);
  if (!archive) return null;
  const used = stats?.bytes ?? 0;
  return (
    <Section title="Chat storage 💬">
      <p className="text-ink">
        <b>{(stats?.count ?? 0).toLocaleString()}</b> messages · <b>{formatMB(used)}</b> of {CHAT_LIMITS.maxBytes / 1024 / 1024} MB
      </p>
      <ProgressBar value={used / CHAT_LIMITS.maxBytes} className="mt-2" />
      <p className="mt-2 text-xs text-muted">
        Your whole chat history is kept on this device — up to {CHAT_LIMITS.maxMessages.toLocaleString()} messages. If it ever passes {CHAT_LIMITS.maxBytes / 1024 / 1024} MB, the
        oldest messages are removed automatically until it’s back to {CHAT_LIMITS.targetBytes / 1024 / 1024} MB. The newest 500 are also in your encrypted cloud backup.
      </p>
    </Section>
  );
}
