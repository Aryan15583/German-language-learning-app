// Message notifications. Two layers (in the Android app, Firebase does layer 2 and native notifications layer 1):
//  1. While the app is open or in the background, new messages show as phone notifications (with the text).
//  2. With the "notify" function set up on Supabase, a Web Push ping arrives even when the app is closed.
//     The server never sees the message, so that ping just says "New message" (like Signal).
import { getPrefs } from "./prefs";
import { isNativeApp, nativeNotify, nativePushOff, nativePushToken } from "./native";
import { minuteOfDay, pushLearned, pushPublicKey, pushSetReminder, pushSubscribe, pushUnsubscribe, type RelayConfig } from "../core/lib/relay";

const PREF = "zh-notify";
const META = "zh-meta";

export type NotifyStatus = "unsupported" | "blocked" | "off" | "on";

export const notifySupported = () => isNativeApp() || (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator);
export const pushSupported = () => isNativeApp() || (notifySupported() && "PushManager" in window);

export function notifyWanted(): boolean {
  try {
    return window.localStorage.getItem(PREF) === "on";
  } catch {
    return false;
  }
}
function setWanted(on: boolean) {
  try {
    window.localStorage.setItem(PREF, on ? "on" : "off");
  } catch {
    // storage blocked: the switch just won't be remembered
  }
}

export function notifyStatus(): NotifyStatus {
  if (isNativeApp()) return notifyWanted() ? "on" : "off"; // the app asks Android for permission when turning on
  if (!notifySupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return Notification.permission === "granted" && notifyWanted() ? "on" : "off";
}

/** The service worker shows closed-app pings with my partner's name, so keep it handy for it. */
export async function rememberPartnerName(name: string) {
  try {
    const c = await caches.open(META);
    await c.put("/__zh-meta", new Response(JSON.stringify({ name }), { headers: { "Content-Type": "application/json" } }));
  } catch {
    // no cache storage: pings just say "Zwei Herzen"
  }
}

const b64urlToBytes = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const bytesToB64url = (buf: ArrayBuffer | null) => (buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : "");

type PushAddress = { endpoint: string; p256dh: string | null; auth: string | null };

/** This phone's push address (made if needed), or null when closed-app pings aren't possible. In the app: its Firebase token. */
async function pushSub(relay: RelayConfig | null, ask = false): Promise<PushAddress | null> {
  if (isNativeApp()) {
    const token = relay ? await nativePushToken(ask).catch(() => null) : null;
    return token ? { endpoint: `fcm:${token}`, p256dh: null, auth: null } : null;
  }
  if (!relay || !pushSupported() || Notification.permission !== "granted") return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = await pushPublicKey(relay);
      if (!key) return null;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(key) });
    }
    return { endpoint: sub.endpoint, p256dh: bytesToB64url(sub.getKey("p256dh")), auth: bytesToB64url(sub.getKey("auth")) };
  } catch {
    return null;
  }
}

/** Make sure this phone gets pings for `mailbox`. Returns whether closed-app pings are on. */
export async function ensurePush(relay: RelayConfig | null, mailbox: string | null): Promise<boolean> {
  if (!mailbox) return false;
  const sub = await pushSub(relay);
  if (!sub || !relay) return false;
  try {
    await pushSubscribe(relay, mailbox, sub);
    return true;
  } catch {
    return false;
  }
}

// ---- daily learning reminders ----
const REMIND = "zh-remind";
export type Reminder = { on: boolean; time: string };
export const DEFAULT_REMINDER: Reminder = { on: false, time: "20:00" };

export function getReminder(): Reminder {
  try {
    const r = JSON.parse(window.localStorage.getItem(REMIND) ?? "null") as Partial<Reminder> | null;
    return { on: r?.on === true, time: typeof r?.time === "string" && minuteOfDay(r.time) !== null ? r.time : DEFAULT_REMINDER.time };
  } catch {
    return DEFAULT_REMINDER;
  }
}

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

/**
 * Save the reminder. Asks for notification permission when turning it on.
 * Returns whether it can also arrive while the app is closed.
 */
