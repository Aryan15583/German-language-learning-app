// Extra practice content: real-life role-plays, "Guess what I'd say", grammar bites,
// Marathi ↔ German comparisons and the love-note phrasebook.
import type { LevelId, Word } from "./levels";

type Text2 = { en: string; mr: string };

// ---- Real-life role-play: each turn is a task; you build the German yourself ----
export type RoleTurn = { who: "a" | "b"; task: Text2; de: string };
export type Roleplay = { id: string; emoji: string; title: string; level: LevelId; roles: { a: Text2; b: Text2 }; turns: RoleTurn[] };

const r = (en: string, mr: string): Text2 => ({ en, mr });

export const ROLEPLAYS: Roleplay[] = [
  {
    id: "cafe",
    emoji: "☕",
    title: "At a German café",
    level: "A1",
    roles: { a: r("Customer", "ग्राहक"), b: r("Waiter", "वेटर") },
    turns: [
      { who: "b", task: r("Greet the customer and ask what they'd like.", "ग्राहकाला नमस्कार करा आणि काय हवं ते विचारा."), de: "Hallo! Was möchten Sie?" },
      { who: "a", task: r("Order two coffees and ask for the bill.", "दोन कॉफी मागवा आणि बिल मागा."), de: "Zwei Kaffee, bitte. Und die Rechnung, bitte." },
      { who: "b", task: r("Say it costs seven euros.", "सात युरो झाले असं सांगा."), de: "Das macht sieben Euro." },
      { who: "a", task: r("Pay and say thank you.", "पैसे द्या आणि धन्यवाद म्हणा."), de: "Hier, bitte. Danke schön!" },
    ],
  },
  {
    id: "supermarkt",
    emoji: "🛒",
    title: "Supermarket",
    level: "A1",
    roles: { a: r("Shopper", "खरेदी करणारा"), b: r("Shop assistant", "दुकानातला कर्मचारी") },
    turns: [
      { who: "a", task: r("Ask where the milk is.", "दूध कुठे आहे ते विचारा."), de: "Entschuldigung, wo ist die Milch?" },
      { who: "b", task: r("Say it's at the back on the left.", "मागे डावीकडे आहे असं सांगा."), de: "Hinten links." },
      { who: "a", task: r("Ask if they have fresh bread.", "ताजा ब्रेड आहे का ते विचारा."), de: "Haben Sie frisches Brot?" },
      { who: "b", task: r("Say yes, over there.", "हो, तिकडे आहे असं सांगा."), de: "Ja, da drüben." },
    ],
  },
  {
    id: "bahnhof",
    emoji: "🚆",
    title: "Train station",
    level: "A2",
    roles: { a: r("Traveller", "प्रवासी"), b: r("Ticket clerk", "तिकीट क्लार्क") },
    turns: [
      { who: "a", task: r("Ask for a ticket to Hamburg.", "हॅम्बुर्गचं एक तिकीट मागा."), de: "Eine Fahrkarte nach Hamburg, bitte." },
      { who: "b", task: r("Ask: one way or return?", "विचारा: एकेरी की परतीचं?"), de: "Einfach oder hin und zurück?" },
      { who: "a", task: r("Say return, please.", "परतीचं, प्लीज असं सांगा."), de: "Hin und zurück, bitte." },
      { who: "b", task: r("Say it leaves from platform seven.", "गाडी सात नंबरच्या फलाटावरून सुटेल असं सांगा."), de: "Gleis sieben." },
    ],
  },
  {
    id: "hotel",
    emoji: "🏨",
    title: "Hotel",
    level: "A2",
    roles: { a: r("Guest", "पाहुणा"), b: r("Receptionist", "रिसेप्शनिस्ट") },
    turns: [
      { who: "a", task: r("Say you have a reservation in the name of Patil.", "पाटील नावाने आरक्षण आहे असं सांगा."), de: "Ich habe eine Reservierung auf den Namen Patil." },
      { who: "b", task: r("Ask for their passport.", "त्यांचा पासपोर्ट मागा."), de: "Ihren Pass, bitte." },
      { who: "a", task: r("Ask when breakfast is.", "नाश्ता कधी असतो ते विचारा."), de: "Wann gibt es Frühstück?" },
      { who: "b", task: r("Say from seven to ten.", "सात ते दहा असं सांगा."), de: "Von sieben bis zehn Uhr." },
    ],
  },
  {
    id: "arzt",
    emoji: "🏥",
    title: "At the doctor's",
    level: "A2",
    roles: { a: r("Patient", "रुग्ण"), b: r("Doctor", "डॉक्टर") },
    turns: [
      { who: "b", task: r("Ask what's wrong.", "काय त्रास होतोय ते विचारा."), de: "Was fehlt Ihnen?" },
      { who: "a", task: r("Say you have a headache and a fever.", "डोकं दुखतंय आणि ताप आहे असं सांगा."), de: "Ich habe Kopfschmerzen und Fieber." },
      { who: "b", task: r("Ask since when.", "केव्हापासून ते विचारा."), de: "Seit wann?" },
      { who: "a", task: r("Say since yesterday.", "कालपासून असं सांगा."), de: "Seit gestern." },
    ],
  },
  {
    id: "wohnung",
    emoji: "🏠",
    title: "Apartment viewing",
    level: "B1",
    roles: { a: r("Tenant", "भाडेकरू"), b: r("Landlord", "घरमालक") },
    turns: [
      { who: "a", task: r("Ask how much the rent is.", "भाडं किती आहे ते विचारा."), de: "Wie hoch ist die Miete?" },
      { who: "b", task: r("Say nine hundred euros, including heating.", "हीटिंगसह नऊशे युरो असं सांगा."), de: "Neunhundert Euro warm." },
      { who: "a", task: r("Ask if pets are allowed.", "पाळीव प्राणी चालतात का ते विचारा."), de: "Sind Haustiere erlaubt?" },
      { who: "b", task: r("Say unfortunately not.", "दुर्दैवाने नाही असं सांगा."), de: "Leider nicht." },
    ],
  },
  {
    id: "job",
    emoji: "💼",
    title: "Job interview",
    level: "B1",
    roles: { a: r("Applicant", "उमेदवार"), b: r("Interviewer", "मुलाखत घेणारा") },
    turns: [
      { who: "b", task: r("Ask them to tell you about themselves.", "स्वतःबद्दल सांगायला सांगा."), de: "Erzählen Sie etwas über sich." },
      { who: "a", task: r("Say you are a software developer from Mumbai.", "तुम्ही मुंबईचे सॉफ्टवेअर डेव्हलपर आहात असं सांगा."), de: "Ich bin Softwareentwickler aus Mumbai." },
      { who: "b", task: r("Ask why they want to work in Berlin.", "बर्लिनमध्ये का काम करायचंय ते विचारा."), de: "Warum möchten Sie in Berlin arbeiten?" },
      { who: "a", task: r("Say because Berlin is a great city.", "कारण बर्लिन एक छान शहर आहे असं सांगा."), de: "Weil Berlin eine tolle Stadt ist." },
    ],
  },
  {
    id: "eltern",
    emoji: "👪",
    title: "Meeting your partner's parents",
    level: "A2",
    roles: { a: r("Guest", "पाहुणा"), b: r("Parent", "पालक") },
    turns: [
      { who: "a", task: r("Greet politely and thank them for the invitation.", "नम्रपणे नमस्कार करा आणि आमंत्रणाबद्दल धन्यवाद द्या."), de: "Guten Tag! Vielen Dank für die Einladung." },
      { who: "b", task: r("Say welcome, come in.", "स्वागत आहे, आत या असं सांगा."), de: "Herzlich willkommen, kommen Sie herein!" },
      { who: "a", task: r("Say the food is very tasty.", "जेवण खूप छान आहे असं सांगा."), de: "Das Essen ist sehr lecker." },
      { who: "b", task: r("Offer them some more.", "अजून काही हवं का ते विचारा."), de: "Möchten Sie noch etwas?" },
    ],
  },
  {
    id: "geburtstag",
    emoji: "🎂",
    title: "Birthday",
    level: "A1",
    roles: { a: r("Friend", "मित्र"), b: r("Birthday person", "वाढदिवस असलेली व्यक्ती") },
    turns: [
      { who: "a", task: r("Wish them a happy birthday.", "वाढदिवसाच्या शुभेच्छा द्या."), de: "Alles Gute zum Geburtstag!" },
      { who: "b", task: r("Say thank you, how sweet of you.", "धन्यवाद, किती गोड आहेस असं सांगा."), de: "Danke, wie lieb von dir!" },
      { who: "a", task: r("Say this is a present for you.", "हे तुझ्यासाठी गिफ्ट आहे असं सांगा."), de: "Das ist ein Geschenk für dich." },
      { who: "b", task: r("Say you are very happy about it.", "खूप आनंद झाला असं सांगा."), de: "Ich freue mich sehr." },
    ],
  },
  {
    id: "date",
    emoji: "❤️",
    title: "Date",
    level: "A2",
    roles: { a: r("Partner A", "जोडीदार A"), b: r("Partner B", "जोडीदार B") },
    turns: [
      { who: "a", task: r("Ask if they'd like to go to the cinema tonight.", "आज रात्री सिनेमाला जायचं का ते विचारा."), de: "Möchtest du heute Abend ins Kino gehen?" },
      { who: "b", task: r("Say gladly, and ask at what time.", "आवडेल असं सांगा आणि किती वाजता ते विचारा."), de: "Gern! Um wie viel Uhr?" },
      { who: "a", task: r("Say at eight o'clock.", "आठ वाजता असं सांगा."), de: "Um acht Uhr." },
      { who: "b", task: r("Say you're looking forward to it.", "मी उत्सुक आहे असं सांगा."), de: "Ich freue mich darauf." },
    ],
  },
  {
    id: "freunde",
    emoji: "🗣️",
    title: "Making friends",
    level: "A2",
    roles: { a: r("Newcomer", "नवीन व्यक्ती"), b: r("Local", "स्थानिक") },
    turns: [
      { who: "a", task: r("Ask if this seat is free.", "ही जागा रिकामी आहे का ते विचारा."), de: "Ist hier noch frei?" },
      { who: "b", task: r("Say yes, sit down.", "हो, बस असं सांगा."), de: "Ja, setz dich!" },
      { who: "a", task: r("Say you're new in Berlin.", "तुम्ही बर्लिनमध्ये नवीन आहात असं सांगा."), de: "Ich bin neu in Berlin." },
      { who: "b", task: r("Suggest having a coffee together sometime.", "कधीतरी एकत्र कॉफी घेऊया असं सुचवा."), de: "Lass uns mal einen Kaffee trinken!" },
    ],
  },
  {
    id: "notfall",
    emoji: "🆘",
    title: "Emergency",
    level: "B1",
    roles: { a: r("Caller", "फोन करणारा"), b: r("Emergency operator", "आपत्कालीन ऑपरेटर") },
    turns: [
      { who: "b", task: r("Ask where they are.", "ते कुठे आहेत ते विचारा."), de: "Wo sind Sie?" },
      { who: "a", task: r("Say you are at Alexanderplatz.", "तुम्ही अलेक्झांडरप्लाट्झला आहात असं सांगा."), de: "Ich bin am Alexanderplatz." },
      { who: "b", task: r("Ask what happened.", "काय झालं ते विचारा."), de: "Was ist passiert?" },
      { who: "a", task: r("Say someone is hurt and ask them to come quickly.", "कोणीतरी जखमी आहे, लवकर या असं सांगा."), de: "Jemand ist verletzt. Bitte kommen Sie schnell!" },
    ],
  },
];

