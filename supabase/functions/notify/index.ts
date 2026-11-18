// Zwei Herzen ♡ — "notify" Edge Function: "you have a new message" pings and daily reminders (Web Push).
//
// It never sees what a message says (messages are end-to-end encrypted). It only:
//   GET  → returns the public Web Push key (made on first use and kept in push_keys)
//   POST {id, mailbox}       → called by the database when a message arrives; pings that mailbox's phones once.
//   POST {type: "reminders"} → called every 10 minutes; sends daily learning reminders that are due.
//
// No libraries: Web Push (VAPID + aes128gcm, RFC 8291/8292) is done with the built-in Web Crypto API,
// and the database is reached with plain fetch, so nothing can break on an npm import.
//
// Deploy: Supabase → Edge Functions → Deploy a new function → Via Editor → name "notify" → paste this file →
// Deploy → then turn OFF "Enforce JWT verification" (the database calls it; every request is checked below).

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ---------- database (PostgREST with the service key) ----------
async function rest(path: string, init: RequestInit = {}, prefer?: string): Promise<unknown> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  const headers: Record<string, string> = { apikey: SERVICE_KEY, "Content-Type": "application/json" };
  if (SERVICE_KEY.split(".").length === 3) headers.Authorization = `Bearer ${SERVICE_KEY}`;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`database ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
const q = encodeURIComponent;

// ---------- base64url ----------
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t + "=".repeat((4 - (t.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) {
    out.set(p, i);
    i += p.length;
  }
  return out;
};
const utf8 = (s: string) => new TextEncoder().encode(s);

// ---------- VAPID keys (made once, kept in push_keys) ----------
type Keys = { public_key: string; private_key: string };

async function makeKeys(): Promise<Keys> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { public_key: b64u(pub), private_key: jwk.d! };
}

async function keys(): Promise<Keys> {
  const found = (await rest("push_keys?id=eq.1&select=public_key,private_key")) as Keys[];
  if (found.length) return found[0];
  const k = await makeKeys();
  await rest("push_keys?on_conflict=id", { method: "POST", body: JSON.stringify({ id: 1, ...k }) }, "resolution=ignore-duplicates,return=minimal");
  const saved = (await rest("push_keys?id=eq.1&select=public_key,private_key")) as Keys[];
  return saved[0];
}

async function vapidAuth(endpoint: string, k: Keys): Promise<string> {
  const pub = unb64u(k.public_key);
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: k.private_key, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = b64u(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(utf8(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:noreply@zwei-herzen.app" })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(`${header}.${claims}`)));
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${k.public_key}`;
}

// ---------- payload encryption (RFC 8291, aes128gcm) ----------
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

async function encrypt(payload: Uint8Array, p256dh: string, auth: string): Promise<Uint8Array> {
  const uaPublic = unb64u(p256dh);
  const authSecret = unb64u(auth);
  const local = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, concat(utf8("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, utf8("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, utf8("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, concat(payload, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, sealed);
}

// ---------- sending ----------
type Sub = { endpoint: string; p256dh: string; auth: string };

async function sendAll(subs: Sub[], payload: { t: string }): Promise<number> {
  const k = await keys();
  const remind = payload.t === "remind";
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        const body = await encrypt(utf8(JSON.stringify(payload)), s.p256dh, s.auth);
        const res = await fetch(s.endpoint, {
          method: "POST",
          headers: {
            Authorization: await vapidAuth(s.endpoint, k),
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            TTL: remind ? "3600" : "86400",
            Urgency: remind ? "normal" : "high",
            Topic: remind ? "zh-remind" : "zh-chat",
          },
          body,
        });
        if (res.ok) sent++;
        // The phone uninstalled or turned notifications off: forget it.
        else if (res.status === 404 || res.status === 410) await rest(`push_subs?endpoint=eq.${q(s.endpoint)}`, { method: "DELETE" });
        else console.error("push failed", res.status, (await res.text()).slice(0, 200));
      } catch (e) {
        console.error("push error", String(e));
      }
    }),
  );
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (req.method === "GET") return json({ publicKey: (await keys()).public_key });
    if (req.method !== "POST") return json({ error: "method" }, 405);

    const body = await req.json().catch(() => null);

    // Daily reminders (safe to call any time: each phone gets at most one a day, only at its own time).
    if (body?.type === "reminders") {
      const due = (await rest("rpc/push_take_due_reminders", { method: "POST", body: "{}" })) as Sub[] | null;
      return json({ sent: due?.length ? await sendAll(due, { t: "remind" }) : 0 });
    }

    const id = Number(body?.id);
    const mailbox = typeof body?.mailbox === "string" ? body.mailbox : "";
    if (!Number.isSafeInteger(id) || !/^[A-Za-z0-9_-]{43}$/.test(mailbox)) return json({ error: "bad request" }, 400);

    // Only real, fresh, not-yet-pinged messages: mark it pinged in the same step.
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    const rows = (await rest(
      `relay?id=eq.${id}&mailbox=eq.${q(mailbox)}&notified_at=is.null&created_at=gte.${q(since)}&select=id`,
      { method: "PATCH", body: JSON.stringify({ notified_at: new Date().toISOString() }) },
      "return=representation",
    )) as { id: number }[];
    if (!rows?.length) return json({ sent: 0 });

    const subs = (await rest(`push_subs?mailbox=eq.${q(mailbox)}&select=endpoint,p256dh,auth`)) as Sub[];
    return json({ sent: subs.length ? await sendAll(subs, { t: "msg" }) : 0 });
  } catch (e) {
    console.error("notify failed", String(e));
    // Say why (no secrets in here), so setup problems are easy to fix.
    return json({ error: "server", detail: String(e instanceof Error ? e.message : e).slice(0, 300) }, 500);
  }
});
