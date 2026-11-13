// Course content, organised by CEFR level (A1 → C2).
// Add topics or dialogues here; the app picks them up automatically.
// Topic ids must be unique across all levels (progress is stored by id).

export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Word = { de: string; en: string };

export type Topic = {
  id: string;
  title: string;
  emoji: string;
  words: Word[];
};

export type Level = {
  id: LevelId;
  name: string; // CEFR descriptor
  blurb: string;
  topics: Topic[];
};

export type DialogueLine = { who: "a" | "b"; de: string; en: string };

export type Dialogue = {
  id: string;
  level: LevelId;
  title: string;
  emoji: string;
  lines: DialogueLine[];
};

export const LEVELS: Level[] = [
  {
    id: "A1",
    name: "Beginner",
    blurb: "Everyday words and sweet basics.",
    topics: [
      {
        id: "kosenamen",
        title: "Pet names & greetings",
        emoji: "💕",
        words: [
          { de: "Schatz", en: "treasure / darling" },
          { de: "Liebling", en: "darling / favourite" },
          { de: "Mäuschen", en: "little mouse (sweetie)" },
          { de: "Guten Morgen, Schatz!", en: "Good morning, darling!" },
          { de: "Gute Nacht", en: "Good night" },
          { de: "Schlaf gut!", en: "Sleep well!" },
          { de: "Bis später", en: "See you later" },
          { de: "Ich liebe dich", en: "I love you" },
        ],
      },
      {
        id: "zuhause",
        title: "Life at home",
        emoji: "🏡",
        words: [
          { de: "die Küche", en: "the kitchen" },
          { de: "das Schlafzimmer", en: "the bedroom" },
          { de: "das Sofa", en: "the sofa" },
          { de: "kochen", en: "to cook" },
          { de: "aufräumen", en: "to tidy up" },
          { de: "Ich bin zu Hause", en: "I'm home" },
          { de: "Wo sind die Schlüssel?", en: "Where are the keys?" },
          { de: "Kannst du mir helfen?", en: "Can you help me?" },
        ],
      },
      {
        id: "essen",
        title: "Food & drink",
        emoji: "🥨",
        words: [
          { de: "das Frühstück", en: "breakfast" },
          { de: "das Abendessen", en: "dinner" },
          { de: "die Brezel", en: "the pretzel" },
          { de: "lecker", en: "tasty" },
          { de: "Ich habe Hunger", en: "I'm hungry" },
          { de: "Guten Appetit!", en: "Enjoy your meal!" },
          { de: "Noch einen Kaffee?", en: "Another coffee?" },
          { de: "Das schmeckt super", en: "That tastes great" },
        ],
      },
    ],
  },
  {
    id: "A2",
    name: "Elementary",
    blurb: "Talk about feelings, dates and trips.",
    topics: [
      {
        id: "gefuehle",
        title: "Feelings",
        emoji: "🥰",
        words: [
          { de: "glücklich", en: "happy" },
          { de: "müde", en: "tired" },
          { de: "traurig", en: "sad" },
          { de: "verliebt", en: "in love" },
          { de: "eifersüchtig", en: "jealous" },
          { de: "Wie fühlst du dich?", en: "How do you feel?" },
          { de: "Ich bin stolz auf dich", en: "I'm proud of you" },
          { de: "Ich vermisse dich", en: "I miss you" },
        ],
      },
      {
        id: "date",
        title: "Date night",
        emoji: "🍷",
        words: [
          { de: "das Kino", en: "the cinema" },
          { de: "der Spaziergang", en: "the walk" },
          { de: "Hast du heute Abend Zeit?", en: "Are you free tonight?" },
          { de: "Ich lade dich ein", en: "It's my treat" },
          { de: "Prost!", en: "Cheers!" },
          { de: "Du siehst toll aus", en: "You look great" },
          { de: "Die Rechnung, bitte", en: "The bill, please" },
          { de: "Wollen wir tanzen?", en: "Shall we dance?" },
        ],
      },
      {
        id: "reisen",
        title: "Travelling together",
        emoji: "✈️",
        words: [
          { de: "der Bahnhof", en: "the train station" },
          { de: "der Koffer", en: "the suitcase" },
          { de: "Ein Doppelzimmer, bitte", en: "A double room, please" },
          { de: "Wann fährt der Zug?", en: "When does the train leave?" },
          { de: "Wir haben uns verlaufen", en: "We're lost" },
          { de: "Mach ein Foto von uns!", en: "Take a photo of us!" },
          { de: "Ich will hier bleiben", en: "I want to stay here" },
          { de: "Wie weit ist es?", en: "How far is it?" },
        ],
      },
    ],
  },
  {
    id: "B1",
    name: "Intermediate",
    blurb: "Plans, family visits and making up.",
    topics: [
      {
        id: "zukunft",
        title: "Our future",
        emoji: "🔮",
        words: [
          { de: "die Hochzeit", en: "the wedding" },
          { de: "sich verloben", en: "to get engaged" },
          { de: "der Traum", en: "the dream" },
          { de: "Wo sehen wir uns in fünf Jahren?", en: "Where do we see ourselves in five years?" },
          { de: "Ich könnte mir vorstellen, …", en: "I could imagine …" },
          { de: "Wir sollten mehr sparen.", en: "We should save more." },
          { de: "Was wäre, wenn wir umziehen würden?", en: "What if we moved?" },
          { de: "Kinder haben", en: "to have children" },
        ],
      },
      {
        id: "familie",
        title: "Meeting the family",
        emoji: "👨‍👩‍👧",
        words: [
          { de: "die Schwiegereltern", en: "the in-laws" },
          { de: "Freut mich, Sie kennenzulernen.", en: "Nice to meet you. (formal)" },
          { de: "Darf ich Ihnen helfen?", en: "May I help you? (formal)" },
          { de: "Das Essen war köstlich.", en: "The food was delicious." },
          { de: "Ich bin ein bisschen nervös.", en: "I'm a bit nervous." },
          { de: "Wie habt ihr euch kennengelernt?", en: "How did you two meet?" },
          { de: "Wir haben uns online kennengelernt.", en: "We met online." },
          { de: "Ihr seid ein schönes Paar.", en: "You're a lovely couple." },
        ],
      },
      {
        id: "streit",
        title: "Arguing & making up",
        emoji: "🤝",
        words: [
          { de: "sich streiten", en: "to argue" },
          { de: "sich versöhnen", en: "to make up" },
          { de: "der Kompromiss", en: "the compromise" },
          { de: "Das habe ich nicht so gemeint.", en: "I didn't mean it like that." },
          { de: "Du hörst mir nicht zu.", en: "You're not listening to me." },
          { de: "Können wir in Ruhe darüber reden?", en: "Can we talk about it calmly?" },
          { de: "Ich brauche einen Moment.", en: "I need a moment." },
          { de: "Verzeihst du mir?", en: "Do you forgive me?" },
        ],
      },
    ],
  },
  {
    id: "B2",
    name: "Upper intermediate",
    blurb: "Living together, stress and opinions.",
    topics: [
      {
        id: "zusammenziehen",
        title: "Moving in together",
        emoji: "📦",
        words: [
          { de: "die gemeinsame Wohnung", en: "the shared flat" },
          { de: "der Mietvertrag", en: "the rental contract" },
          { de: "die Miete teilen", en: "to split the rent" },
          { de: "die Hausarbeit gerecht aufteilen", en: "to divide the housework fairly" },
          { de: "Wir müssen uns absprechen.", en: "We need to coordinate." },
          { de: "Es stört mich, wenn …", en: "It bothers me when …" },
          { de: "Das ist mir wichtig.", en: "That's important to me." },
          { de: "Hättest du Lust, …?", en: "Would you like to …?" },
        ],
      },
      {
        id: "stress",
        title: "Work & stress",
        emoji: "💼",
        words: [
          { de: "überfordert sein", en: "to be overwhelmed" },
          { de: "die Überstunden", en: "overtime" },
          { de: "abschalten", en: "to switch off / unwind" },
          { de: "der Feierabend", en: "the end of the working day" },
          { de: "Ich habe einen anstrengenden Tag hinter mir.", en: "I've had an exhausting day." },
          { de: "Wie kann ich dich unterstützen?", en: "How can I support you?" },
          { de: "Lass uns den Abend genießen.", en: "Let's enjoy the evening." },
          { de: "Ich bin für dich da.", en: "I'm there for you." },
        ],
      },
      {
        id: "meinungen",
        title: "Opinions & debates",
        emoji: "💬",
        words: [
          { de: "Meiner Meinung nach …", en: "In my opinion …" },
          { de: "Da bin ich anderer Meinung.", en: "I see that differently." },
          { de: "Einerseits …, andererseits …", en: "On the one hand …, on the other …" },
          { de: "Das kommt darauf an.", en: "It depends." },
          { de: "Du hast nicht ganz unrecht.", en: "You're not entirely wrong." },
          { de: "Ich gebe zu, dass …", en: "I admit that …" },
          { de: "überzeugen", en: "to convince" },
          { de: "der Standpunkt", en: "the point of view" },
        ],
      },
    ],
  },
  {
    id: "C1",
    name: "Advanced",
    blurb: "Deep talks, idioms and culture.",
    topics: [
      {
        id: "tiefgang",
        title: "Deep conversations",
        emoji: "🌊",
        words: [
          { de: "die Geborgenheit", en: "a feeling of safety and warmth" },
          { de: "die Verletzlichkeit", en: "vulnerability" },
          { de: "das Vertrauen", en: "trust" },
          { de: "sich öffnen", en: "to open up" },
          { de: "Ich fühle mich von dir gesehen.", en: "I feel seen by you." },
          { de: "Mir ist aufgefallen, dass …", en: "I've noticed that …" },
          { de: "Was beschäftigt dich?", en: "What's on your mind?" },
          { de: "Es fällt mir schwer, darüber zu sprechen.", en: "I find it hard to talk about this." },
        ],
      },
      {
        id: "redewendungen",
        title: "Idioms of love",
        emoji: "🦋",
        words: [
          { de: "Schmetterlinge im Bauch haben", en: "to have butterflies in your stomach" },
          { de: "über beide Ohren verliebt sein", en: "to be head over heels in love" },
          { de: "auf Wolke sieben schweben", en: "to be on cloud nine" },
          { de: "Liebe auf den ersten Blick", en: "love at first sight" },
          { de: "Es hat gefunkt.", en: "Sparks flew." },
          { de: "jemandem einen Korb geben", en: "to turn someone down" },
          { de: "jemanden um den Finger wickeln", en: "to wrap someone around your finger" },
          { de: "die Nase voll haben", en: "to be fed up" },
        ],
      },
      {
        id: "kultur",
        title: "German culture",
        emoji: "🏰",
        words: [
          { de: "die Gemütlichkeit", en: "cosiness, warm comfort" },
          { de: "das Fernweh", en: "longing for faraway places" },
          { de: "Kaffee und Kuchen", en: "afternoon coffee and cake" },
          { de: "der Stammtisch", en: "a regulars' table / meet-up" },
          { de: "die Sonntagsruhe", en: "Sunday quiet time" },
          { de: "die Mülltrennung", en: "waste separation" },
          { de: "das Ehrenamt", en: "volunteer work" },
          { de: "die Pünktlichkeit", en: "punctuality" },
        ],
      },
    ],
  },
  {
    id: "C2",
    name: "Mastery",
    blurb: "Untranslatable words, nuance and poetry.",
    topics: [
      {
        id: "unuebersetzbar",
        title: "Untranslatable words",
        emoji: "✨",
        words: [
          { de: "die Sehnsucht", en: "deep, aching longing" },
          { de: "die Zweisamkeit", en: "togetherness as a couple" },
          { de: "die Torschlusspanik", en: "fear that time is running out (e.g. to settle down)" },
          { de: "das Kopfkino", en: "vividly imagining scenes in your head" },
          { de: "der Kummerspeck", en: "weight gained from emotional eating" },
          { de: "verschlimmbessern", en: "to make worse by trying to improve" },
          { de: "das Fingerspitzengefühl", en: "tact, intuitive sensitivity" },
          { de: "die Schnapsidee", en: "a crazy, half-baked idea" },
        ],
      },
      {
        id: "nuancen",
        title: "Subtle nuances",
        emoji: "🎭",
        words: [
          { de: "Jein.", en: "Yes and no." },
          { de: "Halb so wild.", en: "No big deal." },
          { de: "Mir ist nicht danach.", en: "I'm not in the mood for it." },
          { de: "Das ist nicht ganz ohne.", en: "That's trickier than it looks." },
          { de: "Das kannst du laut sagen!", en: "You can say that again!" },
          { de: "etwas durch die Blume sagen", en: "to say something indirectly" },
          { de: "zwischen den Zeilen lesen", en: "to read between the lines" },
          { de: "Ich würde fast meinen, …", en: "I'd almost venture that …" },
        ],
      },
      {
        id: "poesie",
        title: "Poetry & vows",
        emoji: "📜",
        words: [
          { de: "Du bist mein Ein und Alles.", en: "You are my everything." },
          { de: "Mein Herz schlägt nur für dich.", en: "My heart beats only for you." },
          { de: "in guten wie in schlechten Zeiten", en: "in good times and in bad" },
          { de: "bis dass der Tod uns scheidet", en: "till death do us part" },
          { de: "Wo du hingehst, da will ich auch hingehen.", en: "Where you go, I will go." },
          { de: "Die Liebe höret nimmer auf.", en: "Love never ends. (Luther Bible)" },
          { de: "Es war, als hätt' der Himmel die Erde still geküsst.", en: "It was as if the sky had silently kissed the earth. (Eichendorff)" },
          { de: "Ich kann ohne dich nicht sein.", en: "I cannot be without you." },
        ],
      },
    ],
  },
];

