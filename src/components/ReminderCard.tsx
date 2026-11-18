import { AlarmClock } from "lucide-react";
import { useState } from "react";
import { getReminder, type Reminder } from "../web/notify";
import { useProgress } from "../web/progress";
import { Button, cx, fieldClass } from "./ui";

const PRESETS = ["08:00", "13:00", "19:00", "21:30"];
const pretty = (t: string) => new Date(`2000-01-01T${t}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** "Remind me to learn" — one gentle notification a day, only if you haven't learned yet. */
export function ReminderCard({ className, plain = false }: { className?: string; plain?: boolean }) {
  const { saveReminder, relayOn } = useProgress();
  // Rendered only in the browser (behind the app's loading gate).
  const [r, setR] = useState<Reminder>(() => getReminder());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (next: Reminder) => {
    setBusy(true);
    const res = await saveReminder(next);
    setBusy(false);
    if (!res.ok) {
      setNote(res.status === "blocked" ? "Notifications are blocked — allow them for this site in your phone’s settings." : "This browser can’t show reminders. On iPhone, add the app to your Home Screen first.");
      return;
    }
    setR(next);
    setNote(
      !next.on
        ? "Reminder off."
        : res.push
          ? `Done! We’ll remind you at ${pretty(next.time)} if you haven’t learned yet — even when the app is closed. 🔔`
          : `Saved for ${pretty(next.time)}. ${relayOn ? "Right now it works while the app is open in the background (closed-app reminders need the notification setup)." : "It works while the app is open in the background."}`,
    );
  };

  return (
    <div className={cx(!plain && "card-premium rounded-[26px] p-5", className)}>
      <div className="flex items-start gap-3">
        <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-full", r.on ? "bg-plum text-white" : "bg-blush text-plum")}>
          <AlarmClock size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">Daily reminder</p>
          <p className="text-sm text-muted">{r.on ? `Every day at ${pretty(r.time)} — only if you haven’t learned yet.` : "A gentle nudge to keep your streak 🔥 — skipped on days you’ve already learned."}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PRESETS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={busy}
            onClick={() => save({ on: true, time: t })}
            className={cx("rounded-full px-3 py-1.5 text-sm font-semibold transition", r.on && r.time === t ? "btn-primary text-white" : "bg-blush text-plum hover:bg-rose-soft/60")}
          >
            {pretty(t)}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-sm text-muted">
          or
          <input
            type="time"
            aria-label="Reminder time"
            value={r.time}
            disabled={busy}
            onChange={(e) => e.target.value && save({ on: true, time: e.target.value })}
            className={cx(fieldClass, "!w-auto !py-1.5")}
          />
        </label>
      </div>
      {r.on ? (
        <Button variant="ghost" size="sm" className="mt-2" disabled={busy} onClick={() => save({ ...r, on: false })}>
          Turn reminder off
        </Button>
      ) : null}
      {note ? (
        <p role="status" className="mt-2 text-sm text-plum">
          {note}
        </p>
      ) : null}
    </div>
  );
}
