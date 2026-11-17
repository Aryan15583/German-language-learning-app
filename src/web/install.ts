// "Download the app": install this site to the home screen / desktop (a PWA).
// Chrome, Edge and Android fire `beforeinstallprompt`; we keep it so a button can open
// the real install dialog. iPhone/iPad Safari has no such dialog, so we show the steps.
import { useSyncExternalStore } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPrompt | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini bar
    deferred = e as InstallPrompt;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installedNow = true;
    deferred = null;
    notify();
  });
}

export type Platform = "ios" | "android" | "desktop";

export function platformOf(ua: string): Platform {
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && /mobile/i.test(ua))) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

const standalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

type Snapshot = { canPrompt: boolean; installed: boolean };
let snap: Snapshot = { canPrompt: false, installed: false };
function getSnapshot(): Snapshot {
  const next = { canPrompt: !!deferred, installed: installedNow || standalone() };
  if (next.canPrompt !== snap.canPrompt || next.installed !== snap.installed) snap = next;
  return snap;
}
const serverSnap: Snapshot = { canPrompt: false, installed: false };

export function useInstall() {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => serverSnap,
  );
  const platform = typeof navigator === "undefined" ? "desktop" : platformOf(navigator.userAgent);
  const install = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferred) return "unavailable";
    const p = deferred;
    await p.prompt();
    const { outcome } = await p.userChoice;
    deferred = null;
    if (outcome === "accepted") installedNow = true;
    notify();
    return outcome;
  };
  return { ...s, platform, install };
}
