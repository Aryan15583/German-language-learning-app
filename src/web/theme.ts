// Light / dark / follow the phone. Saved per device; applied by toggling .dark on <html>.
import { useEffect, useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "zh-theme";
const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

const systemDark = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function applyTheme(pref: ThemePref = readPref()) {
  if (typeof document === "undefined") return;
  const dark = pref === "dark" || (pref === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#120a10" : "#8b2f55");
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, pref);
  } catch {
    // storage blocked: still switch for this visit
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** The saved preference and whether the page is dark right now. */
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as ThemePref);
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  // Follow the phone switching between light and dark while the app is open.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => {
      if (readPref() === "system") {
        applyTheme("system");
        listeners.forEach((l) => l());
      }
    };
    applyTheme();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return { pref, dark, setPref: setThemePref, toggle: () => setThemePref(dark ? "light" : "dark") };
}
