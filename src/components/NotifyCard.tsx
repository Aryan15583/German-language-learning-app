import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { notifyStatus, pushSupported, showMessageNotification, type NotifyStatus } from "../web/notify";
import { couple, partnerName, useProgress } from "../web/progress";
import { Button, cx } from "./ui";

const isIos = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isInstalled = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

/** "Message notifications" switch, with plain-language status. */
export function NotifyCard({ compact = false }: { compact?: boolean }) {
  const { state, enableNotify, disableNotify, relayOn } = useProgress();
  // Rendered only in the browser (behind the app's loading gate), so reading the status directly is safe.
  const [status, setStatus] = useState<NotifyStatus>(() => notifyStatus());
  const [push, setPush] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const name = partnerName(state, 1);
  const linked = couple.isLinked(state);
  const iosNeedsInstall = isIos() && !isInstalled();

  const turnOn = async () => {
    setBusy(true);
    const r = await enableNotify();
    setStatus(r.status);
    setPush(r.push);
    setBusy(false);
    if (r.status === "on") showMessageNotification("Zwei Herzen ♡", `Notifications are on 🔔 You’ll know when ${name} writes.`);
  };
  const turnOff = async () => {
    setBusy(true);
    await disableNotify();
    setStatus(notifyStatus());
    setPush(null);
    setBusy(false);
  };

  const line =
    status === "unsupported"
      ? iosNeedsInstall
        ? "On iPhone, first add the app to your Home Screen (Share → Add to Home Screen), then open it from there."
        : "This browser can’t show notifications."
      : status === "blocked"
        ? "Notifications are blocked. Allow them for this site in your phone’s settings, then come back."
        : status === "on"
          ? push === false || !relayOn || !pushSupported()
            ? "On while the app is open or in the background."
            : `On — you’ll get a ping when ${name} writes, even when the app is closed.`
          : `Get a notification when ${linked ? name : "your partner"} sends you a message, like WhatsApp.`;

  return (
    <div className={cx(compact ? "" : "card-premium mt-4 rounded-[26px] p-5")}>
      <div className="flex items-start gap-3">
        <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-full", status === "on" ? "bg-plum text-white" : "bg-blush text-plum")}>
          {status === "on" ? <Bell size={20} /> : <BellOff size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">Message notifications</p>
          <p className="text-sm text-muted">{line}</p>
          {status === "on" && iosNeedsInstall ? <p className="mt-1 text-xs text-muted">iPhone tip: open the app from your Home Screen for closed-app pings.</p> : null}
        </div>
      </div>
      {status === "off" ? (
        <Button className="mt-3" onClick={turnOn} disabled={busy || !linked}>
          🔔 {busy ? "Turning on…" : linked ? "Turn on notifications" : "Link phones first"}
        </Button>
      ) : status === "on" ? (
        <Button variant="ghost" className="mt-2" onClick={turnOff} disabled={busy}>
          Turn off
        </Button>
      ) : null}
    </div>
  );
}