export async function setReminder(relay: RelayConfig | null, r: Reminder): Promise<{ ok: boolean; push: boolean; status: NotifyStatus }> {
  if (isNativeApp()) {
    const sub = await pushSub(relay, r.on);
    if (r.on && !sub) return { ok: false, push: false, status: "blocked" };
    try {
      window.localStorage.setItem(REMIND, JSON.stringify(r));
    } catch {
      // not remembered
    }
    let push = false;
    if (sub && relay) push = await pushSetReminder(relay, sub, r.on ? minuteOfDay(r.time) : null, r.on ? timeZone() : null).then(() => r.on, () => false);
    return { ok: true, push, status: "on" };
  }
  if (r.on) {
    if (!notifySupported()) return { ok: false, push: false, status: "unsupported" };
    const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (perm !== "granted") return { ok: false, push: false, status: perm === "denied" ? "blocked" : "off" };
  }
  try {
    window.localStorage.setItem(REMIND, JSON.stringify(r));
  } catch {
    // not remembered on this phone
  }
  const sub = r.on || pushSupported() ? await pushSub(relay) : null;
  let push = false;
  if (sub && relay) {
    try {
      await pushSetReminder(relay, sub, r.on ? minuteOfDay(r.time) : null, r.on ? timeZone() : null);
      push = r.on;
    } catch {
      push = false;
    }
  }
  return { ok: true, push, status: notifySupported() ? (Notification.permission === "granted" ? "on" : "off") : "unsupported" };
}

/** Tell the server I've learned today, so no reminder comes (once per day). */
export async function reportLearned(relay: RelayConfig | null, day: string) {
  if (!relay || !getReminder().on) return;
  if (isNativeApp()) {
    try {
      if (window.localStorage.getItem("zh-learned-sent") === day) return;
      const sub = await pushSub(relay);
      if (!sub) return;
      await pushLearned(relay, sub.endpoint, day);
      window.localStorage.setItem("zh-learned-sent", day);
    } catch {
      // try again next time
    }
    return;
  }
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    if (window.localStorage.getItem("zh-learned-sent") === day) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await pushLearned(relay, sub.endpoint, day);
    window.localStorage.setItem("zh-learned-sent", day);
  } catch {
    // try again next time
  }
}

/** While the app is open in the background: remind at the chosen time if I haven't learned yet. */
export async function localReminderCheck(learnedToday: boolean, day: string) {
  const r = getReminder();
  if (!r.on || learnedToday || typeof document === "undefined" || document.visibilityState === "visible") return;
  const at = minuteOfDay(r.time);
  const now = new Date();
  if (at === null || now.getHours() * 60 + now.getMinutes() < at) return;
  try {
    if (window.localStorage.getItem("zh-remind-shown") === day) return;
    window.localStorage.setItem("zh-remind-shown", day);
    if (isNativeApp()) return await nativeNotify("Zeit für Deutsch! 🇩🇪", "5 minutes today keeps your streak alive 🔥 Berlin is waiting for you two ❤️", "/");
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("Zeit für Deutsch! 🇩🇪", {
      body: "5 minutes today keeps your streak alive 🔥 Berlin is waiting for you two ❤️",
      tag: "zh-remind",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/" },
    } as NotificationOptions);
  } catch {
    // notifications unavailable right now
  }
}

/** Ask permission and turn notifications on. */
export async function enableNotifications(relay: RelayConfig | null, mailbox: string | null, partner: string): Promise<{ status: NotifyStatus; push: boolean }> {
  if (isNativeApp()) {
    const sub = await pushSub(relay, true);
    if (!sub) return { status: "blocked", push: false };
    setWanted(true);
    const push = mailbox && relay ? await pushSubscribe(relay, mailbox, sub).then(() => true, () => false) : false;
    return { status: "on", push };
  }
  if (!notifySupported()) return { status: "unsupported", push: false };
  const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (perm !== "granted") return { status: perm === "denied" ? "blocked" : "off", push: false };
  setWanted(true);
  await rememberPartnerName(partner);
  return { status: "on", push: await ensurePush(relay, mailbox) };
}

export async function disableNotifications(relay: RelayConfig | null) {
  setWanted(false);
  if (isNativeApp()) {
    const sub = await pushSub(relay);
    if (sub && relay) await pushUnsubscribe(relay, sub.endpoint).catch(() => {});
    await nativePushOff();
    return;
  }
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      if (relay) await pushUnsubscribe(relay, sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {
    // nothing to undo
  }
}

/** Show a message notification now (the app is open but not on screen). */
export async function showMessageNotification(title: string, body: string) {
  if (notifyStatus() !== "on") return;
  // Privacy setting: hide the text on the lock screen.
  if (!getPrefs().notifyPreview) body = "New message 💌";
  if (isNativeApp()) return nativeNotify(title, body).catch(() => {});
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag: "zh-chat", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: "/messages" }, renotify: true } as NotificationOptions);
  } catch {
    // notifications unavailable right now
  }
}
