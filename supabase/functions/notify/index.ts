// Zwei Herzen ♡ — "notify" Edge Function: "you have a new message" pings and daily reminders (Web Push).
//
// It never sees what a message says (messages are end-to-end encrypted). It only:
//   GET  → returns the public Web Push key (made on first use and kept in push_keys)
//   POST {id, mailbox}       → called by the database when a message arrives; pings that mailbox's phones once.
//   POST {type: "reminders"} → called every 10 minutes; sends daily learning reminders that are due.
//   POST {type: "cleanup"}   → called once a day; deletes encrypted media files older than 30 days.
//
// No libraries: Web Push (VAPID + aes128gcm, RFC 8291/8292) is done with the built-in Web Crypto API,
// and the database is reached with plain fetch, so nothing can break on an npm import.
// The Android app gets its notifications through Firebase (FCM v1); that needs the secret
// FCM_SERVICE_ACCOUNT (the Firebase service-account JSON) in Supabase → Edge Functions → Secrets.
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
type Sub = { endpoint: string; p256dh: string | null; auth: string | null };

/** Delete encrypted media older than 30 days (Supabase Storage API, service key). */
async function cleanupMedia(): Promise<number> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  const headers: Record<string, string> = { apikey: SERVICE_KEY, "Content-Type": "application/json" };
  if (SERVICE_KEY.split(".").length === 3) headers.Authorization = `Bearer ${SERVICE_KEY}`;
  const cutoff = Date.now() - 30 * 86_400_000;
  let deleted = 0;
  for (let round = 0; round < 20; round++) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/media`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prefix: "", limit: 1000, offset: 0, sortBy: { column: "created_at", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`storage list ${res.status}`);
    const files = ((await res.json()) as { name: string; created_at?: string }[]).filter((f) => f.created_at && Date.parse(f.created_at) < cutoff);
    if (!files.length) break;
    const del = await fetch(`${SUPABASE_URL}/storage/v1/object/media`, { method: "DELETE", headers, body: JSON.stringify({ prefixes: files.map((f) => f.name) }) });
    if (!del.ok) throw new Error(`storage delete ${del.status}`);
    deleted += files.length;
    if (files.length < 1000) break;
  }
  return deleted;
}

// ---------- Firebase (Android app) ----------
type ServiceAccount = { project_id: string; client_email: string; private_key: string };
const GOOGLE_TOKEN_URL = Deno.env.get("FCM_TEST_TOKEN_URL") || "https://oauth2.googleapis.com/token";
const FCM_BASE = Deno.env.get("FCM_TEST_BASE") || "https://fcm.googleapis.com";
let fcmToken: { value: string; exp: number } | null = null;

function serviceAccount(): ServiceAccount | null {
  try {
    const sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "") as ServiceAccount;
    return sa.project_id && sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

/** A short-lived Google access token for FCM, signed with the service account's key (RS256). */
async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (fcmToken && fcmToken.exp > Date.now() + 60_000) return fcmToken.value;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(utf8(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = b64u(utf8(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, utf8(`${header}.${claims}`)));
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64u(sig)}` }),
  });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !j.access_token) throw new Error(`google token ${res.status}`);
  fcmToken = { value: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return fcmToken.value;
}

/** Send one Firebase notification. Returns "ok", "gone" (token no longer valid) or "error". */
async function sendFcm(token: string, payload: { t: string }): Promise<"ok" | "gone" | "error"> {
  const sa = serviceAccount();
  if (!sa) {
    console.error("FCM_SERVICE_ACCOUNT secret missing — Android notifications can't be sent");
    return "error";
  }
  const remind = payload.t === "remind";
  const res = await fetch(`${FCM_BASE}/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await fcmAccessToken(sa)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: remind
          ? { title: "Zeit für Deutsch! 🇩🇪", body: "5 minutes today keeps your streak alive 🔥 Berlin is waiting for you two ❤️" }
          : { title: "Zwei Herzen ♡", body: "💌 New message" },
        data: { t: payload.t, url: remind ? "/" : "/messages" },
        android: {
          priority: remind ? "NORMAL" : "HIGH",
          ttl: remind ? "3600s" : "86400s",
          notification: { channel_id: remind ? "reminders" : "messages", icon: "ic_stat_heart", color: "#8b2f55", tag: remind ? "zh-remind" : "zh-chat" },
        },
      },
    }),
  });
  if (res.ok) return "ok";
  const text = await res.text();
  if (res.status === 404 || /UNREGISTERED|registration-token-not-registered/i.test(text)) return "gone";
  console.error("fcm failed", res.status, text.slice(0, 200));
  return "error";
}

/** Only real push services (the database checks this too), so this function can't be aimed at other sites. */
const PUSH_HOST = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com)\//;
const endpointOk = (e: string) => PUSH_HOST.test(e) || (Deno.env.get("NOTIFY_TEST_ENDPOINTS") === "1" && e.startsWith("https://127.0.0.1:"));

async function sendAll(subs: Sub[], payload: { t: string }): Promise<number> {
  const k = await keys();
  const remind = payload.t === "remind";
  let sent = 0;
  await Promise.all(
    subs.filter((s) => endpointOk(s.endpoint) || /^fcm:[A-Za-z0-9_:-]{100,400}$/.test(s.endpoint)).map(async (s) => {
      try {
        // The Android app: through Firebase.
        if (s.endpoint.startsWith("fcm:")) {
          const r = await sendFcm(s.endpoint.slice(4), payload);
          if (r === "ok") sent++;
          else if (r === "gone") await rest(`push_subs?endpoint=eq.${q(s.endpoint)}`, { method: "DELETE" });
          return;
        }
        if (!s.p256dh || !s.auth) return;
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

    // Media cleanup (safe to call any time: only removes files older than 30 days).
    if (body?.type === "cleanup") return json({ deleted: await cleanupMedia() });

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
    // The reason goes to the function's Logs only (Supabase → Edge Functions → notify → Logs), not to the public.
    console.error("notify failed", String(e));
    return json({ error: "server" }, 500);
  }
});
