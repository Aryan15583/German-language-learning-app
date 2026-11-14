import { romanizeMarathi } from "../lib/romanize";

// Course content, organised by CEFR level (A1 → C2).
// Each level is split into two sub-levels (e.g. A1.1, A1.2), each with units.
// Add units or dialogues here; the app picks them up automatically.
// Unit ids must be unique across all levels (progress is stored by id).

export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Word = { de: string; en: string; mr: string };

/**
 * Languages a partner can learn German through:
 * English, Marathi in Devanagari, or Marathi in English letters ("majha tujhyavar prem aahe").
 */
export type Lang = "en" | "mr" | "mr-Latn";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "mr", label: "मराठी" },
  { id: "mr-Latn", label: "Marathi (English letters)" },
];

export const isLang = (x: unknown): x is Lang => LANGS.some((l) => l.id === x);
export const isMarathi = (lang: Lang) => lang !== "en";

/** Text in the learner's language. Works for words and any { en, mr } pair. */
export const meaning = (w: { en: string; mr: string }, lang: Lang) =>
  !w.mr || lang === "en" ? w.en : lang === "mr" ? w.mr : romanizeMarathi(w.mr);

/** For the second line under a meaning: English for Marathi learners, Marathi for English learners. */
export const otherMeaning = (w: { en: string; mr: string }, lang: Lang) => (lang === "en" ? w.mr : w.en);

export type Tip = { title: string; body: string };