export const DIALOGUES: Dialogue[] = [
  {
    id: "morgen",
    level: "A1",
    title: "Good morning",
    emoji: "☀️",
    lines: [
      { who: "a", de: "Guten Morgen, Schatz! Hast du gut geschlafen?", en: "Good morning, darling! Did you sleep well?" },
      { who: "b", de: "Ja, sehr gut. Und du?", en: "Yes, very well. And you?" },
      { who: "a", de: "Ich bin noch müde. Möchtest du Kaffee?", en: "I'm still tired. Would you like coffee?" },
      { who: "b", de: "Oh ja, bitte! Mit Milch.", en: "Oh yes, please! With milk." },
      { who: "a", de: "Kommt sofort.", en: "Coming right up." },
      { who: "b", de: "Danke, du bist toll!", en: "Thanks, you're great!" },
    ],
  },
  {
    id: "restaurant",
    level: "A2",
    title: "At the restaurant",
    emoji: "🍝",
    lines: [
      { who: "a", de: "Was nimmst du?", en: "What are you having?" },
      { who: "b", de: "Ich nehme die Pasta. Und du?", en: "I'll have the pasta. And you?" },
      { who: "a", de: "Ich weiß noch nicht. Vielleicht die Pizza.", en: "I don't know yet. Maybe the pizza." },
      { who: "b", de: "Sollen wir teilen?", en: "Shall we share?" },
      { who: "a", de: "Gute Idee! Und ein Glas Wein?", en: "Good idea! And a glass of wine?" },
      { who: "b", de: "Gerne. Prost auf uns!", en: "Gladly. Cheers to us!" },
    ],
  },
  {
    id: "wochenende",
    level: "B1",
    title: "Planning the weekend",
    emoji: "📅",
    lines: [
      { who: "a", de: "Was machen wir am Wochenende?", en: "What are we doing at the weekend?" },
      { who: "b", de: "Lass uns wandern gehen!", en: "Let's go hiking!" },
      { who: "a", de: "Und wenn es regnet?", en: "And if it rains?" },
      { who: "b", de: "Dann bleiben wir zu Hause und schauen einen Film.", en: "Then we stay home and watch a film." },
      { who: "a", de: "Perfekt. Ich mache Popcorn.", en: "Perfect. I'll make popcorn." },
      { who: "b", de: "Abgemacht!", en: "Deal!" },
    ],
  },
  {
    id: "versoehnen",
    level: "B1",
    title: "Making up after an argument",
    emoji: "🤝",
    lines: [
      { who: "a", de: "Es tut mir leid wegen gestern.", en: "I'm sorry about yesterday." },
      { who: "b", de: "Mir auch. Ich war gestresst.", en: "Me too. I was stressed." },
      { who: "a", de: "Ich verstehe. Können wir in Ruhe darüber reden?", en: "I understand. Can we talk about it calmly?" },
      { who: "b", de: "Ja, aber zuerst eine Umarmung.", en: "Yes, but first a hug." },
      { who: "a", de: "Komm her.", en: "Come here." },
      { who: "b", de: "Ich hab dich lieb.", en: "I love you. (affectionate)" },
    ],
  },
  {
    id: "einziehen",
    level: "B2",
    title: "Moving in together",
    emoji: "📦",
    lines: [
      { who: "a", de: "Ich habe nachgedacht – sollen wir zusammenziehen?", en: "I've been thinking – should we move in together?" },
      { who: "b", de: "Ehrlich gesagt habe ich mir das auch schon überlegt.", en: "Honestly, I've been considering it too." },
      { who: "a", de: "Wir könnten die Miete teilen und mehr Zeit miteinander verbringen.", en: "We could split the rent and spend more time together." },
      { who: "b", de: "Stimmt, aber wir müssten die Hausarbeit gerecht aufteilen.", en: "True, but we'd have to divide the housework fairly." },
      { who: "a", de: "Abgemacht. Ich koche, du putzt das Bad?", en: "Deal. I cook, you clean the bathroom?" },
      { who: "b", de: "Darüber reden wir noch!", en: "We'll see about that!" },
    ],
  },
  {
    id: "gespraech",
    level: "C1",
    title: "A deep conversation",
    emoji: "🌙",
    lines: [
      { who: "a", de: "Mir ist aufgefallen, dass du in letzter Zeit sehr still bist.", en: "I've noticed you've been very quiet lately." },
      { who: "b", de: "Es fällt mir schwer, darüber zu sprechen, aber die Arbeit belastet mich.", en: "It's hard for me to talk about, but work is weighing on me." },
      { who: "a", de: "Danke, dass du dich mir öffnest. Was genau beschäftigt dich?", en: "Thank you for opening up to me. What exactly is on your mind?" },
      { who: "b", de: "Ich habe das Gefühl, dass meine Arbeit nicht wertgeschätzt wird.", en: "I feel like my work isn't appreciated." },
      { who: "a", de: "Das kann ich gut nachvollziehen. Wie kann ich dich unterstützen?", en: "I can really relate to that. How can I support you?" },
      { who: "b", de: "Allein, dass du mir zuhörst, gibt mir schon Geborgenheit.", en: "Just you listening to me already makes me feel safe." },
    ],
  },
  {
    id: "liebesbrief",
    level: "C2",
    title: "Reading a love letter",
    emoji: "💌",
    lines: [
      { who: "a", de: "Ich habe dir etwas geschrieben – durch die Blume, sozusagen.", en: "I wrote you something – a bit indirectly, so to speak." },
      { who: "b", de: "Jetzt bin ich aber gespannt. Lies vor!", en: "Now I'm curious. Read it out!" },
      { who: "a", de: "„Seit ich dich kenne, hat meine Sehnsucht endlich einen Namen.“", en: "\"Since I met you, my longing finally has a name.\"" },
      { who: "b", de: "Das ist ja beinahe Eichendorff! Wer hätte gedacht, dass du so poetisch bist?", en: "That's almost Eichendorff! Who'd have thought you were so poetic?" },
      { who: "a", de: "Na ja, mit dir an meiner Seite verschlimmbessere ich wenigstens nichts.", en: "Well, with you by my side, at least I don't make things worse by trying." },
      { who: "b", de: "Du bist und bleibst mein Ein und Alles.", en: "You are and will always be my everything." },
    ],
  },
];

