// The journey from Mumbai to Berlin: stops on the way (each with its own words and a
// postcard), secret phrases unlocked by the couple streak, and the "Berlin Ready" finale.
import type { LevelId, Topic, Word } from "./levels";

export type Text2 = { en: string; mr: string };

export type Postcard = { place: string; line: string; emoji: string; art?: string };

export type JourneyStop = {
  id: string;
  /** The German city this stop is in. */
  city: string;
  /** Where the city sits on the little Germany map (longitude, latitude). */
  lonLat: [number, number];
  emoji: string;
  title: string;
  /** Lessons passed (on average, as a couple) needed to reach this stop. */
  need: number;
  /** Level whose words make good wrong answers in this stop's quiz. */
  level: LevelId;
  about: Text2;
  tip: { title: string; body: string };
  words: Word[];
  postcard: Postcard;
};

export const JOURNEY: JourneyStop[] = [
  {
    id: "flughafen",
    city: "München",
    lonLat: [11.58, 48.14],
    emoji: "✈️",
    title: "Airport German",
    need: 1,
    level: "A1",
    about: { en: "You land in München. Find your way out of the airport.", mr: "Du landest in München. विमानतळातून बाहेर पडायचा मार्ग शोधा." },
    tip: { title: "Wo ist …?", body: "\"Wo ist …?\" (Where is …?) gets you almost anywhere: Wo ist der Ausgang? Wo ist das Taxi?" },
    words: [
      { de: "der Flughafen", en: "the airport", mr: "विमानतळ" },
      { de: "der Reisepass", en: "the passport", mr: "पासपोर्ट" },
      { de: "das Gepäck", en: "the luggage", mr: "सामान" },
      { de: "der Ausgang", en: "the exit", mr: "बाहेर जाण्याचा मार्ग" },
      { de: "Wo ist der Ausgang?", en: "Where is the exit?", mr: "बाहेर जाण्याचा मार्ग कुठे आहे?" },
      { de: "Ich bin hier im Urlaub.", en: "I'm here on holiday.", mr: "मी इथे सुट्टीवर आलो/आले आहे." },
    ],
    postcard: { place: "Frauenkirche, München", line: "Liebe Grüße aus München! ❤️", emoji: "⛪" },
  },
  {
    id: "cafe",
    city: "Nürnberg",
    lonLat: [11.08, 49.45],
    emoji: "☕",
    title: "Café",
    need: 2,
    level: "A1",
    about: { en: "Your first German coffee in Nürnberg. Order, pay, and enjoy.", mr: "न्युर्नबर्गमध्ये तुमची पहिली जर्मन कॉफी. ऑर्डर द्या, पैसे द्या आणि आनंद घ्या." },
    tip: { title: "bitte = please", body: "Add \"bitte\" to anything and it becomes a polite request: Zwei Kaffee, bitte. Die Rechnung, bitte." },
    words: [
      { de: "bestellen", en: "to order", mr: "ऑर्डर देणे" },
      { de: "bezahlen", en: "to pay", mr: "पैसे देणे" },
      { de: "das Wasser", en: "the water", mr: "पाणी" },
      { de: "die Rechnung", en: "the bill", mr: "बिल" },
      { de: "Zwei Kaffee, bitte.", en: "Two coffees, please.", mr: "दोन कॉफी, प्लीज." },
      { de: "Die Rechnung, bitte.", en: "The bill, please.", mr: "बिल द्या, प्लीज." },
    ],
    postcard: { place: "Kaiserburg, Nürnberg", line: "Lebkuchen and coffee for two.", emoji: "🏰" },
  },
  {
    id: "wohnung",
    city: "Frankfurt",
    lonLat: [8.68, 50.11],
    emoji: "🏠",
    title: "Apartment",
    need: 4,
    level: "A2",
    about: { en: "Viewing your first flat together in Frankfurt.", mr: "फ्रँकफर्टमध्ये तुमचा पहिला फ्लॅट एकत्र बघताय." },
    tip: { title: "mein / meinen", body: "\"mein Schlüssel\" becomes \"meinen Schlüssel\" when it's the thing you forget, buy or have: Ich habe meinen Schlüssel vergessen." },
    words: [
      { de: "die Wohnung", en: "the apartment", mr: "फ्लॅट" },
      { de: "die Miete", en: "the rent", mr: "भाडं" },
      { de: "der Schlüssel", en: "the key", mr: "किल्ली" },
      { de: "das Schlafzimmer", en: "the bedroom", mr: "झोपायची खोली" },
      { de: "Wie hoch ist die Miete?", en: "How much is the rent?", mr: "भाडं किती आहे?" },
      { de: "Ich habe meinen Schlüssel vergessen.", en: "I forgot my key.", mr: "मी माझी किल्ली विसरलो/विसरले." },
    ],
    postcard: { place: "Römerberg, Frankfurt", line: "Our first little home in Germany.", emoji: "🏠" },
  },
  {
    id: "bahnhof",
    city: "Köln",
    lonLat: [6.96, 50.94],
    emoji: "🚆",
    title: "Train Station",
    need: 6,
    level: "A2",
    about: { en: "Köln Hauptbahnhof, right next to the cathedral: tickets, platforms and directions.", mr: "कोलोन हाउप्टबानहोफ, कॅथेड्रलच्या शेजारी: तिकीट, फलाट आणि रस्ता." },
    tip: { title: "Directions", body: "geradeaus = straight on, links = left, rechts = right. \"Geradeaus und dann links\" will take you far." },
    words: [
      { de: "der Bahnsteig", en: "the platform", mr: "फलाट" },
      { de: "die Fahrkarte", en: "the ticket", mr: "तिकीट" },
      { de: "die Abfahrt", en: "the departure", mr: "सुटण्याची वेळ" },
      { de: "die Ankunft", en: "the arrival", mr: "पोहोचण्याची वेळ" },
      { de: "Wo fährt der Zug nach Potsdam ab?", en: "Where does the train to Potsdam leave from?", mr: "पॉट्सडॅमची गाडी कुठून सुटते?" },
      { de: "Geradeaus und dann links.", en: "Straight ahead and then left.", mr: "सरळ जा आणि मग डावीकडे." },
    ],
    postcard: { place: "Kölner Dom", line: "All trains lead to you.", emoji: "⛪" },
  },
  {
    id: "einkaufen",
    city: "Leipzig",
    lonLat: [12.37, 51.34],
    emoji: "🛍️",
    title: "Shopping",
    need: 8,
    level: "A2",
    about: { en: "Shopping in Leipzig's old arcades: prices, sizes and trying things on.", mr: "लाइपझिगच्या जुन्या पॅसेजमध्ये खरेदी: किंमती, मापं आणि कपडे घालून बघणं." },
    tip: { title: "Kann ich …?", body: "\"Kann ich …?\" (Can I …?) puts the second verb at the very end: Kann ich das anprobieren?" },
    words: [
      { de: "Was kostet das?", en: "How much is that?", mr: "याची किंमत किती?" },
      { de: "zu teuer", en: "too expensive", mr: "खूप महाग" },
      { de: "günstig", en: "cheap / good value", mr: "स्वस्त" },
      { de: "die Größe", en: "the size", mr: "माप" },
      { de: "Kann ich das anprobieren?", en: "Can I try this on?", mr: "मी हे घालून बघू शकतो/शकते का?" },
      { de: "Ich schaue nur.", en: "I'm just looking.", mr: "मी फक्त बघतोय/बघतेय." },
    ],
    postcard: { place: "Mädler-Passage, Leipzig", line: "Window shopping, hand in hand.", emoji: "🛍️" },
  },
  {
    id: "leute",
    city: "Dresden",
    lonLat: [13.74, 51.05],
    emoji: "💬",
    title: "Meeting Locals",
    need: 10,
    level: "B1",
    about: { en: "Small talk with new neighbours and friends in Dresden.", mr: "ड्रेस्डेनमध्ये नवीन शेजारी आणि मित्रांशी गप्पा." },
    tip: { title: "Langsamer, bitte!", body: "Didn't catch it? \"Langsamer, bitte\" (slower, please) and \"Noch einmal, bitte\" (once more, please) are your best friends." },
    words: [
      { de: "Woher kommst du?", en: "Where are you from?", mr: "तू कुठून आहेस?" },
      { de: "Ich komme aus Indien.", en: "I'm from India.", mr: "मी भारतातून आलो/आले आहे." },
      { de: "Freut mich!", en: "Nice to meet you!", mr: "भेटून आनंद झाला!" },
      { de: "die Nachbarin", en: "the (female) neighbour", mr: "शेजारीण" },
      { de: "Sprechen Sie Englisch?", en: "Do you speak English?", mr: "तुम्ही इंग्रजी बोलता का?" },
      { de: "Langsamer, bitte.", en: "Slower, please.", mr: "जरा हळू, प्लीज." },
    ],
    postcard: { place: "Frauenkirche, Dresden", line: "New friends, same old us.", emoji: "⛪" },
  },
  {
    id: "date",
    city: "Potsdam",
    lonLat: [13.06, 52.39],
    emoji: "❤️",
    title: "Date Night",
    need: 13,
    level: "B1",
    about: { en: "A date night in Potsdam: compliments, feelings and a little romance.", mr: "पॉट्सडॅममध्ये डेट नाईट: कौतुक, भावना आणि थोडासा रोमान्स." },
    tip: { title: "Darf ich …?", body: "\"Darf ich …?\" (May I …?) is the sweetest polite question. Like \"Kann ich\", the second verb goes to the end." },
    words: [
      { de: "Du siehst wunderschön aus.", en: "You look beautiful.", mr: "तू खूप सुंदर दिसतेस/दिसतोस." },
      { de: "Ich bin verliebt.", en: "I'm in love.", mr: "मी प्रेमात पडलो/पडले आहे." },
      { de: "Darf ich dich küssen?", en: "May I kiss you?", mr: "मी तुझं चुंबन घेऊ का?" },
      { de: "Mit dir ist alles schöner.", en: "Everything is nicer with you.", mr: "तुझ्यासोबत सगळं अधिक सुंदर आहे." },
      { de: "Tanzen wir?", en: "Shall we dance?", mr: "आपण नाचूया का?" },
      { de: "Ich denke nur an dich.", en: "I only think of you.", mr: "मी फक्त तुझाच विचार करतो/करते." },
    ],
    postcard: { place: "Schloss Sanssouci, Potsdam", line: "A walk in the park, hand in hand.", emoji: "🌳", art: "/art/couple.jpg" },
  },
  {
    id: "berlin",
    city: "Berlin",
    lonLat: [13.4, 52.52],
    emoji: "🇩🇪",
    title: "Berlin!",
    need: 16,
    level: "B2",
    about: { en: "You made it to Berlin. Welcome home.", mr: "तुम्ही बर्लिनला पोहोचलात. घरी स्वागत आहे." },
    tip: { title: "geschafft!", body: "\"Wir haben es geschafft!\" — we did it! \"Gemeinsam\" means together, side by side." },
    words: [
      { de: "Wir sind da!", en: "We're here!", mr: "आपण पोहोचलो!" },
      { de: "das Zuhause", en: "home", mr: "घर" },
      { de: "endlich", en: "finally", mr: "शेवटी एकदाचं" },
      { de: "zusammen", en: "together", mr: "एकत्र" },
      { de: "Willkommen in Berlin!", en: "Welcome to Berlin!", mr: "बर्लिनमध्ये स्वागत आहे!" },
      { de: "Gemeinsam geschafft.", en: "We made it together.", mr: "आपण मिळून करून दाखवलं." },
    ],
    postcard: { place: "Brandenburger Tor, Berlin", line: "One step closer — and then we were there.", emoji: "🏛️", art: "/art/gate.jpg" },
  },
];

