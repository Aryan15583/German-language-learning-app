# Message notifications & daily reminders — one-time setup

Without this setup, notifications already work **while the app is open or in the background**.
These 3 steps make them work **even when the app is closed**.

Privacy: messages stay end-to-end encrypted. The server never sees what you wrote, so the
closed-app notification says “Shreya 💌 — New message from Shreya” (like Signal), not the text.

## 1. Run the SQL (2 minutes)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Copy everything in `supabase/migrations/0004_push_notifications.sql` and paste it.
3. Click **Run**. You should see “Success”.

Then do the same with `supabase/migrations/0005_reminders.sql` (daily reminders). Run it after 0004.
Then `supabase/migrations/0006_security.sql` (security hardening). Run it after 0005.
Then `supabase/migrations/0007_media.sql` (photos, videos and voice messages). Run it after 0006, and paste the newest notify function (it also deletes media older than 30 days).

## 2. Create the “notify” function (3 minutes)

1. In Supabase, open **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name it exactly: `notify`
3. Delete the sample code, then copy everything in `supabase/functions/notify/index.ts` and paste it.
4. Click **Deploy function**.
5. Open the function’s **Details** (or Settings) and turn **OFF** “Enforce JWT verification” (sometimes called “Verify JWT”). Click **Save**.
   (The database calls this function, and the function checks every request itself.)

No keys or passwords to copy: the function makes its own notification key the first time it runs.

## 3. Turn it on in the app (each phone)

1. Open the app → **Us** → **Open chat** → tap your partner’s **name** at the top.
2. Under **Notifications**, tap **Turn on notifications** and allow them.
3. It should say: “On — you’ll get a ping … even when the app is closed.”

**iPhone:** notifications only work for apps on the Home Screen. In Safari tap **Share → Add to Home Screen**,
then open Zwei Herzen from the Home Screen and turn notifications on there (iOS 16.4 or newer).

## 4. Daily reminder (each phone)

Open **Me** → **Daily reminder** → pick a time (8:00, 13:00, 19:00, 21:30 or your own).
You get “Zeit für Deutsch! 🇩🇪” at that time — only on days you haven’t learned yet.

Already made the function before? Paste the newest `supabase/functions/notify/index.ts` again and deploy
(it now also sends reminders).

## If it says “On while the app is open” only

- Step 2 isn’t finished, or JWT verification is still on. Fix it, then turn notifications off and on again.
- The project address in `0004_push_notifications.sql` (`push_config`) must be your project’s.
