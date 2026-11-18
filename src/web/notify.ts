// Message notifications. Two layers:
//  1. While the app is open or in the background, new messages show as phone notifications (with the text).
//  2. With the "notify" function set up on Supabase, a Web Push ping arrives even when the app is closed.
//     The server never sees the message, so that ping just says "New message" (like Signal).
import { pushPublicKey, pushSubscribe, pushUnsubscribe, type RelayConfig } from "../core/lib/relay";

const PREF = "zh-notify";
const META = "zh-meta";

export type NotifyStatus = "unsupported" | "blocked" | "off" | "on";

export const notifySupported = () => typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
export const pushSupported = () => notifySupported() && "PushManager" in window;

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

/** Make sure this phone gets pings for `mailbox`. Returns whether closed-app pings are on. */
export async function ensurePush(relay: RelayConfig | null, mailbox: string | null): Promise<boolean> {
  if (!relay || !mailbox || !pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = await pushPublicKey(relay);
      if (!key) return false;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(key) });
    }
    await pushSubscribe(relay, mailbox, { endpoint: sub.endpoint, p256dh: bytesToB64url(sub.getKey("p256dh")), auth: bytesToB64url(sub.getKey("auth")) });
    return true;
  } catch {
    return false;
  }
}

/** Ask permission and turn notifications on. */
export async function enableNotifications(relay: RelayConfig | null, mailbox: string | null, partner: string): Promise<{ status: NotifyStatus; push: boolean }> {
  if (!notifySupported()) return { status: "unsupported", push: false };
  const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (perm !== "granted") return { status: perm === "denied" ? "blocked" : "off", push: false };
  setWanted(true);
  await rememberPartnerName(partner);
  return { status: "on", push: await ensurePush(relay, mailbox) };
}

export async function disableNotifications(relay: RelayConfig | null) {
  setWanted(false);
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
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag: "zh-chat", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: "/messages" }, renotify: true } as NotificationOptions);
  } catch {
    // notifications unavailable right now
  }
}
