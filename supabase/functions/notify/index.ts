// Zwei Herzen ♡ — "notify" Edge Function: sends "you have a new message" pings (Web Push).
//
// It never sees what a message says (messages are end-to-end encrypted). It only:
//   GET  → returns the public Web Push key (made on first use and kept in push_keys)
//   POST {id, mailbox} → called by the database when a message arrives; pings that mailbox's phones once.
//   POST {type: "reminders"} → called every 10 minutes; sends daily learning reminders that are due.
//
// Deploy: Supabase → Edge Functions → Deploy a new function → name "notify" → paste this file →
// turn OFF "Verify JWT" (the database calls it, and every request is checked below).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function keys(): Promise<{ public_key: string; private_key: string }> {
  const { data } = await db.from("push_keys").select("public_key, private_key").eq("id", 1).maybeSingle();
  if (data) return data;
  const k = webpush.generateVAPIDKeys();
  await db.from("push_keys").upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: "id", ignoreDuplicates: true });
  const { data: saved } = await db.from("push_keys").select("public_key, private_key").eq("id", 1).single();
  return saved!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (req.method === "GET") return json({ publicKey: (await keys()).public_key });
    if (req.method !== "POST") return json({ error: "method" }, 405);

    const body = await req.json().catch(() => null);

    // Daily reminders (safe to call any time: each phone gets at most one a day, only at its own time).
    if (body?.type === "reminders") {
      const { data: due } = await db.rpc("push_take_due_reminders");
      if (!due?.length) return json({ sent: 0 });
      return json({ sent: await sendAll(due, { t: "remind" }, "zh-remind") });
    }

    const id = Number(body?.id);
    const mailbox = typeof body?.mailbox === "string" ? body.mailbox : "";
    if (!Number.isSafeInteger(id) || !/^[A-Za-z0-9_-]{43}$/.test(mailbox)) return json({ error: "bad request" }, 400);

    // Only real, fresh, not-yet-pinged messages: mark it pinged in the same step.
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: row } = await db
      .from("relay")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", id)
      .eq("mailbox", mailbox)
      .is("notified_at", null)
      .gte("created_at", since)
      .select("id")
      .maybeSingle();
    if (!row) return json({ sent: 0 });

    const { data: subs } = await db.from("push_subs").select("endpoint, p256dh, auth").eq("mailbox", mailbox);
    if (!subs?.length) return json({ sent: 0 });

    return json({ sent: await sendAll(subs, { t: "msg" }, "zh-chat") });
  } catch {
    return json({ error: "server" }, 500);
  }
});

type Sub = { endpoint: string; p256dh: string; auth: string };

async function sendAll(subs: Sub[], payload: { t: string }, topic: string): Promise<number> {
  const k = await keys();
  webpush.setVapidDetails("mailto:noreply@zwei-herzen.app", k.public_key, k.private_key);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
          TTL: payload.t === "remind" ? 3600 : 86_400,
          urgency: payload.t === "remind" ? "normal" : "high",
          topic,
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // The phone uninstalled or turned notifications off: forget it.
        if (code === 404 || code === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }),
  );
  return sent;
}
