# Zusammen 👉👈 — German for Couples

A small web app for two people learning German together.

## Features
- **Two partners, one app.** Enter both names, then switch "who's learning" at the top. Each partner has their own XP and mastered words.
- **Shared streak.** Practise on consecutive days to keep your 🔥 streak going together.
- **Flashcards** by topic: pet names, feelings, life at home, date night, food, travel.
- **Quiz duel.** Pass the phone: both partners answer the same questions, and the higher score wins.
- **Role-play dialogues.** Read two-person scenes aloud, swap roles, or hide the German to test yourselves.
- **Love notes.** Build a short note in German and copy or share it to your partner.
- **Pronunciation.** 🔊 buttons use the browser's built-in German voice.

## Run it
No build step or dependencies. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress is stored in the browser's `localStorage`, on that device only.

## Add content
Edit `js/data.js` to add topics (`TOPICS`), dialogues (`DIALOGUES`) or love-note phrases (`NOTE_PARTS`). New entries appear in the app automatically.
