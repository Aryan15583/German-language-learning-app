// In-app delivery through a zero-knowledge relay (see supabase/migrations/0001_relay.sql).
// Only ciphertext leaves the phone. Mailbox names are hashes of the couple key,
// so the relay can't read, guess or list them.
import { sha256 } from "@noble/hashes/sha2.js";
import { toBase64Url } from "./crypto";

export type Role = "creator" | "joiner";

export type RelayConfig = { url: string; key: string };

/**
 * Relay settings, baked in at build time (Expo inlines EXPO_PUBLIC_* variables,
 * so they must be read literally here). null = relay not set up: the app falls
 * back to sharing links.
 */
export function relayConfig(
  url: string | undefined = process.env.EXPO_PUBLIC_RELAY_URL,
  key: string | undefined = process.env.EXPO_PUBLIC_RELAY_KEY,
): RelayConfig | null {
  const clean = url?.replace(/\/+$/, "") ?? "";
  // HTTPS only (plain http is allowed for localhost, for local testing).
  const ok = /^https:\/\/[a-z0-9.-]+$/i.test(clean) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean);
  if (!url || !key || !ok) return null;
  return { url: clean, key };
}

const hash = (text: string) => toBase64Url(sha256(new TextEncoder().encode(text)));

/** Where messages for `recipient` are delivered. */
export const inboxFor = (coupleId: string, key: string, recipient: Role) => hash(`zh-inbox-v1|${coupleId}|${key}|${recipient}`);

/** Where the joiner's first message goes while the creator waits. */
export const helloBox = (coupleId: string, codeKey: string) => hash(`zh-hello-v1|${coupleId}|${codeKey}`);
/** Where each phone keeps its (encrypted) "online / last seen" note. */
export const presenceBox = (coupleId: string, key: string, role: Role) => hash(`zh-presence-v1|${coupleId}|${key}|${role}`);
/** Where the code maker leaves their public key for the partner (safe pairing v2). */
export const offerBox = (coupleId: string, codeKey: string) => hash(`zh-offer-v2|${coupleId}|${codeKey}`);


export const otherRole = (r: Role): Role => (r === "creator" ? "joiner" : "creator");

export class RelayError extends Error {}

async function call<T>(cfg: RelayConfig, fn: string, body: Record<string, unknown>, fetchImpl: typeof fetch): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetchImpl(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        "Content-Type": "application/json",
        // Legacy "anon" keys are JWTs and also go in Authorization; new publishable keys only use apikey.
        ...(cfg.key.split(".").length === 3 ? { Authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new RelayError(res.status === 429 || res.status === 503 ? "Too many messages, wait a moment." : `Relay error ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof RelayError) throw e;
    throw new RelayError("Can't reach the internet right now.");
  } finally {
    clearTimeout(timer);
  }
}

export const relaySend = (cfg: RelayConfig, mailbox: string, payload: string, fetchImpl: typeof fetch = fetch) =>
  call<number>(cfg, "relay_send", { p_mailbox: mailbox, p_payload: payload }, fetchImpl);

export async function relayFetch(
  cfg: RelayConfig,
  mailbox: string,
  after: number,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: number; payload: string }[]> {
  const rows = await call<unknown>(cfg, "relay_fetch", { p_mailbox: mailbox, p_after: after }, fetchImpl);
  if (!Array.isArray(rows)) throw new RelayError("Unexpected relay response");
  return rows
    .filter((r): r is { id: number; payload: string } => typeof r?.id === "number" && typeof r?.payload === "string")
    .map((r) => ({ id: r.id, payload: r.payload }));
}

// ---- message notifications (Web Push; see supabase/migrations/0004_push_notifications.sql) ----
export const pushSubscribe = (cfg: RelayConfig, mailbox: string, sub: { endpoint: string; p256dh: string; auth: string }, fetchImpl: typeof fetch = fetch) =>
  call<null>(cfg, "push_subscribe", { p_mailbox: mailbox, p_endpoint: sub.endpoint, p_p256dh: sub.p256dh, p_auth: sub.auth }, fetchImpl);
export const pushUnsubscribe = (cfg: RelayConfig, endpoint: string, fetchImpl: typeof fetch = fetch) => call<null>(cfg, "push_unsubscribe", { p_endpoint: endpoint }, fetchImpl);

/** The server's public Web Push key, or null when the notify function isn't set up. */
export async function pushPublicKey(cfg: RelayConfig, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`${cfg.url}/functions/v1/notify`, { headers: { apikey: cfg.key } });
    if (!res.ok) return null;
    const j = (await res.json()) as { publicKey?: unknown };
    return typeof j.publicKey === "string" && /^[A-Za-z0-9_-]{80,100}$/.test(j.publicKey) ? j.publicKey : null;
  } catch {
    return null;
  }
}

// ---- daily reminders (see supabase/migrations/0005_reminders.sql) ----
export const pushSetReminder = (
  cfg: RelayConfig,
  sub: { endpoint: string; p256dh: string; auth: string },
  minute: number | null,
  tz: string | null,
  fetchImpl: typeof fetch = fetch,
) => call<null>(cfg, "push_set_reminder", { p_endpoint: sub.endpoint, p_p256dh: sub.p256dh, p_auth: sub.auth, p_minute: minute, p_tz: tz }, fetchImpl);
export const pushLearned = (cfg: RelayConfig, endpoint: string, day: string, fetchImpl: typeof fetch = fetch) =>
  call<null>(cfg, "push_learned", { p_endpoint: endpoint, p_day: day }, fetchImpl);

/** "20:30" → 1230 (minutes after midnight); null when it isn't a valid time. */
export function minuteOfDay(time: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Empty a pairing mailbox once it's done its job (see 0006_security.sql). */
export const relayClear = (cfg: RelayConfig, mailbox: string, fetchImpl: typeof fetch = fetch) => call<null>(cfg, "relay_clear", { p_mailbox: mailbox }, fetchImpl);

// ---- online / last seen (see 0008_presence.sql) ----
export const presenceSet = (cfg: RelayConfig, box: string, payload: string, fetchImpl: typeof fetch = fetch) => call<null>(cfg, "presence_set", { p_box: box, p_payload: payload }, fetchImpl);
export const presenceGet = (cfg: RelayConfig, box: string, fetchImpl: typeof fetch = fetch) => call<string | null>(cfg, "presence_get", { p_box: box }, fetchImpl);
export const presenceClear = (cfg: RelayConfig, box: string, fetchImpl: typeof fetch = fetch) => call<null>(cfg, "presence_clear", { p_box: box }, fetchImpl);
