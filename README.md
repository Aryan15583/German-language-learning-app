# Zwei Herzen ♡ Until Berlin

Two hearts learning German together, all the way to Berlin. 💞

A web app for two people learning German together, built with **Next.js** (React, TypeScript, Tailwind CSS). It works on phones (big bottom tabs) and computers (a dashboard with a sidebar), and installs to the home screen like an app.

## How to use it (it's simple!)
- **🏠 Home (Dashboard):** tap the big **▶ Start** button. The app always picks your next step: learn the words → a short quiz → the next unit. Each level ends with a **🎓 big test**. The dashboard also shows both your progress rings, your streak, today's goal, the word of the day and recent activity.
- **📖 Learn Together:** your path of bubbles. ⭐ means done, and the glowing one is next.
- **💞 Couple (Our Journey):** link with your partner, chat, and see the weekly battle.
- **📊 Progress**, **🏆 Achievements** and **🎯 Couple goals**.
- **👤 Profile (Settings):** language, the "find my level" test, PIN and account.

Couple Quizzes ⚔️ (duels), Talk 💬 (chat practice and role-play) and Love notes 💌 are under Couple activities on the dashboard.

## Features
- **CEFR levels A1 → C2, each split into two sub-levels** (A1.1, A1.2 … C2.2), with 24 units and 192 words in total.
  | Level | Sub-levels | Units |
  |---|---|---|
  | A1 Beginner | A1.1 First words · A1.2 Daily life | Pet names, food · home, days & time |
  | A2 Elementary | A2.1 Feelings & errands · A2.2 Going out | Feelings, shopping · date night, travel |
  | B1 Intermediate | B1.1 People & care · B1.2 Plans & conflicts | Family, health · our future, arguing & making up |
  | B2 Upper intermediate | B2.1 Sharing a life · B2.2 Pressure & debate | Moving in, money · work & stress, opinions |
  | C1 Advanced | C1.1 Depth & values · C1.2 Idioms & culture | Deep talks, values · idioms of love, German culture |
  | C2 Mastery | C2.1 Words with character · C2.2 Fine nuance | Untranslatables, wordplay · nuance, poetry & vows |
- **Every unit** has a grammar tip 💡, a word list with pronunciation 🔊, flashcards, and a **unit test** (8 questions, some typed; pass at 80%).
- **Level exams 🎓**: once all of a level's units are passed, a 12-question exam (pass at 75%) unlocks the next level. Already know a level? **Test out** by taking its exam directly.
- **Placement test 🧭**: 4 questions per level, starting at A1. It moves you up until a level is too hard.
- **Forgiving typing**: `ue`/`ae`/`oe`/`ss` count as `ü`/`ä`/`ö`/`ß`, capitals and punctuation are ignored, and small typos are accepted with a spelling hint. There are on-screen umlaut keys too.
- **Learn through English, मराठी, or Marathi in English letters 🇮🇳** ("majha tujhyavar prem aahe"): each partner chooses. The English-letters version is generated automatically from the Marathi (`src/core/lib/romanize.ts`), with English loanwords spelled the English way ("coffee", "please"). Every word has a Marathi meaning (Devanagari), and quizzes, chat help and role-play translations use that partner's language. Flashcards and word lists show both, and each unit has a **Marathi ↔ German comparison** (e.g. du/Sie ≈ तू/तुम्ही, verb-last clauses like Marathi).
- **Chat practice 💬**: guided conversations from A1 to C2 (café, holiday, meeting the parents, chores, a heart-to-heart, playful teasing). Pick a suggested reply or type your own. A coach explains mistakes in your language, and a conversation with no mistakes earns ⭐⭐⭐.
- **Two partners, one app**: each partner has their own level, XP, unit scores and exams. You share one daily streak 🔥.
- **Quiz duel ⚔️**: pass the phone, and both partners answer the same questions on any unit or level mix.
- **Role-play dialogues 🎭** for every level (in the Talk tab), and a **love-note builder 💌**.

## Run it
```sh
npm install
npm run dev           # open http://localhost:3000
```
Other scripts:

| Command | What it does |
|---|---|
| `npm test` | Jest test suites (logic, answer checking, question builder, content checks, Quiz component) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (Next.js config) |
| `npm run build` | Static export to `out/` (what Vercel serves) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests on every push.

Progress is saved in the browser (localStorage) and, with accounts, in an encrypted backup.

## Together from anywhere 🌍
Link your two phones with a **6-character partner code** (Us tab). Then:
- **Chat** inside the app, including love notes, quick German phrases and **secrets** that unlock at a 7-day streak.
- **Remote duels**: play a round in Mumbai, and your partner in the USA gets the exact same questions in their own language.
- **Weekly XP battle, daily goal, hearts levels and achievements**, with each other's progress synced in every message.
- **Our words**: phrases you add appear on both phones and can be practised with flashcards.
- **PIN lock** per profile, and the app **installs to the home screen** and works offline.

Everything is **end-to-end encrypted** (XChaCha20-Poly1305) with a key only your two phones know. Messages pass through a tiny **zero-knowledge relay** that only ever stores scrambled data. See [SECURITY.md](SECURITY.md).

### Accounts (like Flo) 👤
With Supabase set up, the app has real accounts:
- **Each person signs up** with email and password (any address, Gmail included) or **Continue with Google**, **on their own phone**. Nobody else uses that phone's profile, so there's no profile switching.
- **Link up with a 6-character code** in the Us tab. Either of you can create the code, and the other enters it.
- **You see your side; your partner sees theirs.** Your own lessons, levels and settings stay yours. Your partner appears as a card (name, level, streak, weekly XP), in the chat and in duels.
- **Log in on any phone** and everything comes back: progress, chat, and the link with your partner. Signing out removes your data from that phone.
- **Zero-knowledge backup:** progress is encrypted on the phone with a key made from your password before it's saved. Supabase only stores scrambled data. Because of this, **a forgotten password can't recover old progress**. "Forgot password" lets you set a new one and keeps what's on the current phone.