export const findRoleplay = (id: string) => ROLEPLAYS.find((x) => x.id === id);

// ---- ❤️ Guess what I'd say ----
export type GuessQuestion = { de: string; en: string; mr: string; options: Word[] };

const o = (de: string, en: string, mr: string): Word => ({ de, en, mr });

export const GUESS_QUESTIONS: GuessQuestion[] = [
  { de: "Was ist dein Lieblingsessen?", en: "What's your favourite food?", mr: "तुझं आवडतं जेवण कोणतं?", options: [o("Pizza", "Pizza", "पिझ्झा"), o("Biryani", "Biryani", "बिर्याणी"), o("Pasta", "Pasta", "पास्ता"), o("Vada Pav", "Vada pav", "वडापाव")] },
  { de: "Wo möchtest du am liebsten wohnen?", en: "Where would you most like to live?", mr: "तुला सगळ्यात जास्त कुठे राहायला आवडेल?", options: [o("In Berlin", "In Berlin", "बर्लिनमध्ये"), o("In Mumbai", "In Mumbai", "मुंबईत"), o("Am Meer", "By the sea", "समुद्राजवळ"), o("In den Bergen", "In the mountains", "डोंगरात")] },
  { de: "Was machst du sonntags am liebsten?", en: "What do you most like doing on Sundays?", mr: "रविवारी तुला काय करायला सगळ्यात जास्त आवडतं?", options: [o("Ausschlafen", "Sleep in", "उशिरापर्यंत झोपणं"), o("Kochen", "Cook", "स्वयंपाक करणं"), o("Spazieren gehen", "Go for a walk", "फिरायला जाणं"), o("Filme schauen", "Watch films", "सिनेमे बघणं")] },
  { de: "Was ist das perfekte Date?", en: "What's the perfect date?", mr: "परफेक्ट डेट कोणती?", options: [o("Ein Picknick", "A picnic", "पिकनिक"), o("Ein Kinoabend", "A movie night", "सिनेमाची रात्र"), o("Ein Abendessen", "A dinner", "रात्रीचं जेवण"), o("Ein Spaziergang im Regen", "A walk in the rain", "पावसात फिरणं")] },
  { de: "Welches Tier wärst du?", en: "Which animal would you be?", mr: "तू कोणता प्राणी असतास/असतीस?", options: [o("Eine Katze", "A cat", "मांजर"), o("Ein Hund", "A dog", "कुत्रा"), o("Ein Vogel", "A bird", "पक्षी"), o("Ein Panda", "A panda", "पांडा")] },
  { de: "Was trinkst du morgens?", en: "What do you drink in the morning?", mr: "तू सकाळी काय पितोस/पितेस?", options: [o("Kaffee", "Coffee", "कॉफी"), o("Tee", "Tea", "चहा"), o("Wasser", "Water", "पाणी"), o("Saft", "Juice", "ज्यूस")] },
  { de: "Was vermisst du am meisten?", en: "What do you miss most?", mr: "तुला सगळ्यात जास्त कशाची आठवण येते?", options: [o("Meine Familie", "My family", "माझं कुटुंब"), o("Das Essen", "The food", "जेवण"), o("Das Wetter", "The weather", "हवामान"), o("Dich", "You", "तुझी")] },
  { de: "Wie zeigst du Liebe?", en: "How do you show love?", mr: "तू प्रेम कसं दाखवतोस/दाखवतेस?", options: [o("Mit Worten", "With words", "शब्दांनी"), o("Mit Essen", "With food", "जेवणाने"), o("Mit Geschenken", "With gifts", "भेटवस्तूंनी"), o("Mit Umarmungen", "With hugs", "मिठीने")] },
  { de: "Welche Jahreszeit magst du?", en: "Which season do you like?", mr: "तुला कोणता ऋतू आवडतो?", options: [o("Den Frühling", "Spring", "वसंत"), o("Den Sommer", "Summer", "उन्हाळा"), o("Den Herbst", "Autumn", "शरद"), o("Den Winter", "Winter", "हिवाळा")] },
  { de: "Was machen wir zuerst in Berlin?", en: "What do we do first in Berlin?", mr: "बर्लिनमध्ये आपण आधी काय करायचं?", options: [o("Döner essen", "Eat a döner", "डोनर खायचा"), o("Das Brandenburger Tor sehen", "See the Brandenburg Gate", "ब्रँडेनबर्ग गेट बघायचं"), o("Spazieren gehen", "Go for a walk", "फिरायला जायचं"), o("Schlafen", "Sleep", "झोपायचं")] },
];

