// Course content, organised by CEFR level (A1 → C2).
// Each level is split into two sub-levels (e.g. A1.1, A1.2), each with units.
// Add units or dialogues here; the app picks them up automatically.
// Unit ids must be unique across all levels (progress is stored by id).

export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Word = { de: string; en: string };

export type Tip = { title: string; body: string };

export type Topic = {
  id: string;
  title: string;
  emoji: string;
  /** Short grammar or usage note shown on the unit page. */
  tip: Tip;
  words: Word[];
};

export type SubLevel = {
  id: string; // e.g. "A1.1"
  title: string;
  units: Topic[];
};

export type Level = {
  id: LevelId;
  name: string; // CEFR descriptor
  blurb: string;
  subLevels: SubLevel[];
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
    subLevels: [
      {
        id: "A1.1",
        title: "First words",
        units: [
          {
            id: "kosenamen",
            title: "Pet names & greetings",
            emoji: "💕",
            tip: {
              title: "du or Sie?",
              body: "Use du with your partner, friends and family. Use Sie with strangers and in formal situations: \"Wie geht es Ihnen?\"",
            },
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
            id: "essen",
            title: "Food & drink",
            emoji: "🥨",
            tip: {
              title: "Every noun has a gender",
              body: "Nouns are der (masculine), die (feminine) or das (neuter). Always learn the article with the word: das Frühstück, die Brezel.",
            },
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
        id: "A1.2",
        title: "Daily life",
        units: [
          {
            id: "zuhause",
            title: "Life at home",
            emoji: "🏡",
            tip: {
              title: "Separable verbs",
              body: "Verbs like aufräumen split in a sentence, and the prefix jumps to the end: \"Ich räume die Küche auf.\"",
            },
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
            id: "zeit",
            title: "Days & time",
            emoji: "🕗",
            tip: {
              title: "um, am, im",
              body: "Use um for clock times (um acht Uhr), am for days (am Montag) and im for months (im Mai).",
            },
            words: [
              { de: "Montag", en: "Monday" },
              { de: "das Wochenende", en: "the weekend" },
              { de: "heute", en: "today" },
              { de: "morgen", en: "tomorrow" },
              { de: "Wie spät ist es?", en: "What time is it?" },
              { de: "um acht Uhr", en: "at eight o'clock" },
              { de: "Hast du morgen Zeit?", en: "Are you free tomorrow?" },
              { de: "Bis Samstag!", en: "See you on Saturday!" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "A2",
    name: "Elementary",
    blurb: "Feelings, errands, dates and trips.",
    subLevels: [
      {
        id: "A2.1",
        title: "Feelings & errands",
        units: [
          {
            id: "gefuehle",
            title: "Feelings",
            emoji: "🥰",
            tip: {
              title: "sein + adjective",
              body: "After sein the adjective never changes: \"Ich bin müde.\" \"Wir sind glücklich.\"",
            },
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
            id: "einkaufen",
            title: "Shopping together",
            emoji: "🛒",
            tip: {
              title: "The accusative",
              body: "The direct object is in the accusative. Only der changes, to den: \"Wir brauchen den Käse.\" die and das stay the same.",
            },
            words: [
              { de: "der Supermarkt", en: "the supermarket" },
              { de: "die Einkaufsliste", en: "the shopping list" },
              { de: "teuer", en: "expensive" },
              { de: "billig", en: "cheap" },
              { de: "Was kostet das?", en: "How much does that cost?" },
              { de: "Wir brauchen noch Milch.", en: "We still need milk." },
              { de: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" },
              { de: "Das steht dir gut!", en: "That suits you!" },
            ],
          },
        ],
      },
      {
        id: "A2.2",
        title: "Going out",
        units: [
          {
            id: "date",
            title: "Date night",
            emoji: "🍷",
            tip: {
              title: "Modal verbs",
              body: "wollen, können and möchten send the main verb to the end: \"Wollen wir heute tanzen?\"",
            },
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
            tip: {
              title: "Verb in second place",
              body: "In a statement the verb is always the second element: \"Morgen fahren wir nach Berlin.\"",
            },
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
    ],
  },
  {
    id: "B1",
    name: "Intermediate",
    blurb: "Family, health, plans and making up.",
    subLevels: [
      {
        id: "B1.1",
        title: "People & care",
        units: [
          {
            id: "familie",
            title: "Meeting the family",
            emoji: "👨‍👩‍👧",
            tip: {
              title: "The Perfekt",
              body: "Talk about the past with haben/sein + the past participle at the end: \"Wir haben uns online kennengelernt.\"",
            },
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
            id: "gesundheit",
            title: "Health & care",
            emoji: "🤒",
            tip: {
              title: "Feelings in the dative",
              body: "Many feelings use the dative: \"Mir geht es gut.\" \"Ist dir kalt?\" (mir = to me, dir = to you)",
            },
            words: [
              { de: "Mir geht es nicht gut.", en: "I'm not feeling well." },
              { de: "Ich habe Kopfschmerzen.", en: "I have a headache." },
              { de: "erkältet sein", en: "to have a cold" },
              { de: "der Arzttermin", en: "the doctor's appointment" },
              { de: "die Apotheke", en: "the pharmacy" },
              { de: "Gute Besserung!", en: "Get well soon!" },
              { de: "Soll ich dir einen Tee machen?", en: "Shall I make you a tea?" },
              { de: "Ruh dich aus.", en: "Get some rest." },
            ],
          },
        ],
      },
      {
        id: "B1.2",
        title: "Plans & conflicts",
        units: [
          {
            id: "zukunft",
            title: "Our future",
            emoji: "🔮",
            tip: {
              title: "Konjunktiv II",
              body: "Use würde + infinitive, or wäre/hätte, for hypotheticals: \"Was wäre, wenn wir umziehen würden?\"",
            },
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
            id: "streit",
            title: "Arguing & making up",
            emoji: "🤝",
            tip: {
              title: "Reflexive verbs",
              body: "sich streiten and sich versöhnen need a reflexive pronoun: \"Wir streiten uns selten, aber wir versöhnen uns schnell.\"",
            },
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
    ],
  },
  {
    id: "B2",
    name: "Upper intermediate",
    blurb: "Living together, money, stress and opinions.",
    subLevels: [
      {
        id: "B2.1",
        title: "Sharing a life",
        units: [
          {
            id: "zusammenziehen",
            title: "Moving in together",
            emoji: "📦",
            tip: {
              title: "Subordinate clauses",
              body: "wenn, dass and weil send the verb to the very end: \"Es stört mich, wenn du spät nach Hause kommst.\"",
            },
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
            id: "finanzen",
            title: "Money matters",
            emoji: "💶",
            tip: {
              title: "Verbs + prepositions",
              body: "Many verbs come with a fixed preposition. Learn them together: sparen auf, sich freuen auf, denken an.",
            },
            words: [
              { de: "das gemeinsame Konto", en: "the joint account" },
              { de: "die Ausgaben", en: "the expenses" },
              { de: "sich etwas leisten können", en: "to be able to afford something" },
              { de: "auf etwas sparen", en: "to save up for something" },
              { de: "Wir sollten Prioritäten setzen.", en: "We should set priorities." },
              { de: "Lass uns die Kosten aufteilen.", en: "Let's split the costs." },
              { de: "Das sprengt unser Budget.", en: "That blows our budget." },
              { de: "der Dauerauftrag", en: "the standing order" },
            ],
          },
        ],
      },
      {
        id: "B2.2",
        title: "Pressure & debate",
        units: [
          {
            id: "stress",
            title: "Work & stress",
            emoji: "💼",
            tip: {
              title: "Dative verbs",
              body: "Some verbs always take the dative: helfen, danken, zuhören. \"Ich höre dir zu.\"",
            },
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
            tip: {
              title: "Structuring an argument",
              body: "Use connectors like einerseits … andererseits, deshalb and trotzdem. After deshalb/trotzdem the verb comes next: \"Trotzdem bleibe ich dabei.\"",
            },
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
    ],
  },
  {
    id: "C1",
    name: "Advanced",
    blurb: "Deep talks, values, idioms and culture.",
    subLevels: [
      {
        id: "C1.1",
        title: "Depth & values",
        units: [
          {
            id: "tiefgang",
            title: "Deep conversations",
            emoji: "🌊",
            tip: {
              title: "Nominalisation",
              body: "Advanced German often turns verbs and adjectives into nouns: vertrauen → das Vertrauen, verletzlich → die Verletzlichkeit.",
            },
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
            id: "werte",
            title: "Values & boundaries",
            emoji: "⚖️",
            tip: {
              title: "The passive",
              body: "werden + past participle shifts the focus to the action: \"Die Verantwortung wird geteilt.\"",
            },
            words: [
              { de: "die Gleichberechtigung", en: "equality" },
              { de: "die Verantwortung", en: "responsibility" },
              { de: "auf Augenhöhe", en: "on an equal footing" },
              { de: "Grenzen setzen", en: "to set boundaries" },
              { de: "Kompromissbereitschaft zeigen", en: "to show willingness to compromise" },
              { de: "Mir liegt viel daran, dass …", en: "It matters a lot to me that …" },
              { de: "Wir ziehen an einem Strang.", en: "We're pulling in the same direction." },
              { de: "Das ist für mich nicht verhandelbar.", en: "For me, that's non-negotiable." },
            ],
          },
        ],
      },
      {
        id: "C1.2",
        title: "Idioms & culture",
        units: [
          {
            id: "redewendungen",
            title: "Idioms of love",
            emoji: "🦋",
            tip: {
              title: "Learn idioms as chunks",
              body: "Idioms are rarely literal. Memorise them whole and notice when native speakers use them.",
            },
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
            tip: {
              title: "Compound nouns",
              body: "German glues nouns together, and the last part sets the gender: der Sonntag + die Ruhe → die Sonntagsruhe.",
            },
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
    ],
  },
  {
    id: "C2",
    name: "Mastery",
    blurb: "Untranslatables, humour, nuance and poetry.",
    subLevels: [
      {
        id: "C2.1",
        title: "Words with character",
        units: [
          {
            id: "unuebersetzbar",
            title: "Untranslatable words",
            emoji: "✨",
            tip: {
              title: "Register",
              body: "Words like Kummerspeck or Schnapsidee are colloquial: perfect with your partner, less so in a job interview.",
            },
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
            id: "wortspiele",
            title: "Wordplay & humour",
            emoji: "🤪",
            tip: {
              title: "Modal particles",
              body: "doch, mal, ja and halt soften or colour a sentence: \"Komm doch mal her!\" sounds warmer than \"Komm her!\"",
            },
            words: [
              { de: "Ich verstehe nur Bahnhof.", en: "It's all Greek to me." },
              { de: "Das ist nicht mein Bier.", en: "That's not my problem." },
              { de: "Da steppt der Bär.", en: "It's going to be a wild party." },
              { de: "Tomaten auf den Augen haben", en: "to be oblivious to the obvious" },
              { de: "jemandem auf den Keks gehen", en: "to get on someone's nerves" },
              { de: "sich zum Affen machen", en: "to make a fool of yourself" },
              { de: "Du bist mir einer!", en: "You're quite something!" },
              { de: "Ende gut, alles gut.", en: "All's well that ends well." },
            ],
          },
        ],
      },
      {
        id: "C2.2",
        title: "Fine nuance",
        units: [
          {
            id: "nuancen",
            title: "Subtle nuances",
            emoji: "🎭",
            tip: {
              title: "Hedging",
              body: "Germans soften statements with eigentlich, eher and an sich: \"Eigentlich schon, aber …\"",
            },
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
            tip: {
              title: "Archaic forms",
              body: "Poetry keeps old forms like höret (hört) and hätt' (hätte). Recognise them, but don't use them in everyday speech.",
            },
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

export const levelUnits = (level: Level): Topic[] => level.subLevels.flatMap((s) => s.units);
export const allTopics = (): Topic[] => LEVELS.flatMap(levelUnits);
export const findTopic = (id: string): Topic | undefined => allTopics().find((t) => t.id === id);
export const findLevel = (id: string): Level | undefined => LEVELS.find((l) => l.id === id);
export const levelIndex = (id: LevelId): number => LEVELS.findIndex((l) => l.id === id);
export const levelOfTopic = (id: string): Level | undefined =>
  LEVELS.find((l) => levelUnits(l).some((t) => t.id === id));
export const subLevelOfTopic = (id: string): SubLevel | undefined =>
  LEVELS.flatMap((l) => l.subLevels).find((s) => s.units.some((t) => t.id === id));
export const levelWords = (level: Level): Word[] => levelUnits(level).flatMap((t) => t.words);
export const allWords = (): Word[] => allTopics().flatMap((t) => t.words);