Without Supabase, the app runs as before: one shared phone, no accounts.

### Set up Supabase (free, ~10 minutes)
1. Create a free project at **supabase.com**. A region near one of you works well (e.g. Mumbai).
2. **SQL Editor:** run [`supabase/migrations/0001_relay.sql`](supabase/migrations/0001_relay.sql), then [`supabase/migrations/0002_accounts.sql`](supabase/migrations/0002_accounts.sql). If you connected the GitHub repo in Supabase with migrations enabled, it can apply these for you. Running them again is harmless.
3. **Authentication → URL Configuration** (if confirmation emails open `localhost:3000`, this step is missing):
   - set **Site URL** to your app, e.g. `https://zwei-herzen-until-berlin.vercel.app`
   - add the same address under **Redirect URLs**

   This makes confirmation and password-reset emails open your app.
4. **Project Settings → API Keys:** copy the **Project URL** and the **publishable key** (`sb_publishable_…`, or the legacy `anon` key). **Never** use the secret/service_role key.
5. In **Vercel → Settings → Environment Variables**, add both:
   | Name | Value |
   |---|---|
   | `EXPO_PUBLIC_RELAY_URL` | your Project URL, e.g. `https://abcd1234.supabase.co` |
   | `EXPO_PUBLIC_RELAY_KEY` | the publishable key |
6. **Redeploy** in Vercel.
7. **Optional: "Continue with Google"** (works in the web app):
   1. In **console.cloud.google.com**, create a project, e.g. "Zwei Herzen".
   2. Go to **Google Auth Platform → Branding**, fill in the app name and your email. Under **Audience**, choose **External** and add both of your Gmail addresses as **test users**. (Or publish the app.)
   3. Go to **Clients → Create client → Web application**:
      - **Authorized JavaScript origins:** `https://zwei-herzen-until-berlin.vercel.app`
      - **Authorized redirect URIs:** `https://<your-project-id>.supabase.co/auth/v1/callback`
   4. Copy the **Client ID** and **Client secret**.
   5. In Supabase → **Authentication → Sign In / Providers → Google**: turn it on, paste both, and **Save**.

   The app only shows the Google button once Google is switched on in Supabase.

   Google accounts don't give the app a password, so after the first Google sign-in the app asks you to **choose a backup passphrase**. It locks your backup the same way a password does. You enter it once on each new phone, and it can't be recovered, so write it down.
8. **Once you've both signed up, lock the door:** in **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**. Then nobody else can create an account on your app.

**Good to know:**
- **Email limits:** Supabase's built-in email sender only sends a few emails per hour, which is plenty for two people. If a confirmation email doesn't arrive, wait a bit or check spam.
- **Skipping confirmation:** for just the two of you, you can instead turn off **Confirm email** (Authentication → Sign In / Providers → Email).
- **Pausing:** free projects pause after a week with no activity. If that happens, open the project and click **Restore**.

## Deploy the web version (Vercel)
`vercel.json` is already set up: Vercel runs `npm run build` (a static Next.js export, no server code) and serves `out/`. The Vercel settings `EXPO_PUBLIC_RELAY_URL` and `EXPO_PUBLIC_RELAY_KEY` keep their names.

1. On vercel.com, click **Add New → Project** and import this GitHub repository.
2. Keep the detected settings (Framework: Other). The build and output settings come from `vercel.json`.
3. Click **Deploy**. Every push after that redeploys automatically.

Or from a terminal: `npx vercel` (preview) and `npx vercel --prod` (live).

## Security
End-to-end encrypted couple link, zero-knowledge relay, PIN lock, no accounts, AI or trackers. Strict browser security headers, CodeQL, Dependabot, a dependency audit and relay SQL security tests in CI. See [SECURITY.md](SECURITY.md).

## Project layout
```
src/pages/               Screens (Next.js pages router; one page per screen, the item in ?id=)
  index.tsx              Dashboard (home)
  learn.tsx · unit.tsx   Learning path · one unit (tip, key phrases, word list)
  lesson.tsx · quiz.tsx  Flashcards · unit quiz
  exam.tsx · placement   Big test (unlocks the next level) · placement test
  us.tsx · inbox.tsx     Couple: code pairing, chat, secrets, weekly battle · opening shared links
  quizzes.tsx            Couple quizzes: duels on one phone (duel.tsx) or two (remote-duel.tsx)
  talk.tsx · chat.tsx · dialogue.tsx   Challenges: guided chats and role-play
  note.tsx · words.tsx   Love notes · our words
  progress · goals · achievements · profile · setup
  baiko.tsx              🤫
src/components/          App shell (sidebar, tabs, search), Quiz, auth, welcome, shared UI
src/web/                 Browser bits: progress + account providers, storage, speech, sharing
src/core/content/        All course content (German, English, Marathi) and chat scenarios  ← add words here
src/core/lib/            Encryption, partner codes, relay client, quiz builder, answer checking, chat engine, game rules
src/core/state/          Pure progress and couple rules (streak, scores, exams, pairing, chat, duels)
src/core/__tests__/      Jest tests
supabase/                Relay + accounts SQL and their security tests
public/art/              Illustrations
```

## Add content
Edit `src/core/content/levels.ts` (every word needs `de`, `en` and `mr`) or `src/core/content/chats.ts`. Add units to a sub-level (each needs an id, a tip and at least 4 words), dialogues to `DIALOGUES`, or phrases to `NOTE_PARTS`. Run `npm test`: the content tests catch duplicate ids, missing tips or units too small to quiz.
