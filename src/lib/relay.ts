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
  if (!url || !key || !/^https:\/\/[a-z0-9.-]+$/i.test(url.replace(/\/+$/, ""))) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

const hash = (text: string) => toBase64Url(sha256(new TextEncoder().encode(text)));

/** Where messages for `recipient` are delivered. */
export const inboxFor = (coupleId: string, key: string, recipient: Role) => hash(`zh-inbox-v1|${coupleId}|${key}|${recipient}`);

/** Where the joiner's first message goes while the creator waits. */
export const helloBox = (coupleId: string, codeKey: string) => hash(`zh-hello-v1|${coupleId}|${codeKey}`);

export const otherRole = (r: Role): Role => (r === "creator" ? "joiner" : "creator");

export class RelayError extends Error {}

async function call<T>(cfg: RelayConfig, fn: string, body: Record<string, unknown>, fetchImpl: typeof fetch): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetchImpl(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
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
