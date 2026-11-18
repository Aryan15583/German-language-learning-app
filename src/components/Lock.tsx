import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { pinWaitSeconds } from "../web/pinGuard";
import { couple, partnerName, useProgress, type PartnerIndex } from "../web/progress";
import { Button, Chip, cx, fieldClass, Spinner } from "./ui";

/** Full-screen PIN prompt for the current profile. */
export function Lock() {
  const { state, unlock, setLearner, reset } = useProgress();
  const i = state.learner;
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 4 || busy) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (!ok) {
      const wait = pinWaitSeconds();
      setError(wait ? `Too many wrong tries. Wait ${wait < 60 ? `${wait} s` : `${Math.ceil(wait / 60)} min`} and try again.` : "Falsche PIN — wrong PIN");
      setPin("");
      setShakeKey((k) => k + 1);
    }
  };

  const others = ([0, 1] as PartnerIndex[]).filter((x) => x !== i && !couple.isLinked(state) && state.partners[x].name);

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-6">
      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-blush text-plum">
          <LockKeyhole size={36} />
        </div>
        <p className="mt-4 font-script text-3xl font-bold text-plum">Zwei Herzen ♡</p>
        <h1 className="mt-1 text-2xl font-bold">Hallo, {partnerName(state, i)}</h1>
        <p className="mb-5 text-muted">Enter your PIN to continue</p>
        <form onSubmit={submit} className="w-full">
          <input
            key={shakeKey}
            className={cx(fieldClass, "text-center text-2xl tracking-[0.5em]", error && "border-bad anim-shake")}
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={8}
            aria-label="PIN"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
              setError("");
            }}
          />
          <p role="alert" className="mt-2 min-h-6 text-bad">
            {error}
          </p>
          {busy ? (
            <Spinner />
          ) : (
            <Button type="submit" size="lg" full disabled={pin.length < 4}>
              Entsperren (Unlock)
            </Button>
          )}
        </form>
        {others.length ? (
          <div className="mt-5 flex items-center gap-2 text-muted">
            Not you?
            {others.map((x) => (
              <Chip key={x} onClick={() => setLearner(x)}>
                {partnerName(state, x)}
              </Chip>
            ))}
          </div>
        ) : null}
        <button type="button" className="mt-6 text-sm text-muted underline" onClick={() => setConfirmReset(true)}>
          Forgot PIN?
        </button>
        {confirmReset ? (
          <div className="mt-3">
            <p className="text-sm text-muted">The PIN can’t be recovered. Resetting erases all progress and chats on this device.</p>
            <Button variant="soft" className="mt-2" onClick={reset}>
              Erase everything on this device
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