// ---- 🤔 Why is German like this? Tiny grammar bites with word-by-word glosses ----
export type GrammarBite = {
  id: string;
  level: LevelId;
  title: string;
  example: { de: string; en: string; mr: string };
  /** Word by word: German → English. */
  gloss: [string, string][];
  tip: Text2;
  table?: [string, string][];
};

export const GRAMMAR_BITES: GrammarBite[] = [
  {
    id: "sein",
    level: "A1",
    title: "sein — to be",
    example: { de: "Ich bin müde.", en: "I am tired.", mr: "मी दमलो/दमले आहे." },
    gloss: [["Ich", "I"], ["bin", "am"], ["müde", "tired"]],
    tip: r("sein changes with the person, just like \"am / are / is\".", "sein व्यक्तीनुसार बदलतं, जसं मराठीत आहे / आहेस / आहोत."),
    table: [["ich", "bin"], ["du", "bist"], ["er / sie", "ist"], ["wir", "sind"], ["ihr", "seid"], ["sie / Sie", "sind"]],
  },
  {
    id: "haben",
    level: "A1",
    title: "haben — to have (even hunger!)",
    example: { de: "Ich habe Hunger.", en: "I'm hungry.", mr: "मला भूक लागली आहे." },
    gloss: [["Ich", "I"], ["habe", "have"], ["Hunger", "hunger"]],
    tip: r("Germans \"have\" hunger, thirst and time — like Marathi, where hunger \"strikes\" you instead of you \"being\" hungry.", "जर्मनमध्ये भूक, तहान, वेळ \"असते\" (haben) — मराठीत जशी भूक \"लागते\"."),
    table: [["ich", "habe"], ["du", "hast"], ["er / sie", "hat"], ["wir", "haben"]],
  },
  {
    id: "v2",
    level: "A1",
    title: "The verb is always second",
    example: { de: "Heute gehen wir ins Kino.", en: "Today we're going to the cinema.", mr: "आज आपण सिनेमाला जातोय." },
    gloss: [["Heute", "today"], ["gehen", "go"], ["wir", "we"], ["ins", "into the"], ["Kino", "cinema"]],
    tip: r("Whatever comes first, the verb takes the 2nd place. So \"today go we\", never \"today we go\".", "वाक्याची सुरुवात कशानेही झाली तरी क्रियापद दुसऱ्या जागी येतं."),
  },
  {
    id: "weil",
    level: "A2",
    title: "weil sends the verb to the end",
    example: { de: "Ich bleibe zu Hause, weil ich müde bin.", en: "I'm staying home because I'm tired.", mr: "मी घरीच थांबतो/थांबते, कारण मी दमलो/दमले आहे." },
    gloss: [["Ich bleibe zu Hause", "I stay at home"], ["weil", "because"], ["ich", "I"], ["müde", "tired"], ["bin", "am"]],
    tip: r("After weil and dass the verb goes last — exactly like Marathi, where the verb ends the sentence!", "weil आणि dass नंतर क्रियापद शेवटी जातं — अगदी मराठीसारखं!"),
  },
  {
    id: "du-sie",
    level: "A1",
    title: "du or Sie?",
    example: { de: "Wie geht es dir? / Wie geht es Ihnen?", en: "How are you? (friendly / polite)", mr: "तू कसा आहेस? / तुम्ही कसे आहात?" },
    gloss: [["Wie", "how"], ["geht", "goes"], ["es", "it"], ["dir / Ihnen", "to you"]],
    tip: r("du is तू, Sie is तुम्ही. Use du with your partner, Sie with strangers and elders.", "du म्हणजे तू, Sie म्हणजे तुम्ही. जोडीदाराला du, अनोळखी आणि मोठ्यांना Sie."),
  },
  {
    id: "artikel",
    level: "A1",
    title: "der, die, das",
    example: { de: "Die Sonne ist warm.", en: "The sun is warm.", mr: "सूर्य उबदार आहे." },
    gloss: [["Die", "the (feminine)"], ["Sonne", "sun"], ["ist", "is"], ["warm", "warm"]],
    tip: r("Every noun has a gender. Learn the article with the word: die Sonne, der Mond, das Herz.", "प्रत्येक नामाला लिंग असतं. शब्दासोबत der/die/das पण लक्षात ठेवा."),
    table: [["der", "masculine"], ["die", "feminine"], ["das", "neuter"], ["die", "plural (all)"]],
  },
  {
    id: "kein",
    level: "A1",
    title: "nicht or kein?",
    example: { de: "Ich habe keine Zeit.", en: "I have no time.", mr: "माझ्याकडे वेळ नाही." },
    gloss: [["Ich", "I"], ["habe", "have"], ["keine", "no"], ["Zeit", "time"]],
    tip: r("kein = \"no / not a\" before nouns. nicht = \"not\" for everything else: Ich bin nicht müde.", "नामापूर्वी kein, बाकी सगळीकडे nicht: Ich bin nicht müde."),
  },
  {
    id: "trennbar",
    level: "A2",
    title: "Verbs that split",
    example: { de: "Ich rufe dich morgen an.", en: "I'll call you tomorrow.", mr: "मी तुला उद्या फोन करेन." },
    gloss: [["Ich", "I"], ["rufe", "call"], ["dich", "you"], ["morgen", "tomorrow"], ["an", "(up)"]],
    tip: r("anrufen splits: the little \"an\" jumps to the end of the sentence.", "anrufen तुटतं: छोटं \"an\" वाक्याच्या शेवटी जातं."),
  },
  {
    id: "modal",
    level: "A2",
    title: "möchten, können, müssen",
    example: { de: "Ich möchte mit dir tanzen.", en: "I'd like to dance with you.", mr: "मला तुझ्यासोबत नाचायचं आहे." },
    gloss: [["Ich", "I"], ["möchte", "would like"], ["mit dir", "with you"], ["tanzen", "to dance"]],
    tip: r("With möchte, kann or muss, the second verb waits at the end.", "möchte, kann, muss सोबत दुसरं क्रियापद शेवटी येतं."),
  },
  {
    id: "perfekt",
    level: "A2",
    title: "Talking about the past",
    example: { de: "Ich habe dich vermisst.", en: "I missed you.", mr: "मला तुझी आठवण आली." },
    gloss: [["Ich", "I"], ["habe", "have"], ["dich", "you"], ["vermisst", "missed"]],
    tip: r("Past = haben (or sein) + the past form at the end: habe … vermisst, bin … gefahren.", "भूतकाळ = haben/sein + शेवटी भूतकाळी रूप: habe … vermisst."),
  },
  {
    id: "fragen",
    level: "A1",
    title: "Questions",
    example: { de: "Wo wohnst du?", en: "Where do you live?", mr: "तू कुठे राहतोस/राहतेस?" },
    gloss: [["Wo", "where"], ["wohnst", "live"], ["du", "you"]],
    tip: r("Question word first, then the verb. Yes/no questions start with the verb: Kommst du?", "प्रश्नार्थक शब्द आधी, मग क्रियापद. हो/नाही प्रश्न क्रियापदाने सुरू होतात: Kommst du?"),
  },
  {
    id: "mit",
    level: "B1",
    title: "mit + dem / der",
    example: { de: "Wir fahren mit dem Zug.", en: "We're going by train.", mr: "आपण ट्रेनने जातोय." },
    gloss: [["Wir", "we"], ["fahren", "travel"], ["mit", "with / by"], ["dem", "the"], ["Zug", "train"]],
    tip: r("After mit, der/das become dem and die becomes der. Like Marathi \"-ने\": ट्रेनने = mit dem Zug.", "mit नंतर der/das → dem, die → der. मराठीतल्या \"-ने\" सारखं: ट्रेनने = mit dem Zug."),
  },
];

