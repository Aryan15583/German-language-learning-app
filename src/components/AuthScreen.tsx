import { Eye, EyeOff, Lock as LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { emailProblem, passwordProblem } from "../core/lib/vault";
import { useAccount } from "../web/account";
import { Button, Card, Chip, cx, fieldClass, HeartPlane, Spinner } from "./ui";
import { Onboarding, WelcomeSplash } from "./Welcome";

type Mode = "login" | "signup" | "forgot";
type Step = "splash" | "intro" | "form";

/** Welcome → intro slides → log in / create account. Also the "unlock" and "new password" steps. */
export function AuthScreen() {
  const acct = useAccount();
  const phase = acct.phase;
  const [step, setStep] = useState<Step>(phase === "signed-out" ? "splash" : "form");
  const [chosenMode, setMode] = useState<Mode>("signup");

  if (phase === "signed-out" && step === "splash") {
    return (
      <WelcomeSplash
        onStart={() => setStep("intro")}
        onSignIn={() => {
          setMode("login");
          setStep("form");
        }}
      />
    );
  }
  if (phase === "signed-out" && step === "intro") {
    return (
      <Onboarding
        onDone={() => {
          setMode("signup");
          setStep("form");
        }}
      />
    );
  }
  return <AuthForm chosenMode={chosenMode} setMode={setMode} />;
}

function AuthForm({ chosenMode, setMode }: { chosenMode: Mode; setMode: (m: Mode) => void }) {
  const acct = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [lastSignup, setLastSignup] = useState("");
  const [resent, setResent] = useState("");
  const [stuck, setStuck] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const phase = acct.phase;
  const signupOpen = acct.settings?.signupOpen !== false;
  const mode: Mode = !signupOpen && chosenMode === "signup" ? "login" : chosenMode;
  const google = acct.account?.provider === "google";
  const choosing = phase === "unlock" && google && acct.hasBackup === false;

  const heading =
    phase === "unlock"
      ? google
        ? choosing
          ? "Choose a backup passphrase"
          : "Your backup passphrase"
        : "Welcome back"
      : phase === "recovery"
        ? "Choose a new password"
        : mode === "signup"
          ? "Create your account"
          : mode === "login"
            ? "Willkommen zurück!"
            : "Reset your password";

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; code?: string }>) => {
    setBusy(true);
    setError("");
    setInfo("");
    const r = await fn();
    setBusy(false);
    if (!r.ok) {
      if (r.code === "confirm-email") setInfo(r.error ?? "");
      else setError(r.error ?? "Something went wrong.");
      setMismatch(r.code === "password-mismatch");
      setStuck(r.code === "not-confirmed" || r.code === "confirm-email");
    }
    return r;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (phase === "unlock") {
      if (choosing) {
        const p = passwordProblem(password);
        if (p) return setError(p);
        if (password !== confirm) return setError("The two passphrases don’t match.");
      }
      return run(() => acct.unlock(password));
    }
    if (phase === "recovery") {
      const p = passwordProblem(password);
      if (p) return setError(p);
      if (password !== confirm) return setError("The two passwords don’t match.");
      return run(() => acct.setNewPassword(password));
    }
    const em = emailProblem(email);
    if (em) return setError(em);
    if (mode === "forgot") {
      const r = await run(() => acct.sendReset(email));
      if (r.ok) setInfo("If there’s an account for this email, a reset link is on its way. Check your inbox (and spam).");
      return;
    }
    if (mode === "signup") {
      const p = passwordProblem(password);
      if (p) return setError(p);
      if (password !== confirm) return setError("The two passwords don’t match.");
      setLastSignup(email);
      setResent("");
      return run(() => acct.signUp(email, password));
    }
    setLastSignup(email);
    return run(() => acct.signIn(email, password));
  };

  const pwLabel = google && phase === "unlock" ? "Backup passphrase" : "Password";
  const showConfirm = (phase === "signed-out" && mode === "signup") || phase === "recovery" || choosing;
  const showPassword = mode !== "forgot" || phase !== "signed-out";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-5 pb-10 pt-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img src="/icons/icon-192.png" alt="" width={84} height={84} className="rounded-3xl shadow-soft" />
      <h1 className="mt-3 font-script text-4xl font-bold text-plum">Zwei Herzen ♡</h1>
      <p className="mb-6 text-muted">until Berlin — learning German together</p>

      <Card className="w-full">
        <h2 className="text-2xl font-bold text-ink">{heading}</h2>

        {phase === "signed-out" && !signupOpen ? (
          <p className="mt-2 text-sm text-muted">🔒 This is a private app — new sign-ups are closed.</p>
        ) : null}
        {phase === "signed-out" ? (
          <div className="mt-3 flex gap-2">
            {signupOpen ? (
              <Chip selected={mode === "signup"} onClick={() => setMode("signup")}>
                Create account
              </Chip>
            ) : null}
            <Chip selected={mode === "login"} onClick={() => setMode("login")}>
              Log in
            </Chip>
          </div>
        ) : null}

        {phase === "unlock" && !google ? (
          <p className="mt-2 text-muted">
            Enter the password for <b className="text-ink">{acct.account?.email}</b> to unlock your progress on this device.
          </p>
        ) : null}
        {phase === "unlock" && google ? (
          acct.hasBackup === null ? (
            <p className="mt-2 text-muted">Checking your backup…</p>
          ) : (
            <p className="mt-2 text-muted">
              Signed in with Google as <b className="text-ink">{acct.account?.email}</b>.{" "}
              {choosing
                ? "Choose a passphrase that locks your progress so only you can read it. You’ll type it once on each new device. Write it down — it can’t be recovered."
                : "Enter the backup passphrase you chose, to unlock your progress on this device."}
            </p>
          )
        ) : null}
        {phase === "recovery" ? <p className="mt-2 text-muted">Your progress on this device is kept and locked with the new password.</p> : null}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {phase === "signed-out" ? (
            <input
              className={fieldClass}
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          ) : null}
          {showPassword ? (
            <input
              className={fieldClass}
              type={show ? "text" : "password"}
              autoComplete={mode === "signup" || phase === "recovery" || choosing ? "new-password" : "current-password"}
              placeholder={phase === "recovery" ? "New password" : pwLabel}
              aria-label={pwLabel}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          ) : null}
          {showConfirm ? (
            <input
              className={fieldClass}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Type it again"
              aria-label="Confirm password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
            />
          ) : null}
          {showPassword ? (
            <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-1.5 self-end text-sm text-muted">
              {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "Hide" : "Show"} password
            </button>
          ) : null}

          {error ? (
            <p role="alert" className="text-bad">
              {error}
            </p>
          ) : null}
          {info ? (
            <p aria-live="polite" className="text-good">
              {info}
            </p>
          ) : null}

          {busy ? (
            <Spinner />
          ) : (
            <Button type="submit" size="lg" full>
              {phase === "unlock"
                ? choosing
                  ? "Save passphrase 🔐"
                  : "Unlock"
                : phase === "recovery"
                  ? "Save new password"
                  : mode === "signup"
                    ? "Create account 💞"
                    : mode === "login"
                      ? "Log in"
                      : "Send reset link"}
            </Button>
          )}
        </form>

        {stuck && lastSignup && phase === "signed-out" ? (
          <div className="mt-4 rounded-2xl bg-blush/70 p-4 text-sm">
            <p className="font-semibold text-ink">Waiting for a confirmation email?</p>
            <p className="mt-1 text-muted">
              Supabase’s free email sender often doesn’t deliver these. The app owner can switch confirmation emails off for good with a one-time
              fix (“no email needed” in the setup guide) — then just log in.
            </p>
            <button
              type="button"
              disabled={cooldown > 0}
              className="mt-3 rounded-full border border-line bg-surface px-4 py-2 font-semibold text-plum disabled:opacity-50"
              onClick={async () => {
                setCooldown(30);
                const r = await acct.resendConfirmation(lastSignup);
                setResent(r.ok ? "Sent again — check your inbox and spam." : r.error);
              }}
            >
              {cooldown > 0 ? `Resend again in ${cooldown}s` : "Resend the email"}
            </button>
            {resent ? <p className="mt-2 text-muted">{resent}</p> : null}
          </div>
        ) : null}

        {mismatch ? (
          <div className="mt-4">
            <p className="text-sm text-muted">You can start a new backup with your current password. Anything already on this device is kept.</p>
            <Button variant="soft" full className="mt-2" onClick={() => run(() => acct.startFresh(password))}>
              Start a new backup
            </Button>
          </div>
        ) : null}

        {phase === "signed-out" && mode !== "forgot" && acct.settings?.google ? (
          <div className="mt-5">
            <div className="mb-4 flex items-center gap-3 text-sm text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <button
              type="button"
              aria-label="Continue with Google"
              disabled={busy}
              onClick={() => run(() => acct.signInWithGoogle())}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface py-3 font-semibold text-ink shadow-card hover:bg-blush"
            >
              <span className="text-lg font-black text-[#4285F4]">G</span> Continue with Google
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          {phase === "signed-out" && mode === "login" ? (
            <button type="button" className="text-muted underline" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          ) : null}
          {phase === "signed-out" && mode === "forgot" ? (
            <button type="button" className="text-muted underline" onClick={() => setMode("login")}>
              Back to log in
            </button>
          ) : null}
          {phase === "unlock" ? (
            <button type="button" className="text-muted underline" onClick={acct.signOut}>
              Use a different account
            </button>
          ) : null}
        </div>
      </Card>

      <p className={cx("mt-5 flex max-w-sm items-start gap-2 text-center text-xs text-muted")}>
        <LockIcon size={14} className="mt-0.5 shrink-0" />
        Your progress is encrypted on your device with your password before it’s saved. Nobody else can read it — which also means a forgotten password
        can’t be recovered.
      </p>
      <HeartPlane className="mt-6 h-8 w-24 text-rose-soft" />
    </div>
  );
}