export const NOTE_PARTS = {
  openers: ["Hallo Schatz,", "Mein Liebling,", "Guten Morgen, Hase,", "Hey Mäuschen,"],
  middles: [
    { de: "ich denke an dich.", en: "I'm thinking of you." },
    { de: "ich vermisse dich.", en: "I miss you." },
    { de: "du machst mich so glücklich.", en: "you make me so happy." },
    { de: "ich freue mich auf heute Abend.", en: "I'm looking forward to tonight." },
    { de: "ich bin stolz auf dich.", en: "I'm proud of you." },
    { de: "danke, dass es dich gibt.", en: "thank you for being you." },
    { de: "ich habe Schmetterlinge im Bauch.", en: "I have butterflies in my stomach." },
    { de: "mit dir ist jeder Tag schöner.", en: "every day is better with you." },
  ],
  closers: ["Kuss!", "Ich liebe dich.", "Bis bald!", "In Liebe,"],
};

// ---- Helpers ----
export const LEVEL_IDS = LEVELS.map((l) => l.id);
/** Share of a level's words a partner must master to unlock the next level. */
export const UNLOCK_SHARE = 0.7;

export const allTopics = (): Topic[] => LEVELS.flatMap((l) => l.topics);
export const findTopic = (id: string): Topic | undefined => allTopics().find((t) => t.id === id);
export const levelOfTopic = (id: string): Level | undefined =>
  LEVELS.find((l) => l.topics.some((t) => t.id === id));
export const levelWords = (level: Level): Word[] => level.topics.flatMap((t) => t.words);
export const allWords = (): Word[] => allTopics().flatMap((t) => t.words);