// ---- 🇮🇳 Marathi ↔ 🇩🇪 German ----
export type Comparison = { mr: string; de: string; en: string; note?: Text2 };

export const COMPARISONS: Comparison[] = [
  { mr: "मला तुझी आठवण येते.", de: "Ich vermisse dich.", en: "I miss you.", note: r("Marathi: \"to me your memory comes\". German keeps \"I\" as the subject: I miss you.", "मराठीत \"मला आठवण येते\"; जर्मनमध्ये \"मी तुला मिस करतो\" — Ich vermisse dich.") },
  { mr: "मला भूक लागली आहे.", de: "Ich habe Hunger.", en: "I'm hungry.", note: r("Neither language says \"I am hungry\": Marathi hunger \"strikes\" you, German you \"have\" hunger.", "दोन्ही भाषांत \"मी भुकेला आहे\" म्हणत नाहीत: मराठीत भूक लागते, जर्मनमध्ये भूक \"असते\".") },
  { mr: "माझं तुझ्यावर प्रेम आहे.", de: "Ich liebe dich.", en: "I love you." },
  { mr: "मला ते आवडतं.", de: "Das gefällt mir.", en: "I like it.", note: r("Both say \"it pleases to me\": मला = mir.", "दोन्ही भाषांत \"ते मला आवडतं\": मला = mir.") },
  { mr: "मी कॉफी पितो.", de: "Ich trinke Kaffee.", en: "I drink coffee.", note: r("Marathi puts the verb last; German puts it second.", "मराठीत क्रियापद शेवटी, जर्मनमध्ये दुसऱ्या जागी.") },
  { mr: "मी दमलो आहे, कारण मी उशिरा झोपलो.", de: "Ich bin müde, weil ich spät geschlafen habe.", en: "I'm tired because I slept late.", note: r("After weil the German verb goes last — Marathi-style!", "weil नंतर जर्मन क्रियापद शेवटी जातं — मराठीसारखं!") },
  { mr: "तुम्ही कसे आहात?", de: "Wie geht es Ihnen?", en: "How are you? (polite)", note: r("तुम्ही = Sie, तू = du.", "तुम्ही = Sie, तू = du.") },
  { mr: "तू कुठे राहतोस?", de: "Wo wohnst du?", en: "Where do you live?", note: r("German puts the question word first; Marathi keeps कुठे in the middle.", "जर्मनमध्ये प्रश्नार्थक शब्द सुरुवातीला; मराठीत कुठे मध्ये येतं.") },
  { mr: "मला माहीत नाही.", de: "Ich weiß es nicht.", en: "I don't know." },
  { mr: "माझ्याकडे वेळ नाही.", de: "Ich habe keine Zeit.", en: "I have no time." },
  { mr: "तू खूप सुंदर आहेस.", de: "Du bist sehr schön.", en: "You are very beautiful." },
  { mr: "तुझं नाव काय आहे?", de: "Wie heißt du?", en: "What's your name?", note: r("German asks \"how are you called?\".", "जर्मनमध्ये \"तुला काय म्हणतात?\" असं विचारतात.") },
  { mr: "मला मदत हवी आहे.", de: "Ich brauche Hilfe.", en: "I need help." },
  { mr: "चला, जेवूया!", de: "Lass uns essen!", en: "Let's eat!" },
  { mr: "आपण उद्या बर्लिनला जाऊया.", de: "Lass uns morgen nach Berlin fahren.", en: "Let's go to Berlin tomorrow." },
];

