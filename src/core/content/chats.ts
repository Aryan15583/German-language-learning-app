// Guided chat scenarios: a character writes, you answer in German.
// Each step has suggested replies; at least one is natural ("ok"), the others are
// common mistakes with an explanation ("why") in English and Marathi.
import type { LevelId } from "./levels";

export type Text3 = { de: string; en: string; mr: string };
export type Explained = { en: string; mr: string };
export type Reply = Text3 & { ok: boolean; why?: Explained };
export type ChatStep = { bot: Text3; replies: Reply[] };

export type Chat = {
  id: string;
  level: LevelId;
  title: string;
  emoji: string;
  /** Who you're chatting with. */
  bot: { name: string; avatar: string };
  intro: Explained;
  steps: ChatStep[];
  end: Text3;
};

export const CHATS: Chat[] = [
  {
    id: "cafe",
    level: "A1",
    title: "Ordering at a café",
    emoji: "☕",
    bot: { name: "Kellner", avatar: "🧑‍🍳" },
    intro: {
      en: "You're on a date at a café in Berlin. Order for both of you!",
      mr: "तुम्ही बर्लिनमधल्या कॅफेत डेटवर आहात. दोघांसाठी ऑर्डर द्या!",
    },
    steps: [
      {
        bot: { de: "Hallo! Was möchten Sie trinken?", en: "Hello! What would you like to drink?", mr: "नमस्कार! तुम्हाला काय प्यायला आवडेल?" },
        replies: [
          { de: "Einen Kaffee, bitte.", en: "A coffee, please.", mr: "एक कॉफी, प्लीज.", ok: true },
          {
            de: "Ich bin ein Kaffee.",
            en: "I am a coffee.",
            mr: "मी एक कॉफी आहे.",
            ok: false,
            why: { en: "That means \"I am a coffee\" 😄 Just say what you'd like: \"Einen Kaffee, bitte.\"", mr: "याचा अर्थ \"मी एक कॉफी आहे\" 😄 फक्त हवं ते सांगा: \"Einen Kaffee, bitte.\"" },
          },
        ],
      },
      {
        bot: { de: "Und für Ihre Begleitung?", en: "And for your companion?", mr: "आणि तुमच्या सोबत्यासाठी?" },
        replies: [
          {
            de: "Danke, gute Nacht.",
            en: "Thanks, good night.",
            mr: "धन्यवाद, शुभ रात्री.",
            ok: false,
            why: { en: "\"Good night\" — but you've only just arrived! Order something for your partner.", mr: "\"शुभ रात्री\" — पण तुम्ही आत्ताच आला आहात! जोडीदारासाठी काहीतरी मागवा." },
          },
          { de: "Einen Tee, bitte.", en: "A tea, please.", mr: "एक चहा, प्लीज.", ok: true },
        ],
      },
      {
        bot: { de: "Möchten Sie auch etwas essen?", en: "Would you like something to eat as well?", mr: "तुम्हाला खायलाही काही हवं आहे का?" },
        replies: [
          { de: "Ja, zwei Brezeln, bitte.", en: "Yes, two pretzels, please.", mr: "हो, दोन प्रेट्झेल, प्लीज.", ok: true },
          {
            de: "Nein, ich habe Hunger.",
            en: "No, I'm hungry.",
            mr: "नाही, मला भूक लागली आहे.",
            ok: false,
            why: { en: "\"No, I'm hungry\" contradicts itself. If you're hungry, say \"Ja, …\"", mr: "\"नाही, मला भूक लागली आहे\" — हे विसंगत आहे. भूक असेल तर \"Ja, …\" म्हणा." },
          },
        ],
      },
      {
        bot: { de: "Gerne. Das macht acht Euro.", en: "Sure. That's eight euros.", mr: "नक्कीच. एकूण आठ युरो झाले." },
        replies: [
          {
            de: "Wo ist der Bahnhof?",
            en: "Where is the train station?",
            mr: "रेल्वे स्टेशन कुठे आहे?",
            ok: false,
            why: { en: "Off topic — pay first! 😉", mr: "विषय सोडून! आधी पैसे द्या 😉" },
          },
          { de: "Hier, bitte. Danke!", en: "Here you go. Thanks!", mr: "हे घ्या. धन्यवाद!", ok: true },
        ],
      },
    ],
    end: { de: "Danke schön! Einen schönen Tag noch!", en: "Thank you! Have a nice day!", mr: "धन्यवाद! तुमचा दिवस छान जावो!" },
  },
  {
    id: "urlaub",
    level: "A2",
    title: "Planning a holiday",
    emoji: "🧳",
    bot: { name: "Schatz", avatar: "💞" },
    intro: {
      en: "Your partner wants to plan a summer trip with you.",
      mr: "तुमच्या जोडीदाराला तुमच्यासोबत उन्हाळ्यातली सहल ठरवायची आहे.",
    },
    steps: [
      {
        bot: { de: "Schatz, wohin fahren wir im Sommer?", en: "Darling, where shall we go in summer?", mr: "सोनू, उन्हाळ्यात आपण कुठे जायचं?" },
        replies: [
          {
            de: "Ich fahre gestern nach Berlin.",
            en: "I drive yesterday to Berlin.",
            mr: "मी काल बर्लिनला जातो.",
            ok: false,
            why: { en: "gestern means yesterday. Make a suggestion instead: \"Lass uns nach … fahren!\"", mr: "gestern म्हणजे काल. त्याऐवजी सुचवा: \"Lass uns nach … fahren!\"" },
          },
          { de: "Lass uns nach Berlin fahren!", en: "Let's go to Berlin!", mr: "चल, बर्लिनला जाऊया!", ok: true },
        ],
      },
      {
        bot: { de: "Gute Idee! Mit dem Zug oder mit dem Auto?", en: "Good idea! By train or by car?", mr: "छान कल्पना! ट्रेनने की गाडीने?" },
        replies: [
          { de: "Mit dem Zug, das ist entspannter.", en: "By train, that's more relaxing.", mr: "ट्रेनने, ते जास्त आरामदायक आहे.", ok: true },
          {
            de: "Mit der Zug.",
            en: "By the train (wrong article).",
            mr: "Mit der Zug (चुकीचं आर्टिकल).",
            ok: false,
            why: { en: "Zug is masculine (der Zug), and after mit it becomes dem: \"mit dem Zug\".", mr: "Zug पुल्लिंगी आहे (der Zug), आणि mit नंतर dem होतं: \"mit dem Zug\"." },
          },
        ],
      },
      {
        bot: { de: "Und wo schlafen wir?", en: "And where do we sleep?", mr: "आणि आपण कुठे राहायचं?" },
        replies: [
          {
            de: "Ich schlafe gut, danke.",
            en: "I sleep well, thanks.",
            mr: "मला छान झोप लागते, धन्यवाद.",
            ok: false,
            why: { en: "That answers \"Did you sleep well?\". The question is where you'll stay.", mr: "हे \"झोप नीट लागली का?\" चं उत्तर आहे. प्रश्न कुठे राहायचं हा आहे." },
          },
          { de: "In einem kleinen Hotel im Zentrum.", en: "In a small hotel in the centre.", mr: "शहराच्या मध्यभागी एका छोट्या हॉटेलमध्ये.", ok: true },
        ],
      },
      {
        bot: { de: "Wie lange bleiben wir?", en: "How long are we staying?", mr: "आपण किती दिवस राहायचं?" },
        replies: [
          { de: "Eine Woche. Ist das okay?", en: "One week. Is that okay?", mr: "एक आठवडा. चालेल का?", ok: true },
          {
            de: "Um acht Uhr.",
            en: "At eight o'clock.",
            mr: "आठ वाजता.",
            ok: false,
            why: { en: "That's a time of day, not how long. Try \"Eine Woche\" or \"Drei Tage\".", mr: "ही वेळ आहे, कालावधी नाही. \"Eine Woche\" किंवा \"Drei Tage\" म्हणा." },
          },
        ],
      },
    ],
    end: { de: "Perfekt! Ich freue mich schon so!", en: "Perfect! I'm already so excited!", mr: "मस्त! मला आत्ताच खूप उत्सुकता लागली आहे!" },
  },
  {
    id: "eltern",
    level: "B1",
    title: "Meeting the parents",
    emoji: "🏡",
    bot: { name: "Frau Weber", avatar: "👩‍🦳" },
    intro: {
      en: "You're visiting your partner's mother for the first time. Be polite — use Sie!",
      mr: "तुम्ही पहिल्यांदाच जोडीदाराच्या आईला भेटत आहात. आदराने बोला — Sie वापरा!",
    },
    steps: [
      {
        bot: { de: "Herzlich willkommen! Schön, Sie endlich kennenzulernen.", en: "Welcome! Lovely to finally meet you.", mr: "स्वागत आहे! शेवटी तुमची भेट झाली, छान वाटलं." },
        replies: [
          { de: "Vielen Dank für die Einladung! Freut mich auch.", en: "Thank you for the invitation! Nice to meet you too.", mr: "आमंत्रणाबद्दल खूप धन्यवाद! मलाही आनंद झाला.", ok: true },
          {
            de: "Hallo, wie geht's dir?",
            en: "Hi, how are you? (informal)",
            mr: "हाय, कसं काय? (अनौपचारिक)",
            ok: false,
            why: { en: "Too casual for a first meeting. Use Sie with your partner's parents — like तुम्ही in Marathi.", mr: "पहिल्या भेटीसाठी फारच अनौपचारिक. जोडीदाराच्या आई-वडिलांशी Sie वापरा — मराठीतल्या 'तुम्ही' सारखं." },
          },
        ],
      },
      {
        bot: { de: "Wie haben Sie sich eigentlich kennengelernt?", en: "So how did you two actually meet?", mr: "तुमची दोघांची ओळख नेमकी कशी झाली?" },
        replies: [
          {
            de: "Wir lernen uns morgen kennen.",
            en: "We'll meet tomorrow.",
            mr: "आमची उद्या ओळख होईल.",
            ok: false,
            why: { en: "That's the future! Use the Perfekt: \"Wir haben uns … kennengelernt.\"", mr: "हा भविष्यकाळ आहे! Perfekt वापरा: \"Wir haben uns … kennengelernt.\"" },
          },
          { de: "Wir haben uns auf einer Party kennengelernt.", en: "We met at a party.", mr: "आमची ओळख एका पार्टीत झाली.", ok: true },
        ],
      },
      {
        bot: { de: "Nehmen Sie doch noch ein Stück Kuchen!", en: "Do have another piece of cake!", mr: "अजून एक केकचा तुकडा घ्या ना!" },
        replies: [
          { de: "Gern, der Kuchen ist köstlich!", en: "Gladly, the cake is delicious!", mr: "नक्कीच, केक अप्रतिम आहे!", ok: true },
          {
            de: "Nein. Der Kuchen schmeckt nicht.",
            en: "No. The cake doesn't taste good.",
            mr: "नाही. केक चांगला लागत नाही.",
            ok: false,
            why: { en: "Honest, but ouch! 🙈 If you don't want more, try \"Danke, ich bin satt.\"", mr: "प्रामाणिक, पण बोचरं! 🙈 नको असेल तर \"Danke, ich bin satt.\" (पोट भरलंय) म्हणा." },
          },
        ],
      },
      {
        bot: { de: "Und was machen Sie beruflich?", en: "And what do you do for a living?", mr: "आणि तुम्ही काय काम करता?" },
        replies: [
          {
            de: "Ich mache gern Urlaub.",
            en: "I like going on holiday.",
            mr: "मला सुट्टीवर जायला आवडतं.",
            ok: false,
            why: { en: "Nice, but that's a hobby, not a job! Try \"Ich arbeite in …\"", mr: "छान, पण तो छंद आहे, नोकरी नाही! \"Ich arbeite in …\" म्हणा." },
          },
          { de: "Ich arbeite in der IT-Branche.", en: "I work in IT.", mr: "मी आयटी क्षेत्रात काम करतो/करते.", ok: true },
        ],
      },
    ],
    end: { de: "Wie schön! Sie sind hier jederzeit willkommen.", en: "How lovely! You're welcome here any time.", mr: "किती छान! तुमचं इथे कधीही स्वागत आहे." },
  },
  {
    id: "haushalt",
    level: "B2",
    title: "Sharing the chores",
    emoji: "🧽",
    bot: { name: "Schatz", avatar: "💞" },
    intro: {
      en: "Your partner wants to talk about housework. Stay calm and find a fair deal.",
      mr: "जोडीदाराला घरकामाबद्दल बोलायचं आहे. शांत राहा आणि योग्य तोडगा काढा.",
    },
    steps: [
      {
        bot: { de: "Wir müssen mal über den Haushalt reden.", en: "We need to talk about the housework.", mr: "आपल्याला घरकामाबद्दल बोलायला हवं." },
        replies: [
          { de: "Okay, was stört dich denn?", en: "Okay, what's bothering you?", mr: "ठीक आहे, तुला काय खटकतंय?", ok: true },
          {
            de: "Nein, ich habe keine Zeit, tschüss.",
            en: "No, I don't have time, bye.",
            mr: "नाही, मला वेळ नाही, बाय.",
            ok: false,
            why: { en: "Avoiding the talk won't help 😅 Show you're listening.", mr: "बोलणं टाळून काही होणार नाही 😅 तुम्ही ऐकताय हे दाखवा." },
          },
        ],
      },
      {
        bot: { de: "Ich habe das Gefühl, dass ich immer abwasche.", en: "I feel like I always do the dishes.", mr: "मला असं वाटतं की भांडी नेहमी मीच घासतो/घासते." },
        replies: [
          {
            de: "Das stimmt nicht, weil ich wasche ab.",
            en: "That's not true, because I do the dishes. (wrong word order)",
            mr: "ते खरं नाही, कारण मी भांडी घासतो. (चुकीचा शब्दक्रम)",
            ok: false,
            why: { en: "After weil the verb goes to the end — just like Marathi: \"weil ich abwasche\".", mr: "weil नंतर क्रियापद शेवटी जातं — अगदी मराठीसारखं: \"weil ich abwasche\"." },
          },
          { de: "Du hast recht. Wie wäre es, wenn wir uns abwechseln?", en: "You're right. How about we take turns?", mr: "तुझं बरोबर आहे. आपण आळीपाळीने केलं तर?", ok: true },
        ],
      },
      {
        bot: { de: "Gute Idee. Und wer putzt das Bad?", en: "Good idea. And who cleans the bathroom?", mr: "छान कल्पना. आणि बाथरूम कोण साफ करणार?" },
        replies: [
          { de: "Ich übernehme das Bad, wenn du staubsaugst.", en: "I'll take the bathroom if you vacuum.", mr: "तू व्हॅक्यूम केलंस तर बाथरूम मी साफ करतो/करते.", ok: true },
          {
            de: "Das Bad ist im ersten Stock.",
            en: "The bathroom is on the first floor.",
            mr: "बाथरूम पहिल्या मजल्यावर आहे.",
            ok: false,
            why: { en: "That's where it is, not who cleans it 😄", mr: "ते कुठे आहे हे सांगितलं, कोण साफ करणार हे नाही 😄" },
          },
        ],
      },
      {
        bot: { de: "Abgemacht! Sollen wir einen Putzplan machen?", en: "Deal! Shall we make a cleaning rota?", mr: "ठरलं! आपण साफसफाईचं वेळापत्रक बनवूया का?" },
        replies: [
          {
            de: "Ja, aber nur, wenn du alles machst.",
            en: "Yes, but only if you do everything.",
            mr: "हो, पण फक्त सगळं तू करशील तर.",
            ok: false,
            why: { en: "Grammatically perfect — but not a fair compromise! 😄", mr: "व्याकरण अगदी बरोबर — पण ही योग्य तडजोड नाही! 😄" },
          },
          { de: "Ja, dann gibt es keinen Streit mehr.", en: "Yes, then there'll be no more arguments.", mr: "हो, मग भांडणंच होणार नाहीत.", ok: true },
        ],
      },
    ],
    end: { de: "Danke, dass du so verständnisvoll bist.", en: "Thank you for being so understanding.", mr: "इतकं समजून घेतल्याबद्दल धन्यवाद." },
  },
  {
    id: "herz",
    level: "C1",
    title: "A heart-to-heart",
    emoji: "🌙",
    bot: { name: "Schatz", avatar: "💞" },
    intro: {
      en: "Late at night, your partner notices something is on your mind.",
      mr: "रात्री उशिरा, जोडीदाराच्या लक्षात येतं की तुमच्या मनात काहीतरी आहे.",
    },
    steps: [
      {
        bot: { de: "Mir ist aufgefallen, dass du in letzter Zeit sehr nachdenklich bist.", en: "I've noticed you've been very thoughtful lately.", mr: "माझ्या लक्षात आलं की तू हल्ली खूप विचारात असतोस/असतेस." },
        replies: [
          { de: "Ja, mich beschäftigt, wo wir in Zukunft leben wollen.", en: "Yes, I keep thinking about where we want to live in future.", mr: "हो, भविष्यात आपण कुठे राहायचं याचा मी विचार करतोय/करतेय.", ok: true },
          {
            de: "Ja, ich habe heute Pizza gegessen.",
            en: "Yes, I ate pizza today.",
            mr: "हो, मी आज पिझ्झा खाल्ला.",
            ok: false,
            why: { en: "Too superficial for a heart-to-heart. Share what's really on your mind.", mr: "मनमोकळ्या गप्पांसाठी हे फारच वरवरचं आहे. मनात खरंच काय आहे ते सांगा." },
          },
        ],
      },
      {
        bot: { de: "Was genau macht dir dabei Sorgen?", en: "What exactly worries you about it?", mr: "यात तुला नेमकी कशाची काळजी वाटते?" },
        replies: [
          {
            de: "Ich habe Angst vor Spinnen.",
            en: "I'm afraid of spiders.",
            mr: "मला कोळ्यांची भीती वाटते.",
            ok: false,
            why: { en: "A real fear, but not the topic! 🕷️", mr: "खरी भीती, पण विषय तो नाही! 🕷️" },
          },
          { de: "Ich habe Angst, meine Familie in Indien zu selten zu sehen.", en: "I'm afraid I'll see my family in India too rarely.", mr: "भारतातल्या माझ्या कुटुंबाला फार क्वचित भेटता येईल, याची भीती वाटते.", ok: true },
        ],
      },
      {
        bot: { de: "Das kann ich gut nachvollziehen. Was wäre für dich ein guter Kompromiss?", en: "I can really understand that. What would be a good compromise for you?", mr: "मी ते नीट समजू शकतो/शकते. तुझ्यासाठी चांगली तडजोड कोणती असेल?" },
        replies: [
          { de: "Wenn wir jedes Jahr ein paar Wochen in Pune verbringen könnten.", en: "If we could spend a few weeks in Pune every year.", mr: "आपल्याला दरवर्षी काही आठवडे पुण्यात घालवता आले तर.", ok: true },
          {
            de: "Wenn wir könnten verbringen Wochen in Pune.",
            en: "If we could spend weeks in Pune. (wrong word order)",
            mr: "Wenn wir könnten verbringen… (चुकीचा शब्दक्रम)",
            ok: false,
            why: { en: "In a wenn-clause the conjugated verb goes last, like Marathi: \"… in Pune verbringen könnten.\"", mr: "wenn-वाक्यात चालवलेलं क्रियापद शेवटी जातं, मराठीसारखं: \"… in Pune verbringen könnten.\"" },
          },
        ],
      },
      {
        bot: { de: "Das finde ich fair. Lass uns das gemeinsam planen.", en: "I think that's fair. Let's plan it together.", mr: "मला ते योग्य वाटतं. आपण मिळून ठरवूया." },
        replies: [
          {
            de: "Mal sehen, keine Ahnung.",
            en: "We'll see, no idea.",
            mr: "बघू, कल्पना नाही.",
            ok: false,
            why: { en: "A bit dismissive after such a kind offer. Show your appreciation!", mr: "इतक्या प्रेमळ प्रस्तावानंतर हे जरा उडवून लावल्यासारखं वाटतं. कौतुक व्यक्त करा!" },
          },
          { de: "Danke, dass du mir zuhörst. Das gibt mir Geborgenheit.", en: "Thank you for listening. It makes me feel safe.", mr: "माझं ऐकल्याबद्दल धन्यवाद. त्यामुळे मला सुरक्षित वाटतं.", ok: true },
        ],
      },
    ],
    end: { de: "Wir ziehen an einem Strang. Immer.", en: "We're in this together. Always.", mr: "आपण एकत्र आहोत. नेहमी." },
  },
  {
    id: "necken",
    level: "C2",
    title: "Playful teasing",
    emoji: "😏",
    bot: { name: "Schatz", avatar: "💞" },
    intro: {
      en: "Your partner is in a teasing mood and full of idioms. Keep up!",
      mr: "जोडीदार गमतीच्या मूडमध्ये आहे आणि वाक्प्रचारांची बरसात करतोय. साथ द्या!",
    },
    steps: [
      {
        bot: { de: "Na, hast du mal wieder Tomaten auf den Augen? Ich war beim Friseur!", en: "Oblivious again, are we? I got a haircut!", mr: "काय, पुन्हा डोळ्यांसमोरचं दिसत नाहीये का? मी केस कापून आलोय/आलेय!" },
        replies: [
          {
            de: "Ich habe keine Tomaten gekauft.",
            en: "I didn't buy any tomatoes.",
            mr: "मी टोमॅटो आणले नाहीत.",
            ok: false,
            why: { en: "It's an idiom! \"Tomaten auf den Augen haben\" = not noticing the obvious.", mr: "हा वाक्प्रचार आहे! \"Tomaten auf den Augen haben\" = डोळ्यांसमोरचं न दिसणे." },
          },
          { de: "Oh nein, das ist mir echt entgangen – steht dir super!", en: "Oh no, I totally missed that – it really suits you!", mr: "अरे बापरे, माझ्या लक्षातच आलं नाही — तुला खूप छान दिसतंय!", ok: true },
        ],
      },
      {
        bot: { de: "Schon gut. Heute Abend steppt übrigens bei Jonas der Bär.", en: "Never mind. By the way, there's a wild party at Jonas's tonight.", mr: "जाऊ दे. बाय द वे, आज रात्री योनासकडे जोरदार धमाल आहे." },
        replies: [
          { de: "Ehrlich gesagt ist mir heute nicht danach – lass uns lieber zu zweit bleiben.", en: "Honestly, I'm not in the mood – let's stay in, just the two of us.", mr: "खरं सांगू तर आज माझा मूड नाही — आपण दोघंच घरी राहूया.", ok: true },
          {
            de: "Ein Bär? Ruf die Polizei!",
            en: "A bear? Call the police!",
            mr: "अस्वल? पोलिसांना बोलव!",
            ok: false,
            why: { en: "\"Da steppt der Bär\" means a wild party — no real bears 🐻", mr: "\"Da steppt der Bär\" म्हणजे जोरदार पार्टी — खरं अस्वल नाही 🐻" },
          },
        ],
      },
      {
        bot: { de: "Jein. Ein bisschen Zweisamkeit klingt aber verlockend.", en: "Yes and no. A bit of couple time does sound tempting.", mr: "हो-नाही. पण थोडा दोघांचा वेळ मोहक वाटतोय." },
        replies: [
          {
            de: "Ich verstehe nur Bahnhof.",
            en: "It's all Greek to me.",
            mr: "माझ्या डोक्यावरून गेलं.",
            ok: false,
            why: { en: "Cute idiom, but you did understand! 😉", mr: "छान वाक्प्रचार, पण तुम्हाला तर समजलंय! 😉" },
          },
          { de: "Dann koche ich – und verschlimmbessere diesmal nichts!", en: "Then I'll cook – and won't make anything worse this time!", mr: "मग मी स्वयंपाक करतो/करते — आणि या वेळी सुधारायला जाऊन काही बिघडवणार नाही!", ok: true },
        ],
      },
      {
        bot: { de: "Ende gut, alles gut. Du bist mir einer!", en: "All's well that ends well. You're quite something!", mr: "शेवट गोड तर सगळं गोड. तू पण ना, कमाल आहेस!" },
        replies: [
          { de: "Und du bist mein Ein und Alles.", en: "And you are my everything.", mr: "आणि तूच माझं सर्वस्व आहेस.", ok: true },
          {
            de: "Ich bin einer was?",
            en: "I'm a what?",
            mr: "मी काय आहे?",
            ok: false,
            why: { en: "\"Du bist mir einer!\" is affectionate teasing: \"You're quite something!\"", mr: "\"Du bist mir einer!\" हे प्रेमळ चिडवणं आहे: \"तू पण ना, कमाल आहेस!\"" },
          },
        ],
      },
    ],
    end: { de: "Ach, Schatz. Komm her!", en: "Oh, darling. Come here!", mr: "अगं/अरे सोनू. इकडे ये!" },
  },
];

export const findChat = (id: string) => CHATS.find((c) => c.id === id);
