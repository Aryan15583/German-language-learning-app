// Settings for optional features, kept on this phone. Every optional feature can be switched off.
import { useSyncExternalStore } from "react";

export type LockAfter = "0" | "1" | "5" | "never";
export type Prefs = {
  /** Cards rise softly into view while scrolling. */
  animations: boolean;
  /** Quick German phrases above the chat box. */
  quickPhrases: boolean;
  /** "Heute für euch" card (daily surprise + conversation) on Home. */
  homeExtras: boolean;
  /** "Nudge your partner" card on Us. */
  nudge: boolean;
  /** Show the message text in notifications (off: just "New message 💌"). */
  notifyPreview: boolean;
  /** With a PIN: lock again after the app was in the background this many minutes. */
  lockAfter: LockAfter;
};

export const DEFAULT_PREFS: Prefs = { animations: true, quickPhrases: true, homeExtras: true, nudge: true, notifyPreview: true, lockAfter: "1" };

const KEY = "zh-prefs";
const EVENT = "zh-prefs";
let cacheRaw: string | null | undefined;
let cache: Prefs = DEFAULT_PREFS;

export function getPrefs(): Prefs {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const p = JSON.parse(raw ?? "{}") as Partial<Prefs>;
    cache = {
      animations: typeof p.animations === "boolean" ? p.animations : DEFAULT_PREFS.animations,
      quickPhrases: typeof p.quickPhrases === "boolean" ? p.quickPhrases : DEFAULT_PREFS.quickPhrases,
      homeExtras: typeof p.homeExtras === "boolean" ? p.homeExtras : DEFAULT_PREFS.homeExtras,
      nudge: typeof p.nudge === "boolean" ? p.nudge : DEFAULT_PREFS.nudge,
      notifyPreview: typeof p.notifyPreview === "boolean" ? p.notifyPreview : DEFAULT_PREFS.notifyPreview,
      lockAfter: p.lockAfter === "0" || p.lockAfter === "1" || p.lockAfter === "5" || p.lockAfter === "never" ? p.lockAfter : DEFAULT_PREFS.lockAfter,
    };
  } catch {
    cache = DEFAULT_PREFS;
  }
  return cache;
}

export function setPrefs(patch: Partial<Prefs>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...getPrefs(), ...patch }));
  } catch {
    // storage blocked: the change lasts until the page closes
    cache = { ...cache, ...patch };
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
};

/** Read the settings and re-render when one changes. */
export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, getPrefs, () => DEFAULT_PREFS);
  return [prefs, setPrefs];
}
