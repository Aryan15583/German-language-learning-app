# Zusammen 👉👈 — German for Couples

A mobile app for two people learning German together, built with **React Native + Expo** (Expo Router, TypeScript). It runs on iOS, Android and the web.

## Features
- **CEFR levels A1 → C2.** Each partner picks a starting level. The next level unlocks after you master 70% of the current one, or you can skip ahead.
  | Level | Focus |
  |---|---|
  | A1 Beginner | Pet names, home, food |
  | A2 Elementary | Feelings, date night, travel |
  | B1 Intermediate | Our future, meeting the family, arguing & making up |
  | B2 Upper intermediate | Moving in, work & stress, opinions |
  | C1 Advanced | Deep conversations, idioms of love, German culture |
  | C2 Mastery | Untranslatable words, subtle nuances, poetry & vows |
- **Two partners, one app.** Switch who's learning in the header. Each partner has their own level, XP and mastered words.
- **Shared streak** 🔥 to keep each other practising.
- **Flashcards** per topic, with German pronunciation (🔊).
- **Quiz duel.** Pass the phone: both partners answer the same questions at a chosen level, and the higher score wins.
- **Role-play dialogues** for every level from A1 to C2. Swap roles, or hide the German to test yourselves.
- **Love notes.** Build a German note, then copy it or share it to your partner.

## Run it
```sh
npm install
npx expo start        # scan the QR code with the Expo Go app, or press w for web
```
Other scripts: `npm run web`, `npm run typecheck`, `npm run lint`.

Progress is saved on the device with AsyncStorage.

## Project layout
```
src/app/            Screens (Expo Router: every file is a route)
  (tabs)/           Home, Learn, Duel, Role-play, Notes
  lesson/[topicId]  Flashcards
  duel/[topicId]    Pass-the-phone quiz
  dialogue/[id]     Role-play scene
  setup.tsx         Names + starting levels
src/content/levels.ts   All course content by CEFR level  ← add words here
src/state/progress.tsx  Partners, XP, streak, level unlocks
src/components/ui.tsx   Shared UI pieces
```

## Add content
Edit `src/content/levels.ts`. Add topics to a level, dialogues to `DIALOGUES`, or phrases to `NOTE_PARTS`. Topic ids must be unique.