export const findStop = (id: string) => JOURNEY.find((s) => s.id === id);

/** A stop's words as a normal lesson, so flashcards and quizzes just work. */
export const stopTopic = (s: JourneyStop): Topic => ({
  id: `berlin-${s.id}`,
  title: s.title,
  emoji: s.emoji,
  tip: s.tip,
  compare: { en: "", mr: "" },
  words: s.words,
});
export const stopOfTopic = (topicId: string) => (topicId.startsWith("berlin-") ? findStop(topicId.slice(7)) : undefined);
export const journeyWords = (): Word[] => JOURNEY.flatMap((s) => s.words);

// ---- Secret phrases: unlocked by the shared streak ----
export type SecretPhrase = { day: number; de: string; en: string; mr: string };

export const SECRET_PHRASES: SecretPhrase[] = [
  { day: 7, de: "Du bist mein Lieblingsmensch.", en: "You are my favourite person.", mr: "तू माझी सगळ्यात आवडती व्यक्ती आहेस." },
  { day: 14, de: "Ich liebe dich.", en: "I love you.", mr: "माझं तुझ्यावर प्रेम आहे." },
  { day: 30, de: "Du bist mein Zuhause.", en: "You are my home.", mr: "तूच माझं घर आहेस." },
  { day: 50, de: "Mit dir überall.", en: "With you, anywhere.", mr: "तुझ्यासोबत कुठेही." },
  { day: 100, de: "Bis nach Berlin.", en: "All the way to Berlin.", mr: "थेट बर्लिनपर्यंत." },
];