// ---- 💌 Love-note phrasebook: type what you feel, get the German ----
export const PHRASEBOOK: Word[] = [
  { de: "Ich vermisse dich so sehr.", en: "I miss you so much.", mr: "मला तुझी खूप आठवण येते." },
  { de: "Ich vermisse dich.", en: "I miss you.", mr: "मला तुझी आठवण येते." },
  { de: "Du fehlst mir.", en: "I miss you (you're missing from my life).", mr: "मला तुझी उणीव भासते." },
  { de: "Ich denke an dich.", en: "I'm thinking of you.", mr: "मी तुझा विचार करतोय/करतेय." },
  { de: "Ich liebe dich.", en: "I love you.", mr: "माझं तुझ्यावर प्रेम आहे." },
  { de: "Ich liebe dich über alles.", en: "I love you more than anything.", mr: "माझं तुझ्यावर सगळ्यात जास्त प्रेम आहे." },
  { de: "Ich kann es kaum erwarten, dich zu sehen.", en: "I can't wait to see you.", mr: "तुला भेटायला मी आतुर आहे." },
  { de: "Ich freue mich auf dich.", en: "I'm looking forward to seeing you.", mr: "तुला भेटायची वाट पाहतोय/पाहतेय." },
  { de: "Ich bin so stolz auf dich.", en: "I'm so proud of you.", mr: "मला तुझा खूप अभिमान आहे." },
  { de: "Du machst mich glücklich.", en: "You make me happy.", mr: "तू मला आनंदी ठेवतोस/ठेवतेस." },
  { de: "Du bist wunderschön.", en: "You are beautiful.", mr: "तू खूप सुंदर आहेस." },
  { de: "Träum was Schönes.", en: "Sweet dreams.", mr: "गोड स्वप्नं पड." },
  { de: "Schlaf gut, mein Schatz.", en: "Sleep well, my darling.", mr: "नीट झोप, सोनू." },
  { de: "Guten Morgen, mein Schatz!", en: "Good morning, my darling!", mr: "सुप्रभात, सोनू!" },
  { de: "Ich umarme dich.", en: "I'm hugging you. / Hugs!", mr: "तुला घट्ट मिठी." },
  { de: "Pass auf dich auf.", en: "Take care of yourself.", mr: "स्वतःची काळजी घे." },
  { de: "Danke für alles.", en: "Thank you for everything.", mr: "सगळ्यासाठी धन्यवाद." },
  { de: "Ich bin immer für dich da.", en: "I'm always there for you.", mr: "मी नेहमी तुझ्यासोबत आहे." },
  { de: "Bald sind wir zusammen.", en: "Soon we'll be together.", mr: "लवकरच आपण एकत्र असू." },
  { de: "Hab einen schönen Tag!", en: "Have a nice day!", mr: "तुझा दिवस छान जावो!" },
  { de: "Viel Glück heute!", en: "Good luck today!", mr: "आजसाठी शुभेच्छा!" },
  { de: "Es tut mir leid.", en: "I'm sorry.", mr: "मला माफ कर." },
  { de: "Gute Besserung!", en: "Get well soon!", mr: "लवकर बरा/बरी हो!" },
  { de: "Ich bin müde, aber glücklich.", en: "I'm tired but happy.", mr: "मी दमलो/दमले आहे, पण आनंदी आहे." },
  { de: "Ruf mich an, wenn du kannst.", en: "Call me when you can.", mr: "जमेल तेव्हा मला फोन कर." },
  { de: "Ich habe an dich gedacht.", en: "I thought of you.", mr: "मला तुझी आठवण आली." },
  { de: "Du bist mein Ein und Alles.", en: "You are my everything.", mr: "तूच माझं सर्वस्व आहेस." },
  { de: "Ich vertraue dir.", en: "I trust you.", mr: "माझा तुझ्यावर विश्वास आहे." },
];