export type Topic = {
  id: string;
  title: string;
  emoji: string;
  /** Short grammar or usage note shown on the unit page. */
  tip: Tip;
  /** How this unit's grammar compares with Marathi, in English and Marathi. */
  compare: { en: string; mr: string };
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

export type DialogueLine = { who: "a" | "b"; de: string; en: string; mr: string };

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
            compare: {
              en: "German du/Sie works just like Marathi तू/तुम्ही: du for your partner, Sie for elders and strangers.",
              mr: "जर्मन du/Sie हे मराठी तू/तुम्ही सारखेच आहेत: जोडीदाराला du, मोठ्यांना आणि अनोळखी लोकांना Sie.",
            },
            words: [
              { de: "Schatz", en: "treasure / darling", mr: "सोनू / सोन्या" },
              { de: "Liebling", en: "darling / favourite", mr: "लाडका / लाडकी" },
              { de: "Mäuschen", en: "little mouse (sweetie)", mr: "छोटा उंदीर (लाडाचं नाव)" },
              { de: "Guten Morgen, Schatz!", en: "Good morning, darling!", mr: "सुप्रभात, सोनू!" },
              { de: "Gute Nacht", en: "Good night", mr: "शुभ रात्री" },
              { de: "Schlaf gut!", en: "Sleep well!", mr: "नीट झोप!" },
              { de: "Bis später", en: "See you later", mr: "नंतर भेटू" },
              { de: "Ich liebe dich", en: "I love you", mr: "माझं तुझ्यावर प्रेम आहे" },
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
            compare: {
              en: "Marathi nouns have three genders too (तो/ती/ते), but they rarely match German: die Brezel is feminine, while पाव is masculine.",
              mr: "मराठीतही तीन लिंगं आहेत (तो/ती/ते), पण ती जर्मनशी जुळतातच असं नाही: die Brezel स्त्रीलिंगी, तर 'पाव' पुल्लिंगी.",
            },
            words: [
              { de: "das Frühstück", en: "breakfast", mr: "नाश्ता" },
              { de: "das Abendessen", en: "dinner", mr: "रात्रीचं जेवण" },
              { de: "die Brezel", en: "the pretzel", mr: "प्रेट्झेल (जर्मन पाव)" },
              { de: "lecker", en: "tasty", mr: "चविष्ट" },
              { de: "Ich habe Hunger", en: "I'm hungry", mr: "मला भूक लागली आहे" },
              { de: "Guten Appetit!", en: "Enjoy your meal!", mr: "जेवणाचा आनंद घ्या!" },
              { de: "Noch einen Kaffee?", en: "Another coffee?", mr: "अजून एक कॉफी?" },
              { de: "Das schmeckt super", en: "That tastes great", mr: "हे खूप छान लागतंय" },
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
            compare: {
              en: "Separable verbs feel like Marathi compound verbs (आवरून ठेवणे), but German moves the prefix to the end: \"Ich räume auf.\"",
              mr: "जर्मन separable verbs हे मराठी जोडक्रियापदांसारखे (आवरून ठेवणे) आहेत, पण जर्मनमध्ये उपसर्ग वाक्याच्या शेवटी जातो: \"Ich räume auf.\"",
            },
            words: [
              { de: "die Küche", en: "the kitchen", mr: "स्वयंपाकघर" },
              { de: "das Schlafzimmer", en: "the bedroom", mr: "झोपायची खोली" },
              { de: "das Sofa", en: "the sofa", mr: "सोफा" },
              { de: "kochen", en: "to cook", mr: "स्वयंपाक करणे" },
              { de: "aufräumen", en: "to tidy up", mr: "आवरणे" },
              { de: "Ich bin zu Hause", en: "I'm home", mr: "मी घरी आहे" },
              { de: "Wo sind die Schlüssel?", en: "Where are the keys?", mr: "चाव्या कुठे आहेत?" },
              { de: "Kannst du mir helfen?", en: "Can you help me?", mr: "तू मला मदत करशील का?" },
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
            compare: {
              en: "Marathi adds an ending after the time (आठ वाजता, सोमवारी). German puts a word before it: um acht Uhr, am Montag.",
              mr: "मराठीत वेळेनंतर प्रत्यय लागतो (आठ वाजता, सोमवारी); जर्मनमध्ये आधी शब्द येतो: um acht Uhr, am Montag.",
            },
            words: [
              { de: "Montag", en: "Monday", mr: "सोमवार" },
              { de: "das Wochenende", en: "the weekend", mr: "आठवड्याचा शेवट (वीकेंड)" },
              { de: "heute", en: "today", mr: "आज" },
              { de: "morgen", en: "tomorrow", mr: "उद्या" },
              { de: "Wie spät ist es?", en: "What time is it?", mr: "किती वाजले?" },
              { de: "um acht Uhr", en: "at eight o'clock", mr: "आठ वाजता" },
              { de: "Hast du morgen Zeit?", en: "Are you free tomorrow?", mr: "तुला उद्या वेळ आहे का?" },
              { de: "Bis Samstag!", en: "See you on Saturday!", mr: "शनिवारी भेटू!" },
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
            compare: {
              en: "Marathi adjectives change with gender (दमलेला/दमलेली). German adjectives after sein never change: \"Ich bin müde\" for everyone.",
              mr: "मराठीत विशेषण लिंगानुसार बदलतं (दमलेला/दमलेली); जर्मनमध्ये sein नंतर विशेषण बदलत नाही: \"Ich bin müde\" सगळ्यांसाठी.",
            },
            words: [
              { de: "glücklich", en: "happy", mr: "आनंदी" },
              { de: "müde", en: "tired", mr: "दमलेला / दमलेली" },
              { de: "traurig", en: "sad", mr: "दुःखी" },
              { de: "verliebt", en: "in love", mr: "प्रेमात पडलेला / पडलेली" },
              { de: "eifersüchtig", en: "jealous", mr: "मत्सरी" },
              { de: "Wie fühlst du dich?", en: "How do you feel?", mr: "तुला कसं वाटतंय?" },
              { de: "Ich bin stolz auf dich", en: "I'm proud of you", mr: "मला तुझा अभिमान आहे" },
              { de: "Ich vermisse dich", en: "I miss you", mr: "मला तुझी आठवण येते" },
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
            compare: {
              en: "Marathi marks the object with an ending (दुधाला, चीज); German changes the article instead: der Käse → den Käse.",
              mr: "मराठीत नामाला प्रत्यय लागतो; जर्मनमध्ये त्याऐवजी आर्टिकल बदलतं: der Käse → den Käse.",
            },
            words: [
              { de: "der Supermarkt", en: "the supermarket", mr: "सुपरमार्केट" },
              { de: "die Einkaufsliste", en: "the shopping list", mr: "खरेदीची यादी" },
              { de: "teuer", en: "expensive", mr: "महाग" },
              { de: "billig", en: "cheap", mr: "स्वस्त" },
              { de: "Was kostet das?", en: "How much does that cost?", mr: "याची किंमत किती?" },
              { de: "Wir brauchen noch Milch.", en: "We still need milk.", mr: "आपल्याला अजून दूध हवं आहे." },
              { de: "Kann ich mit Karte zahlen?", en: "Can I pay by card?", mr: "मी कार्डने पैसे देऊ शकतो/शकते का?" },
              { de: "Das steht dir gut!", en: "That suits you!", mr: "हे तुला छान दिसतंय!" },
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
            compare: {
              en: "Marathi puts the verb last (आपण नाचूया का?). German questions start with the verb, but with a modal verb the main verb goes last, just like Marathi: \"Wollen wir tanzen?\"",
              mr: "मराठीत क्रियापद शेवटी येतं (आपण नाचूया का?). जर्मन प्रश्न क्रियापदाने सुरू होतो, पण modal verb असेल तर मुख्य क्रियापद मराठीसारखंच शेवटी जातं: \"Wollen wir tanzen?\"",
            },
            words: [
              { de: "das Kino", en: "the cinema", mr: "चित्रपटगृह" },
              { de: "der Spaziergang", en: "the walk", mr: "फेरफटका" },
              { de: "Hast du heute Abend Zeit?", en: "Are you free tonight?", mr: "तुला आज संध्याकाळी वेळ आहे का?" },
              { de: "Ich lade dich ein", en: "It's my treat", mr: "आज माझ्याकडून ट्रीट" },
              { de: "Prost!", en: "Cheers!", mr: "चिअर्स!" },
              { de: "Du siehst toll aus", en: "You look great", mr: "तू खूप छान दिसतोस / दिसतेस" },
              { de: "Die Rechnung, bitte", en: "The bill, please", mr: "बिल द्या, प्लीज" },
              { de: "Wollen wir tanzen?", en: "Shall we dance?", mr: "आपण नाचूया का?" },
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
            compare: {
              en: "Marathi is verb-last (उद्या आम्ही बर्लिनला जातो). German statements need the verb in second place: \"Morgen fahren wir nach Berlin.\"",
              mr: "मराठीत क्रियापद शेवटी येतं (उद्या आम्ही बर्लिनला जातो). जर्मनमध्ये क्रियापद दुसऱ्या स्थानावर हवं: \"Morgen fahren wir nach Berlin.\"",
            },
            words: [
              { de: "der Bahnhof", en: "the train station", mr: "रेल्वे स्टेशन" },
              { de: "der Koffer", en: "the suitcase", mr: "सूटकेस" },
              { de: "Ein Doppelzimmer, bitte", en: "A double room, please", mr: "दोघांसाठी एक खोली, प्लीज" },
              { de: "Wann fährt der Zug?", en: "When does the train leave?", mr: "ट्रेन किती वाजता सुटते?" },
              { de: "Wir haben uns verlaufen", en: "We're lost", mr: "आम्ही रस्ता चुकलो आहोत" },
              { de: "Mach ein Foto von uns!", en: "Take a photo of us!", mr: "आमचा एक फोटो काढ!" },
              { de: "Ich will hier bleiben", en: "I want to stay here", mr: "मला इथेच राहायचं आहे" },
              { de: "Wie weit ist es?", en: "How far is it?", mr: "ते किती लांब आहे?" },
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
            compare: {
              en: "The Perfekt is like Marathi भेटलो आहोत: a helper verb (haben/sein ≈ आहे) plus a past form, but German sends the past form to the end.",
              mr: "Perfekt हा मराठी 'भेटलो आहोत' सारखा आहे: सहाय्यक क्रियापद (haben/sein ≈ आहे) + भूतकाळी रूप, पण जर्मनमध्ये ते रूप वाक्याच्या शेवटी जातं.",
            },
            words: [
              { de: "die Schwiegereltern", en: "the in-laws", mr: "सासू-सासरे" },
              { de: "Freut mich, Sie kennenzulernen.", en: "Nice to meet you. (formal)", mr: "तुम्हाला भेटून आनंद झाला." },
              { de: "Darf ich Ihnen helfen?", en: "May I help you? (formal)", mr: "मी तुम्हाला मदत करू का?" },
              { de: "Das Essen war köstlich.", en: "The food was delicious.", mr: "जेवण अप्रतिम होतं." },
              { de: "Ich bin ein bisschen nervös.", en: "I'm a bit nervous.", mr: "मला थोडं दडपण आलं आहे." },
              { de: "Wie habt ihr euch kennengelernt?", en: "How did you two meet?", mr: "तुमची ओळख कशी झाली?" },
              { de: "Wir haben uns online kennengelernt.", en: "We met online.", mr: "आमची ओळख ऑनलाइन झाली." },
              { de: "Ihr seid ein schönes Paar.", en: "You're a lovely couple.", mr: "तुमची जोडी छान आहे." },
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
            compare: {
              en: "\"Mir geht es gut\" works just like मला बरं वाटतं: the person who feels it takes the dative (mir ≈ मला).",
              mr: "\"Mir geht es gut\" अगदी 'मला बरं वाटतं' सारखं आहे: भावना अनुभवणारी व्यक्ती mir (≈ मला) या रूपात येते.",
            },
            words: [
              { de: "Mir geht es nicht gut.", en: "I'm not feeling well.", mr: "मला बरं वाटत नाहीये." },
              { de: "Ich habe Kopfschmerzen.", en: "I have a headache.", mr: "माझं डोकं दुखतंय." },
              { de: "erkältet sein", en: "to have a cold", mr: "सर्दी होणे" },
              { de: "der Arzttermin", en: "the doctor's appointment", mr: "डॉक्टरांची अपॉइंटमेंट" },
              { de: "die Apotheke", en: "the pharmacy", mr: "औषधांचं दुकान" },
              { de: "Gute Besserung!", en: "Get well soon!", mr: "लवकर बरा हो / बरी हो!" },
              { de: "Soll ich dir einen Tee machen?", en: "Shall I make you a tea?", mr: "मी तुझ्यासाठी चहा करू का?" },
              { de: "Ruh dich aus.", en: "Get some rest.", mr: "आराम कर." },
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
            compare: {
              en: "Konjunktiv II matches the Marathi conditional: \"Wenn wir umziehen würden\" ≈ आपण दुसरीकडे गेलो तर.",
              mr: "Konjunktiv II हा मराठी '…लो तर / …ला असता' सारखा आहे: \"Wenn wir umziehen würden\" ≈ 'आपण दुसरीकडे गेलो तर'.",
            },
            words: [
              { de: "die Hochzeit", en: "the wedding", mr: "लग्न" },
              { de: "sich verloben", en: "to get engaged", mr: "साखरपुडा करणे" },
              { de: "der Traum", en: "the dream", mr: "स्वप्न" },
              { de: "Wo sehen wir uns in fünf Jahren?", en: "Where do we see ourselves in five years?", mr: "पाच वर्षांनी आपण स्वतःला कुठे पाहतो?" },
              { de: "Ich könnte mir vorstellen, …", en: "I could imagine …", mr: "मी कल्पना करू शकतो/शकते की …" },
              { de: "Wir sollten mehr sparen.", en: "We should save more.", mr: "आपण जास्त बचत करायला हवी." },
              { de: "Was wäre, wenn wir umziehen würden?", en: "What if we moved?", mr: "आपण दुसरीकडे राहायला गेलो तर?" },
              { de: "Kinder haben", en: "to have children", mr: "मुलं होणे" },
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
            compare: {
              en: "German sich is like Marathi स्वतः / एकमेकांशी: \"Wir streiten uns\" ≈ आम्ही एकमेकांशी भांडतो.",
              mr: "जर्मन 'sich' हे मराठी 'स्वतः / एकमेकांशी' सारखं आहे: \"Wir streiten uns\" ≈ 'आम्ही एकमेकांशी भांडतो'.",
            },
            words: [
              { de: "sich streiten", en: "to argue", mr: "भांडणे" },
              { de: "sich versöhnen", en: "to make up", mr: "समेट करणे" },
              { de: "der Kompromiss", en: "the compromise", mr: "तडजोड" },
              { de: "Das habe ich nicht so gemeint.", en: "I didn't mean it like that.", mr: "मला तसं म्हणायचं नव्हतं." },
              { de: "Du hörst mir nicht zu.", en: "You're not listening to me.", mr: "तू माझं ऐकत नाहीयेस." },
              { de: "Können wir in Ruhe darüber reden?", en: "Can we talk about it calmly?", mr: "आपण यावर शांतपणे बोलू शकतो का?" },
              { de: "Ich brauche einen Moment.", en: "I need a moment.", mr: "मला थोडा वेळ हवा आहे." },
              { de: "Verzeihst du mir?", en: "Do you forgive me?", mr: "तू मला माफ करशील का?" },
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
            compare: {
              en: "Good news: after wenn, dass and weil, German puts the verb last, exactly like Marathi: \"…, wenn du spät kommst\" ≈ तू उशिरा येतोस तेव्हा.",
              mr: "खुशखबर: wenn/dass/weil नंतर जर्मनमध्ये क्रियापद शेवटी येतं, अगदी मराठीसारखं: \"…, wenn du spät kommst\" ≈ 'तू उशिरा येतोस तेव्हा'.",
            },
            words: [
              { de: "die gemeinsame Wohnung", en: "the shared flat", mr: "आपलं दोघांचं घर" },
              { de: "der Mietvertrag", en: "the rental contract", mr: "भाडेकरार" },
              { de: "die Miete teilen", en: "to split the rent", mr: "भाडं वाटून घेणे" },
              { de: "die Hausarbeit gerecht aufteilen", en: "to divide the housework fairly", mr: "घरकाम समान वाटून घेणे" },
              { de: "Wir müssen uns absprechen.", en: "We need to coordinate.", mr: "आपल्याला आधी ठरवून घ्यावं लागेल." },
              { de: "Es stört mich, wenn …", en: "It bothers me when …", mr: "मला खटकतं, जेव्हा …" },
              { de: "Das ist mir wichtig.", en: "That's important to me.", mr: "हे माझ्यासाठी महत्त्वाचं आहे." },
              { de: "Hättest du Lust, …?", en: "Would you like to …?", mr: "तुला … करायला आवडेल का?" },
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
            compare: {
              en: "German prepositions come before the noun (auf etwas sparen). Marathi uses postpositions after it (कशासाठी तरी बचत करणे).",
              mr: "जर्मनमध्ये शब्दयोगी अव्यय नामाच्या आधी येतं (auf etwas sparen); मराठीत ते नामानंतर येतं (कशासाठी तरी बचत करणे).",
            },
            words: [
              { de: "das gemeinsame Konto", en: "the joint account", mr: "संयुक्त खाते" },
              { de: "die Ausgaben", en: "the expenses", mr: "खर्च" },
              { de: "sich etwas leisten können", en: "to be able to afford something", mr: "एखादी गोष्ट परवडणे" },
              { de: "auf etwas sparen", en: "to save up for something", mr: "एखाद्या गोष्टीसाठी पैसे साठवणे" },
              { de: "Wir sollten Prioritäten setzen.", en: "We should set priorities.", mr: "आपण प्राधान्यक्रम ठरवायला हवा." },
              { de: "Lass uns die Kosten aufteilen.", en: "Let's split the costs.", mr: "चल, खर्च वाटून घेऊया." },
              { de: "Das sprengt unser Budget.", en: "That blows our budget.", mr: "हे आपल्या बजेटच्या बाहेर आहे." },
              { de: "der Dauerauftrag", en: "the standing order", mr: "नियमित स्वयंचलित पेमेंट" },
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
            compare: {
              en: "\"Ich helfe dir\" uses the dative, just as Marathi says तुला मदत करतो (to you).",
              mr: "\"Ich helfe dir\" मध्ये dative वापरतात, जसं मराठीत 'तुला मदत करतो' म्हणतो.",
            },
            words: [
              { de: "überfordert sein", en: "to be overwhelmed", mr: "दबून जाणे" },
              { de: "die Überstunden", en: "overtime", mr: "जादा कामाचे तास" },
              { de: "abschalten", en: "to switch off / unwind", mr: "डोकं शांत करणे" },
              { de: "der Feierabend", en: "the end of the working day", mr: "कामानंतरचा मोकळा वेळ" },
              { de: "Ich habe einen anstrengenden Tag hinter mir.", en: "I've had an exhausting day.", mr: "आजचा दिवस खूप थकवणारा होता." },
              { de: "Wie kann ich dich unterstützen?", en: "How can I support you?", mr: "मी तुला कशी साथ देऊ?" },
              { de: "Lass uns den Abend genießen.", en: "Let's enjoy the evening.", mr: "चल, संध्याकाळ मजेत घालवूया." },
              { de: "Ich bin für dich da.", en: "I'm there for you.", mr: "मी तुझ्यासोबत आहे." },
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
            compare: {
              en: "\"Meiner Meinung nach\" ≈ माझ्या मते. Here nach comes after the noun, like a Marathi postposition!",
              mr: "\"Meiner Meinung nach\" ≈ 'माझ्या मते'. इथे nach मराठी प्रत्ययासारखा नामानंतर येतो!",
            },
            words: [
              { de: "Meiner Meinung nach …", en: "In my opinion …", mr: "माझ्या मते …" },
              { de: "Da bin ich anderer Meinung.", en: "I see that differently.", mr: "याबाबत माझं मत वेगळं आहे." },
              { de: "Einerseits …, andererseits …", en: "On the one hand …, on the other …", mr: "एकीकडे …, तर दुसरीकडे …" },
              { de: "Das kommt darauf an.", en: "It depends.", mr: "ते परिस्थितीवर अवलंबून आहे." },
              { de: "Du hast nicht ganz unrecht.", en: "You're not entirely wrong.", mr: "तुझं अगदीच चुकीचं नाहीये." },
              { de: "Ich gebe zu, dass …", en: "I admit that …", mr: "मी मान्य करतो/करते की …" },
              { de: "überzeugen", en: "to convince", mr: "पटवून देणे" },
              { de: "der Standpunkt", en: "the point of view", mr: "दृष्टिकोन" },
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
            compare: {
              en: "Marathi makes nouns with -पणा/-ता (हळवा → हळवेपणा). German uses -keit/-heit/-ung (verletzlich → die Verletzlichkeit).",
              mr: "मराठीत -पणा/-ता लावून नाम बनतं (हळवा → हळवेपणा); जर्मनमध्ये -keit/-heit/-ung लावतात (verletzlich → die Verletzlichkeit).",
            },
            words: [
              { de: "die Geborgenheit", en: "a feeling of safety and warmth", mr: "सुरक्षित आणि उबदार वाटण्याची भावना" },
              { de: "die Verletzlichkeit", en: "vulnerability", mr: "हळवेपणा" },
              { de: "das Vertrauen", en: "trust", mr: "विश्वास" },
              { de: "sich öffnen", en: "to open up", mr: "मन मोकळं करणे" },
              { de: "Ich fühle mich von dir gesehen.", en: "I feel seen by you.", mr: "तू मला खऱ्या अर्थाने समजून घेतोस/घेतेस असं वाटतं." },
              { de: "Mir ist aufgefallen, dass …", en: "I've noticed that …", mr: "माझ्या लक्षात आलं की …" },
              { de: "Was beschäftigt dich?", en: "What's on your mind?", mr: "तुझ्या मनात काय चाललंय?" },
              { de: "Es fällt mir schwer, darüber zu sprechen.", en: "I find it hard to talk about this.", mr: "यावर बोलणं मला कठीण जातंय." },
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
            compare: {
              en: "The German passive \"wird geteilt\" ≈ Marathi वाटली जाते: a helper verb plus a participle in both languages.",
              mr: "जर्मन passive \"wird geteilt\" ≈ मराठी 'वाटली जाते': दोन्ही भाषांत सहाय्यक क्रियापद + धातुरूप.",
            },
            words: [
              { de: "die Gleichberechtigung", en: "equality", mr: "समानता" },
              { de: "die Verantwortung", en: "responsibility", mr: "जबाबदारी" },
              { de: "auf Augenhöhe", en: "on an equal footing", mr: "बरोबरीच्या नात्याने" },
              { de: "Grenzen setzen", en: "to set boundaries", mr: "मर्यादा ठरवणे" },
              { de: "Kompromissbereitschaft zeigen", en: "to show willingness to compromise", mr: "तडजोडीची तयारी दाखवणे" },
              { de: "Mir liegt viel daran, dass …", en: "It matters a lot to me that …", mr: "माझ्यासाठी हे खूप महत्त्वाचं आहे की …" },
              { de: "Wir ziehen an einem Strang.", en: "We're pulling in the same direction.", mr: "आपण एकाच दिशेने प्रयत्न करतो." },
              { de: "Das ist für mich nicht verhandelbar.", en: "For me, that's non-negotiable.", mr: "याबाबत मी तडजोड करणार नाही." },
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
            compare: {
              en: "Some idioms match nicely: \"jemanden um den Finger wickeln\" ≈ बोटावर नाचवणे. Fingers in both!",
              mr: "काही वाक्प्रचार छान जुळतात: \"jemanden um den Finger wickeln\" ≈ 'बोटावर नाचवणे' — दोन्हींत बोटच!",
            },
            words: [
              { de: "Schmetterlinge im Bauch haben", en: "to have butterflies in your stomach", mr: "पोटात फुलपाखरं उडणे" },
              { de: "über beide Ohren verliebt sein", en: "to be head over heels in love", mr: "प्रेमात आकंठ बुडणे" },
              { de: "auf Wolke sieben schweben", en: "to be on cloud nine", mr: "आनंदाने हवेत तरंगणे" },
              { de: "Liebe auf den ersten Blick", en: "love at first sight", mr: "पहिल्या नजरेतलं प्रेम" },
              { de: "Es hat gefunkt.", en: "Sparks flew.", mr: "सूर जुळले." },
              { de: "jemandem einen Korb geben", en: "to turn someone down", mr: "एखाद्याला नकार देणे" },
              { de: "jemanden um den Finger wickeln", en: "to wrap someone around your finger", mr: "एखाद्याला बोटावर नाचवणे" },
              { de: "die Nase voll haben", en: "to be fed up", mr: "वैतागणे" },
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
            compare: {
              en: "German compound nouns work like Marathi समास: Sonntag + Ruhe → Sonntagsruhe, just as देव + घर → देवघर.",
              mr: "जर्मन संयुक्त शब्द मराठी समासासारखे आहेत: Sonntag + Ruhe → Sonntagsruhe, जसं देव + घर → देवघर.",
            },
            words: [
              { de: "die Gemütlichkeit", en: "cosiness, warm comfort", mr: "घरगुती उबदारपणा" },
              { de: "das Fernweh", en: "longing for faraway places", mr: "दूरदेशी जाण्याची ओढ" },
              { de: "Kaffee und Kuchen", en: "afternoon coffee and cake", mr: "दुपारची कॉफी आणि केक" },
              { de: "der Stammtisch", en: "a regulars' table / meet-up", mr: "नेहमीच्या मित्रांचा अड्डा" },
              { de: "die Sonntagsruhe", en: "Sunday quiet time", mr: "रविवारची शांतता" },
              { de: "die Mülltrennung", en: "waste separation", mr: "कचऱ्याचं वर्गीकरण" },
              { de: "das Ehrenamt", en: "volunteer work", mr: "स्वयंसेवी काम" },
              { de: "die Pünktlichkeit", en: "punctuality", mr: "वक्तशीरपणा" },
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
            compare: {
              en: "Marathi has untranslatables too: हुरहुर is close to Sehnsucht. Try explaining each one to your partner!",
              mr: "मराठीतही असे शब्द आहेत — 'हुरहुर' हा Sehnsucht च्या जवळ आहे. एकमेकांना समजावून सांगा!",
            },
            words: [
              { de: "die Sehnsucht", en: "deep, aching longing", mr: "तीव्र ओढ, हुरहुर" },
              { de: "die Zweisamkeit", en: "togetherness as a couple", mr: "दोघांचं एकत्र असणं" },
              { de: "die Torschlusspanik", en: "fear that time is running out (e.g. to settle down)", mr: "वेळ निघून जाण्याची भीती" },
              { de: "das Kopfkino", en: "vividly imagining scenes in your head", mr: "मनातल्या मनात दृश्यं रंगवणे" },
              { de: "der Kummerspeck", en: "weight gained from emotional eating", mr: "दुःखात खाऊन वाढलेलं वजन" },
              { de: "verschlimmbessern", en: "to make worse by trying to improve", mr: "सुधारायला जाऊन बिघडवणे" },
              { de: "das Fingerspitzengefühl", en: "tact, intuitive sensitivity", mr: "नाजूक परिस्थिती हाताळण्याची समज" },
              { de: "die Schnapsidee", en: "a crazy, half-baked idea", mr: "वेडगळ कल्पना" },
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
            compare: {
              en: "German doch/mal/ja work like Marathi ना/तर/च: \"Komm doch mal her!\" ≈ ये ना इकडे!",
              mr: "जर्मन doch/mal/ja हे मराठी 'ना/तर/च' सारखे आहेत: \"Komm doch mal her!\" ≈ 'ये ना इकडे!'",
            },
            words: [
              { de: "Ich verstehe nur Bahnhof.", en: "It's all Greek to me.", mr: "माझ्या डोक्यावरून गेलं." },
              { de: "Das ist nicht mein Bier.", en: "That's not my problem.", mr: "ती माझी डोकेदुखी नाही." },
              { de: "Da steppt der Bär.", en: "It's going to be a wild party.", mr: "तिथे जोरदार धमाल असणार." },
              { de: "Tomaten auf den Augen haben", en: "to be oblivious to the obvious", mr: "डोळ्यांसमोरचं न दिसणे" },
              { de: "jemandem auf den Keks gehen", en: "to get on someone's nerves", mr: "एखाद्याचं डोकं खाणे" },
              { de: "sich zum Affen machen", en: "to make a fool of yourself", mr: "स्वतःचं हसं करून घेणे" },
              { de: "Du bist mir einer!", en: "You're quite something!", mr: "तू पण ना, कमाल आहेस!" },
              { de: "Ende gut, alles gut.", en: "All's well that ends well.", mr: "शेवट गोड तर सगळं गोड." },
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
            compare: {
              en: "Jein is the German हो-नाही. Germans hedge with eigentlich, much like Marathi तसं पाहिलं तर…",
              mr: "'Jein' म्हणजे जर्मन 'हो-नाही'. जर्मन लोक 'eigentlich' वापरतात, जसं आपण 'तसं पाहिलं तर…' म्हणतो.",
            },
            words: [
              { de: "Jein.", en: "Yes and no.", mr: "हो-नाही" },
              { de: "Halb so wild.", en: "No big deal.", mr: "एवढं काही विशेष नाही." },
              { de: "Mir ist nicht danach.", en: "I'm not in the mood for it.", mr: "माझा मूड नाहीये." },
              { de: "Das ist nicht ganz ohne.", en: "That's trickier than it looks.", mr: "हे दिसतं तितकं सोपं नाही." },
              { de: "Das kannst du laut sagen!", en: "You can say that again!", mr: "अगदी बरोबर बोललास / बोललीस!" },
              { de: "etwas durch die Blume sagen", en: "to say something indirectly", mr: "आडवळणाने सांगणे" },
              { de: "zwischen den Zeilen lesen", en: "to read between the lines", mr: "ओळींमधला अर्थ समजणे" },
              { de: "Ich würde fast meinen, …", en: "I'd almost venture that …", mr: "मला जवळजवळ असं वाटतं की …" },
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
            compare: {
              en: "Like Marathi संतकाव्य, German poetry keeps old forms (höret, hätt'). Enjoy them, but don't use them in daily talk.",
              mr: "मराठी संतकाव्यासारखंच जर्मन काव्यही जुनी रूपं वापरतं (höret, hätt'). त्यांचा आनंद घ्या, पण रोजच्या बोलण्यात वापरू नका.",
            },
            words: [
              { de: "Du bist mein Ein und Alles.", en: "You are my everything.", mr: "तूच माझं सर्वस्व आहेस." },
              { de: "Mein Herz schlägt nur für dich.", en: "My heart beats only for you.", mr: "माझं हृदय फक्त तुझ्यासाठी धडधडतं." },
              { de: "in guten wie in schlechten Zeiten", en: "in good times and in bad", mr: "सुखात आणि दुःखात" },
              { de: "bis dass der Tod uns scheidet", en: "till death do us part", mr: "मरणापर्यंत साथ" },
              { de: "Wo du hingehst, da will ich auch hingehen.", en: "Where you go, I will go.", mr: "जिथे तू जाशील, तिथे मीही येईन." },
              { de: "Die Liebe höret nimmer auf.", en: "Love never ends. (Luther Bible)", mr: "प्रेम कधीच संपत नाही." },
              { de: "Es war, als hätt' der Himmel die Erde still geküsst.", en: "It was as if the sky had silently kissed the earth. (Eichendorff)", mr: "जणू आकाशाने पृथ्वीचं हळूच चुंबन घेतलं." },
              { de: "Ich kann ohne dich nicht sein.", en: "I cannot be without you.", mr: "मी तुझ्याशिवाय राहू शकत नाही." },
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
      { who: "a", de: "Guten Morgen, Schatz! Hast du gut geschlafen?", en: "Good morning, darling! Did you sleep well?", mr: "सुप्रभात, सोनू! झोप नीट लागली का?" },
      { who: "b", de: "Ja, sehr gut. Und du?", en: "Yes, very well. And you?", mr: "हो, खूप छान. आणि तुला?" },
      { who: "a", de: "Ich bin noch müde. Möchtest du Kaffee?", en: "I'm still tired. Would you like coffee?", mr: "मी अजून दमलेलो/दमलेली आहे. कॉफी घेशील का?" },
      { who: "b", de: "Oh ja, bitte! Mit Milch.", en: "Oh yes, please! With milk.", mr: "अरे हो, प्लीज! दूध घालून." },
      { who: "a", de: "Kommt sofort.", en: "Coming right up.", mr: "आलीच लगेच." },
      { who: "b", de: "Danke, du bist toll!", en: "Thanks, you're great!", mr: "धन्यवाद, तू खूप भारी आहेस!" },
    ],
  },
  {
    id: "restaurant",
    level: "A2",
    title: "At the restaurant",
    emoji: "🍝",
    lines: [
      { who: "a", de: "Was nimmst du?", en: "What are you having?", mr: "तू काय घेणार?" },
      { who: "b", de: "Ich nehme die Pasta. Und du?", en: "I'll have the pasta. And you?", mr: "मी पास्ता घेतो/घेते. आणि तू?" },
      { who: "a", de: "Ich weiß noch nicht. Vielleicht die Pizza.", en: "I don't know yet. Maybe the pizza.", mr: "अजून ठरवलं नाही. कदाचित पिझ्झा." },
      { who: "b", de: "Sollen wir teilen?", en: "Shall we share?", mr: "आपण वाटून घेऊया का?" },
      { who: "a", de: "Gute Idee! Und ein Glas Wein?", en: "Good idea! And a glass of wine?", mr: "छान कल्पना! आणि एक ग्लास वाईन?" },
      { who: "b", de: "Gerne. Prost auf uns!", en: "Gladly. Cheers to us!", mr: "नक्कीच. आपल्या दोघांसाठी चिअर्स!" },
    ],
  },
  {
    id: "wochenende",
    level: "B1",
    title: "Planning the weekend",
    emoji: "📅",
    lines: [
      { who: "a", de: "Was machen wir am Wochenende?", en: "What are we doing at the weekend?", mr: "वीकेंडला आपण काय करायचं?" },
      { who: "b", de: "Lass uns wandern gehen!", en: "Let's go hiking!", mr: "चल, ट्रेकिंगला जाऊया!" },
      { who: "a", de: "Und wenn es regnet?", en: "And if it rains?", mr: "आणि पाऊस पडला तर?" },
      { who: "b", de: "Dann bleiben wir zu Hause und schauen einen Film.", en: "Then we stay home and watch a film.", mr: "मग घरीच राहून एखादा चित्रपट पाहू." },
      { who: "a", de: "Perfekt. Ich mache Popcorn.", en: "Perfect. I'll make popcorn.", mr: "मस्त. मी पॉपकॉर्न बनवतो/बनवते." },
      { who: "b", de: "Abgemacht!", en: "Deal!", mr: "ठरलं!" },
    ],
  },
  {
    id: "versoehnen",
    level: "B1",
    title: "Making up after an argument",
    emoji: "🤝",
    lines: [
      { who: "a", de: "Es tut mir leid wegen gestern.", en: "I'm sorry about yesterday.", mr: "कालच्याबद्दल माफ कर." },
      { who: "b", de: "Mir auch. Ich war gestresst.", en: "Me too. I was stressed.", mr: "मलाही माफ कर. मी तणावात होतो/होते." },
      { who: "a", de: "Ich verstehe. Können wir in Ruhe darüber reden?", en: "I understand. Can we talk about it calmly?", mr: "मी समजू शकतो/शकते. आपण यावर शांतपणे बोलू शकतो का?" },
      { who: "b", de: "Ja, aber zuerst eine Umarmung.", en: "Yes, but first a hug.", mr: "हो, पण आधी एक मिठी." },
      { who: "a", de: "Komm her.", en: "Come here.", mr: "इकडे ये." },
      { who: "b", de: "Ich hab dich lieb.", en: "I love you. (affectionate)", mr: "माझं तुझ्यावर खूप प्रेम आहे." },
    ],
  },
  {
    id: "einziehen",
    level: "B2",
    title: "Moving in together",
    emoji: "📦",
    lines: [
      { who: "a", de: "Ich habe nachgedacht – sollen wir zusammenziehen?", en: "I've been thinking – should we move in together?", mr: "मी विचार करत होतो/होते — आपण एकत्र राहायला जायचं का?" },
      { who: "b", de: "Ehrlich gesagt habe ich mir das auch schon überlegt.", en: "Honestly, I've been considering it too.", mr: "खरं सांगू तर, मीही याचा विचार केला होता." },
      { who: "a", de: "Wir könnten die Miete teilen und mehr Zeit miteinander verbringen.", en: "We could split the rent and spend more time together.", mr: "आपण भाडं वाटून घेऊ आणि एकमेकांसोबत जास्त वेळ घालवू." },
      { who: "b", de: "Stimmt, aber wir müssten die Hausarbeit gerecht aufteilen.", en: "True, but we'd have to divide the housework fairly.", mr: "बरोबर, पण आपल्याला घरकाम समान वाटून घ्यावं लागेल." },
      { who: "a", de: "Abgemacht. Ich koche, du putzt das Bad?", en: "Deal. I cook, you clean the bathroom?", mr: "ठरलं. मी स्वयंपाक करतो/करते, तू बाथरूम साफ करशील?" },
      { who: "b", de: "Darüber reden wir noch!", en: "We'll see about that!", mr: "ते आपण नंतर बघू!" },
    ],
  },
  {
    id: "gespraech",
    level: "C1",
    title: "A deep conversation",
    emoji: "🌙",
    lines: [
      { who: "a", de: "Mir ist aufgefallen, dass du in letzter Zeit sehr still bist.", en: "I've noticed you've been very quiet lately.", mr: "माझ्या लक्षात आलं की तू हल्ली खूप शांत असतोस/असतेस." },
      { who: "b", de: "Es fällt mir schwer, darüber zu sprechen, aber die Arbeit belastet mich.", en: "It's hard for me to talk about, but work is weighing on me.", mr: "यावर बोलणं मला कठीण जातंय, पण कामाचा ताण आहे." },
      { who: "a", de: "Danke, dass du dich mir öffnest. Was genau beschäftigt dich?", en: "Thank you for opening up to me. What exactly is on your mind?", mr: "मन मोकळं केल्याबद्दल धन्यवाद. नेमकं काय सलतंय?" },
      { who: "b", de: "Ich habe das Gefühl, dass meine Arbeit nicht wertgeschätzt wird.", en: "I feel like my work isn't appreciated.", mr: "मला असं वाटतं की माझ्या कामाची कदर होत नाही." },
      { who: "a", de: "Das kann ich gut nachvollziehen. Wie kann ich dich unterstützen?", en: "I can really relate to that. How can I support you?", mr: "मी ते नीट समजू शकतो/शकते. मी तुला कशी साथ देऊ?" },
      { who: "b", de: "Allein, dass du mir zuhörst, gibt mir schon Geborgenheit.", en: "Just you listening to me already makes me feel safe.", mr: "तू फक्त ऐकतोस/ऐकतेस, यानेच मला सुरक्षित वाटतं." },
    ],
  },
  {
    id: "liebesbrief",
    level: "C2",
    title: "Reading a love letter",
    emoji: "💌",
    lines: [
      { who: "a", de: "Ich habe dir etwas geschrieben – durch die Blume, sozusagen.", en: "I wrote you something – a bit indirectly, so to speak.", mr: "मी तुझ्यासाठी काहीतरी लिहिलंय — थोडं आडवळणाने, म्हणूया." },
      { who: "b", de: "Jetzt bin ich aber gespannt. Lies vor!", en: "Now I'm curious. Read it out!", mr: "आता तर उत्सुकता वाढली. वाचून दाखव!" },
      { who: "a", de: "„Seit ich dich kenne, hat meine Sehnsucht endlich einen Namen.“", en: "\"Since I met you, my longing finally has a name.\"", mr: "„तुला भेटल्यापासून माझ्या हुरहुरीला अखेर नाव मिळालं.“" },
      { who: "b", de: "Das ist ja beinahe Eichendorff! Wer hätte gedacht, dass du so poetisch bist?", en: "That's almost Eichendorff! Who'd have thought you were so poetic?", mr: "हे तर जवळजवळ आयशेनडॉर्फसारखं आहे! तू इतकं काव्यमय असशील असं वाटलं नव्हतं." },
      { who: "a", de: "Na ja, mit dir an meiner Seite verschlimmbessere ich wenigstens nichts.", en: "Well, with you by my side, at least I don't make things worse by trying.", mr: "बरं, तू सोबत असताना निदान मी सुधारायला जाऊन काही बिघडवत नाही." },
      { who: "b", de: "Du bist und bleibst mein Ein und Alles.", en: "You are and will always be my everything.", mr: "तू माझं सर्वस्व आहेस आणि नेहमी राहशील." },
    ],
  },
];

export const NOTE_PARTS = {
  openers: ["Hallo Schatz,", "Mein Liebling,", "Guten Morgen, Hase,", "Hey Mäuschen,"],
  middles: [
    { de: "ich denke an dich.", en: "I'm thinking of you.", mr: "मी तुझाच विचार करतोय/करतेय." },
    { de: "ich vermisse dich.", en: "I miss you.", mr: "मला तुझी आठवण येतेय." },
    { de: "du machst mich so glücklich.", en: "you make me so happy.", mr: "तू मला खूप आनंदी ठेवतोस/ठेवतेस." },
    { de: "ich freue mich auf heute Abend.", en: "I'm looking forward to tonight.", mr: "मी आजच्या संध्याकाळची वाट पाहतोय/पाहतेय." },
    { de: "ich bin stolz auf dich.", en: "I'm proud of you.", mr: "मला तुझा अभिमान आहे." },
    { de: "danke, dass es dich gibt.", en: "thank you for being you.", mr: "तू माझ्या आयुष्यात आहेस, याबद्दल धन्यवाद." },
    { de: "ich habe Schmetterlinge im Bauch.", en: "I have butterflies in my stomach.", mr: "माझ्या पोटात फुलपाखरं उडतायत." },
    { de: "mit dir ist jeder Tag schöner.", en: "every day is better with you.", mr: "तुझ्यासोबत प्रत्येक दिवस अधिक सुंदर आहे." },
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
