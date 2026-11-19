import { useState } from "react";
import { LEVELS, type Lang, type LevelId } from "../core/content/levels";
import { useProgress } from "../web/progress";
import { LangPicker, LevelPicker } from "./pickers";
import { Button, Card, Chip, cx, fieldClass, Script } from "./ui";
import { usePrefs } from "../web/prefs";
import { Onboarding, WelcomeSplash } from "./Welcome";

const levelIndex = (id: LevelId) => LEVELS.findIndex((l) => l.id === id);
const describe = (id: LevelId) => {
  const l = LEVELS.find((x) => x.id === id)!;
  return `${l.id} · ${l.name} — ${l.blurb}`;
};

/**
 * First-time setup. With accounts: just you (your partner signs up on their own device).
 * Without accounts (one shared device): you and your partner, after the welcome slides.
 */
export function Setup({ onDone }: { onDone?: () => void } = {}) {
  const { state, setNames, accountMode, saveReminder } = useProgress();
  const [prefs, setPrefs] = usePrefs();
  const [remind, setRemind] = useState<string | null>(null);
  const [step, setStep] = useState<"splash" | "intro" | "form">(accountMode || state.partners[0].name ? "form" : "splash");
  const [a, setA] = useState(state.partners[0].name);
  const [b, setB] = useState(state.partners[1].name);
  const [la, setLa] = useState<LevelId>(LEVELS[state.partners[0].unlocked].id);
  const [lb, setLb] = useState<LevelId>(LEVELS[state.partners[1].unlocked].id);
  const [langs, setLangs] = useState<[Lang, Lang]>([state.partners[0].lang, state.partners[1].lang]);
  const ok = accountMode ? !!a.trim() : !!(a.trim() && b.trim());

  if (step === "splash") return <WelcomeSplash onStart={() => setStep("intro")} />;
  if (step === "intro") return <Onboarding onDone={() => setStep("form")} />;

  return (
    <div className="mx-auto max-w-xl px-5 pb-12 pt-10">
      <Script className="text-5xl">Willkommen! 👋</Script>
      <p className="mt-2 text-lg text-muted">A few quick things, then you’re in.</p>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">You</h2>
        <input className={`${fieldClass} mt-3`} placeholder="Your name" aria-label="Your name" maxLength={20} value={a} onChange={(e) => setA(e.target.value)} />
        <p className="mb-2 mt-4 text-sm font-semibold text-muted">Your German level (not sure? pick A1)</p>
        <LevelPicker value={la} onChange={setLa} />
        <p className="mt-2 text-sm text-muted">{describe(la)}</p>
        <p className="mb-2 mt-4 text-sm font-semibold text-muted">Learn German through · शिकण्याची भाषा</p>
        <LangPicker value={langs[0]} onChange={(l) => setLangs([l, langs[1]])} />
      </Card>

      {accountMode ? (
        <p className="mt-4 text-muted">
          💞 Your partner makes their own account on their own device. Link up afterwards in <b className="text-ink">Us</b> with a 6-character code.
        </p>
      ) : (
        <Card className="mt-4">
          <h2 className="text-lg font-bold">Your partner</h2>
          <input className={`${fieldClass} mt-3`} placeholder="Partner’s name" aria-label="Partner's name" maxLength={20} value={b} onChange={(e) => setB(e.target.value)} />
          <p className="mb-2 mt-4 text-sm font-semibold text-muted">Their German level</p>
          <LevelPicker value={lb} onChange={setLb} />
          <p className="mt-2 text-sm text-muted">{describe(lb)}</p>
          <p className="mb-2 mt-4 text-sm font-semibold text-muted">Learn German through</p>
          <LangPicker value={langs[1]} onChange={(l) => setLangs([langs[0], l])} />
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="text-lg font-bold">Make it yours ✨</h2>
        <p className="text-sm text-muted">Optional — you can change these any time in Me → Settings.</p>
        <p className="mb-2 mt-4 text-sm font-semibold text-muted">{accountMode ? "My colour" : `${a.trim() || "Your"}${a.trim() ? "’s" : ""} colour`}</p>
        <div className="flex gap-2" role="radiogroup" aria-label="My colour">
          {(["blue", "pink"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={prefs.myColor === c}
              onClick={() => setPrefs({ myColor: c })}
              className={cx("flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold", prefs.myColor === c ? "border-plum bg-blush" : "border-line bg-surface")}
            >
              <span className={cx("h-4 w-4 rounded-full", c === "blue" ? "bg-partner" : "bg-pink")} /> {c === "blue" ? "💙 Blue" : "💗 Pink"}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-sm font-semibold text-muted">Daily reminder</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Daily reminder">
          {[null, "08:00", "13:00", "19:00", "21:30"].map((t) => (
            <Chip key={t ?? "off"} selected={remind === t} onClick={() => setRemind(t)}>
              {t ? new Date(`2000-01-01T${t}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "No reminder"}
            </Chip>
          ))}
        </div>
      </Card>

      <Button
        size="lg"
        full
        className="mt-6"
        disabled={!ok}
        onClick={() => {
          setNames(a.trim(), accountMode ? state.partners[1].name : b.trim(), [levelIndex(la), levelIndex(lb)], langs);
          if (remind) saveReminder({ on: true, time: remind }).catch(() => {});
          onDone?.();
        }}
      >
        Los geht’s! (Let’s go!)
      </Button>
    </div>
  );
}