// ---- Berlin Ready: the final trip. No translations, no choices — just German. ----
export type ReadyPrompt = {
  /** The situation and what to say, in simple German. */
  ask: string;
  /** Every group must be matched by one of its words (after normalising). */
  keywords: string[][];
  model: string;
};
export type ReadyDay = { day: number; emoji: string; title: string; prompts: ReadyPrompt[] };

export const BERLIN_READY: ReadyDay[] = [
  {
    day: 1,
    emoji: "✈️",
    title: "Am Flughafen",
    prompts: [
      { ask: "Passkontrolle: „Warum sind Sie in Deutschland?“ Sag: Du bist im Urlaub.", keywords: [["urlaub"]], model: "Ich bin im Urlaub." },
      { ask: "Du suchst den Ausgang. Frag danach.", keywords: [["wo"], ["ausgang"]], model: "Wo ist der Ausgang?" },
      { ask: "Dein Koffer ist nicht da! Sag es.", keywords: [["koffer", "gepaeck"], ["weg", "verloren", "nicht da"]], model: "Mein Koffer ist weg." },
    ],
  },
  {
    day: 2,
    emoji: "🏨",
    title: "Im Hotel",
    prompts: [
      { ask: "An der Rezeption: Sag, dass du eine Reservierung hast.", keywords: [["reservierung"]], model: "Ich habe eine Reservierung." },
      { ask: "Frag, wann es Frühstück gibt.", keywords: [["wann"], ["fruehstueck"]], model: "Wann gibt es Frühstück?" },
      { ask: "Dein Zimmer ist zu laut. Sag es.", keywords: [["zimmer"], ["laut"]], model: "Das Zimmer ist zu laut." },
    ],
  },
  {
    day: 3,
    emoji: "☕",
    title: "Im Café",
    prompts: [
      { ask: "Bestell zwei Kaffee.", keywords: [["zwei"], ["kaffee"]], model: "Zwei Kaffee, bitte." },
      { ask: "Frag nach der Rechnung.", keywords: [["rechnung", "zahlen", "bezahlen"]], model: "Die Rechnung, bitte." },
      { ask: "Sag, dass es sehr lecker war.", keywords: [["lecker"]], model: "Es war sehr lecker." },
    ],
  },
  {
    day: 4,
    emoji: "🚆",
    title: "Am Bahnhof",
    prompts: [
      { ask: "Kauf eine Fahrkarte nach Potsdam.", keywords: [["fahrkarte", "ticket"], ["potsdam"]], model: "Eine Fahrkarte nach Potsdam, bitte." },
      { ask: "Frag, wo Gleis drei ist.", keywords: [["wo"], ["gleis"], ["drei", "3"]], model: "Wo ist Gleis drei?" },
      { ask: "Frag, wann der Zug abfährt.", keywords: [["wann"], ["zug"]], model: "Wann fährt der Zug ab?" },
    ],
  },
  {
    day: 5,
    emoji: "🛍️",
    title: "Beim Einkaufen",
    prompts: [
      { ask: "Frag, was die Jacke kostet.", keywords: [["was", "wie viel", "wieviel"], ["kostet", "kosten"]], model: "Was kostet die Jacke?" },
      { ask: "Sag, dass sie zu teuer ist.", keywords: [["teuer"]], model: "Sie ist zu teuer." },
      { ask: "Frag, ob du sie anprobieren kannst.", keywords: [["anprobieren"]], model: "Kann ich sie anprobieren?" },
    ],
  },
  {
    day: 6,
    emoji: "🗣️",
    title: "Leute kennenlernen",
    prompts: [
      { ask: "Jemand fragt: „Woher kommst du?“ Antworte.", keywords: [["indien", "mumbai"]], model: "Ich komme aus Indien." },
      { ask: "Frag deine Nachbarin, wie sie heißt.", keywords: [["wie"], ["heisst", "name"]], model: "Wie heißt du?" },
      { ask: "Schlag vor, zusammen einen Kaffee zu trinken.", keywords: [["kaffee"]], model: "Lass uns einen Kaffee trinken!" },
    ],
  },
  {
    day: 7,
    emoji: "❤️",
    title: "Date in Berlin",
    prompts: [
      { ask: "Sag deinem Schatz, dass er oder sie wunderschön aussieht.", keywords: [["schoen", "wunderschoen", "huebsch"]], model: "Du siehst wunderschön aus." },
      { ask: "Sag, dass du sehr glücklich bist.", keywords: [["gluecklich"]], model: "Ich bin sehr glücklich." },
      { ask: "Sag „Ich liebe dich“ — und dass ihr es zusammen geschafft habt.", keywords: [["liebe"], ["geschafft"]], model: "Ich liebe dich. Wir haben es geschafft!" },
    ],
  },
];

/** Berlin Ready opens once you've passed the B1 big test (practical German). */
export const READY_LEVEL: LevelId = "B1";
