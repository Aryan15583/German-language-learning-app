# Zusammen 👉👈 — German for Couples

A mobile app for two people learning German together, built with **React Native + Expo** (Expo Router, TypeScript). It runs on iOS, Android and the web.

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
- **Two partners, one app**: each partner has their own level, XP, unit scores and exams. You share one daily streak 🔥.
- **Quiz duel ⚔️**: pass the phone, and both partners answer the same questions on any unit or level mix.
- **Role-play dialogues 🎭** for every level, and a **love-note builder 💌**.

## Run it
```sh
npm install
npx expo start        # scan the QR code with the Expo Go app, or press w for web
```
Other scripts:

| Command | What it does |
|---|---|
| `npm test` | Jest test suites (logic, answer checking, question builder, content checks, Quiz component) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (Expo config) |
| `npm run web` | Run in the browser |

CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests on every push.

Progress is saved on the device with AsyncStorage.

## Project layout
```
src/app/                 Screens (Expo Router: every file is a route)
  (tabs)/                Home, Learn, Duel, Role-play, Notes
  unit/[topicId]         Unit page: tip, word list, links to practice
  lesson/[topicId]       Flashcards
  quiz/[topicId]         Unit test
  exam/[levelId]         Level exam (unlocks the next level)
  placement.tsx          Placement test
  duel/[topicId]         Pass-the-phone duel
  dialogue/[id]          Role-play scene
  setup.tsx              Names + starting levels
src/content/levels.ts    All course content: levels → sub-levels → units  ← add words here
src/state/logic.ts       Pure progress rules (streak, unit scores, exams, placement)
src/state/progress.tsx   React context + saving to AsyncStorage
src/lib/answers.ts       Typed-answer checking (umlauts, typos)
src/lib/questions.ts     Quiz question builder
src/components/          Quiz, Results and shared UI
src/__tests__/           Jest tests
```

## Add content
Edit `src/content/levels.ts`. Add units to a sub-level (each needs an id, a tip and at least 4 words), dialogues to `DIALOGUES`, or phrases to `NOTE_PARTS`. Run `npm test`: the content tests catch duplicate ids, missing tips or units too small to quiz.
