// How German words change their form — like Marathi जातो / जातोस / जातात.
// Verbs: lemma | English | मराठी | ich, du, er/sie, wir, ihr, sie/Sie | past (perfect, "er" form)
// Nouns: singular with article | English | plural with article ("-" = no plural)
// Adjectives: base | English | मराठी | "more …" | "the most …" ("-" = doesn't compare)

export const VERBS = `
sein|to be|असणे|bin,bist,ist,sind,seid,sind|ist gewesen
haben|to have|असणे (जवळ असणे)|habe,hast,hat,haben,habt,haben|hat gehabt
werden|to become|होणे|werde,wirst,wird,werden,werdet,werden|ist geworden
lieben|to love|प्रेम करणे|liebe,liebst,liebt,lieben,liebt,lieben|hat geliebt
vermissen|to miss|आठवण येणे|vermisse,vermisst,vermisst,vermissen,vermisst,vermissen|hat vermisst
fehlen|to be missing|उणीव भासणे|fehle,fehlst,fehlt,fehlen,fehlt,fehlen|hat gefehlt
schlafen|to sleep|झोपणे|schlafe,schläfst,schläft,schlafen,schlaft,schlafen|hat geschlafen
kochen|to cook|स्वयंपाक करणे|koche,kochst,kocht,kochen,kocht,kochen|hat gekocht
aufräumen|to tidy up|आवरणे|räume auf,räumst auf,räumt auf,räumen auf,räumt auf,räumen auf|hat aufgeräumt
schmecken|to taste|चव लागणे|schmecke,schmeckst,schmeckt,schmecken,schmeckt,schmecken|hat geschmeckt
essen|to eat|खाणे|esse,isst,isst,essen,esst,essen|hat gegessen
trinken|to drink|पिणे|trinke,trinkst,trinkt,trinken,trinkt,trinken|hat getrunken
gehen|to go|जाणे|gehe,gehst,geht,gehen,geht,gehen|ist gegangen
kommen|to come|येणे|komme,kommst,kommt,kommen,kommt,kommen|ist gekommen
fahren|to go (by vehicle)|गाडीने जाणे|fahre,fährst,fährt,fahren,fahrt,fahren|ist gefahren
bleiben|to stay|थांबणे|bleibe,bleibst,bleibt,bleiben,bleibt,bleiben|ist geblieben
möchten|would like|हवं असणे|möchte,möchtest,möchte,möchten,möchtet,möchten|hat gewollt
wollen|to want|इच्छा असणे|will,willst,will,wollen,wollt,wollen|hat gewollt
können|can|शकणे|kann,kannst,kann,können,könnt,können|hat gekonnt
müssen|must|करावं लागणे|muss,musst,muss,müssen,müsst,müssen|hat gemusst
mögen|to like|आवडणे|mag,magst,mag,mögen,mögt,mögen|hat gemocht
gefallen|to please (be liked)|आवडणे|gefalle,gefällst,gefällt,gefallen,gefallt,gefallen|hat gefallen
machen|to do / make|करणे|mache,machst,macht,machen,macht,machen|hat gemacht
heißen|to be called|नाव असणे|heiße,heißt,heißt,heißen,heißt,heißen|hat geheißen
wohnen|to live (somewhere)|राहणे|wohne,wohnst,wohnt,wohnen,wohnt,wohnen|hat gewohnt
leben|to live|जगणे|lebe,lebst,lebt,leben,lebt,leben|hat gelebt
sprechen|to speak|बोलणे|spreche,sprichst,spricht,sprechen,sprecht,sprechen|hat gesprochen
sagen|to say|सांगणे|sage,sagst,sagt,sagen,sagt,sagen|hat gesagt
sehen|to see|पाहणे|sehe,siehst,sieht,sehen,seht,sehen|hat gesehen
aussehen|to look (appear)|दिसणे|sehe aus,siehst aus,sieht aus,sehen aus,seht aus,sehen aus|hat ausgesehen
schauen|to look|बघणे|schaue,schaust,schaut,schauen,schaut,schauen|hat geschaut
kosten|to cost|किंमत असणे|koste,kostest,kostet,kosten,kostet,kosten|hat gekostet
bestellen|to order|ऑर्डर देणे|bestelle,bestellst,bestellt,bestellen,bestellt,bestellen|hat bestellt
bezahlen|to pay|पैसे देणे|bezahle,bezahlst,bezahlt,bezahlen,bezahlt,bezahlen|hat bezahlt
kaufen|to buy|विकत घेणे|kaufe,kaufst,kauft,kaufen,kauft,kaufen|hat gekauft
anprobieren|to try on|घालून बघणे|probiere an,probierst an,probiert an,probieren an,probiert an,probieren an|hat anprobiert
küssen|to kiss|चुंबन घेणे|küsse,küsst,küsst,küssen,küsst,küssen|hat geküsst
tanzen|to dance|नाचणे|tanze,tanzt,tanzt,tanzen,tanzt,tanzen|hat getanzt
denken|to think|विचार करणे|denke,denkst,denkt,denken,denkt,denken|hat gedacht
glauben|to believe|विश्वास ठेवणे|glaube,glaubst,glaubt,glauben,glaubt,glauben|hat geglaubt
wissen|to know (a fact)|माहीत असणे|weiß,weißt,weiß,wissen,wisst,wissen|hat gewusst
verstehen|to understand|समजणे|verstehe,verstehst,versteht,verstehen,versteht,verstehen|hat verstanden
brauchen|to need|गरज असणे|brauche,brauchst,braucht,brauchen,braucht,brauchen|hat gebraucht
geben|to give|देणे|gebe,gibst,gibt,geben,gebt,geben|hat gegeben
nehmen|to take|घेणे|nehme,nimmst,nimmt,nehmen,nehmt,nehmen|hat genommen
finden|to find|सापडणे|finde,findest,findet,finden,findet,finden|hat gefunden
suchen|to look for|शोधणे|suche,suchst,sucht,suchen,sucht,suchen|hat gesucht
helfen|to help|मदत करणे|helfe,hilfst,hilft,helfen,helft,helfen|hat geholfen
arbeiten|to work|काम करणे|arbeite,arbeitest,arbeitet,arbeiten,arbeitet,arbeiten|hat gearbeitet
lernen|to learn|शिकणे|lerne,lernst,lernt,lernen,lernt,lernen|hat gelernt
warten|to wait|वाट पाहणे|warte,wartest,wartet,warten,wartet,warten|hat gewartet
schreiben|to write|लिहिणे|schreibe,schreibst,schreibt,schreiben,schreibt,schreiben|hat geschrieben
lesen|to read|वाचणे|lese,liest,liest,lesen,lest,lesen|hat gelesen
spielen|to play|खेळणे|spiele,spielst,spielt,spielen,spielt,spielen|hat gespielt
vergessen|to forget|विसरणे|vergesse,vergisst,vergisst,vergessen,vergesst,vergessen|hat vergessen
anrufen|to call (phone)|फोन करणे|rufe an,rufst an,ruft an,rufen an,ruft an,rufen an|hat angerufen
treffen|to meet|भेटणे|treffe,triffst,trifft,treffen,trefft,treffen|hat getroffen
kennenlernen|to get to know|ओळख होणे|lerne kennen,lernst kennen,lernt kennen,lernen kennen,lernt kennen,lernen kennen|hat kennengelernt
träumen|to dream|स्वप्न पाहणे|träume,träumst,träumt,träumen,träumt,träumen|hat geträumt
heiraten|to marry|लग्न करणे|heirate,heiratest,heiratet,heiraten,heiratet,heiraten|hat geheiratet
sich freuen|to be glad / look forward|आनंद होणे|freue mich,freust dich,freut sich,freuen uns,freut euch,freuen sich|hat sich gefreut
sich streiten|to argue|भांडणे|streite mich,streitest dich,streitet sich,streiten uns,streitet euch,streiten sich|hat sich gestritten
sich versöhnen|to make up|समेट करणे|versöhne mich,versöhnst dich,versöhnt sich,versöhnen uns,versöhnt euch,versöhnen sich|hat sich versöhnt
sich verloben|to get engaged|साखरपुडा होणे|verlobe mich,verlobst dich,verlobt sich,verloben uns,verlobt euch,verloben sich|hat sich verlobt
sich öffnen|to open up|मन मोकळं करणे|öffne mich,öffnest dich,öffnet sich,öffnen uns,öffnet euch,öffnen sich|hat sich geöffnet
teilen|to share / split|वाटून घेणे|teile,teilst,teilt,teilen,teilt,teilen|hat geteilt
sparen|to save (money)|बचत करणे|spare,sparst,spart,sparen,spart,sparen|hat gespart
abschalten|to switch off / unwind|आराम करणे|schalte ab,schaltest ab,schaltet ab,schalten ab,schaltet ab,schalten ab|hat abgeschaltet
überzeugen|to convince|पटवून देणे|überzeuge,überzeugst,überzeugt,überzeugen,überzeugt,überzeugen|hat überzeugt
zeigen|to show|दाखवणे|zeige,zeigst,zeigt,zeigen,zeigt,zeigen|hat gezeigt
setzen|to put / set|ठेवणे|setze,setzt,setzt,setzen,setzt,setzen|hat gesetzt
verschlimmbessern|to make worse by "improving"|सुधारता सुधारता बिघडवणे|verschlimmbessere,verschlimmbesserst,verschlimmbessert,verschlimmbessern,verschlimmbessert,verschlimmbessern|hat verschlimmbessert
`;

export const NOUNS = `
der Schatz|treasure / darling|die Schätze
der Liebling|darling|die Lieblinge
das Mäuschen|little mouse (sweetie)|die Mäuschen
die Nacht|night|die Nächte
der Morgen|morning|die Morgen
der Tag|day|die Tage
das Frühstück|breakfast|die Frühstücke
das Abendessen|dinner|die Abendessen
das Essen|food / meal|die Essen
die Brezel|pretzel|die Brezeln
der Hunger|hunger|-
der Appetit|appetite|-
der Kaffee|coffee|die Kaffees
der Tee|tea|die Tees
die Milch|milk|-
das Brot|bread|die Brote
das Wasser|water|-
der Kuchen|cake|die Kuchen
die Küche|kitchen|die Küchen
das Zimmer|room|die Zimmer
das Schlafzimmer|bedroom|die Schlafzimmer
das Doppelzimmer|double room|die Doppelzimmer
das Sofa|sofa|die Sofas
das Haus|house|die Häuser
die Wohnung|apartment|die Wohnungen
das Zuhause|home|-
der Schlüssel|key|die Schlüssel
der Montag|Monday|die Montage
das Wochenende|weekend|die Wochenenden
die Uhr|clock / o'clock|die Uhren
die Zeit|time|die Zeiten
der Supermarkt|supermarket|die Supermärkte
die Einkaufsliste|shopping list|die Einkaufslisten
das Kino|cinema|die Kinos
der Spaziergang|walk|die Spaziergänge
die Rechnung|bill|die Rechnungen
der Bahnhof|train station|die Bahnhöfe
der Zug|train|die Züge
der Bahnsteig|platform|die Bahnsteige
die Fahrkarte|ticket|die Fahrkarten
die Abfahrt|departure|die Abfahrten
die Ankunft|arrival|die Ankünfte
der Koffer|suitcase|die Koffer
das Gepäck|luggage|-
der Flughafen|airport|die Flughäfen
der Reisepass|passport|die Reisepässe
der Ausgang|exit|die Ausgänge
der Urlaub|holiday|die Urlaube
die Reservierung|reservation|die Reservierungen
die Stadt|city|die Städte
die Größe|size|die Größen
die Jacke|jacket|die Jacken
die Schwiegereltern|in-laws|(only plural)
die Familie|family|die Familien
das Kind|child|die Kinder
der Mann|man / husband|die Männer
die Frau|woman / wife|die Frauen
der Freund|friend / boyfriend|die Freunde
die Freundin|friend / girlfriend|die Freundinnen
der Nachbar|neighbour (man)|die Nachbarn
die Nachbarin|neighbour (woman)|die Nachbarinnen
der Name|name|die Namen
der Arzt|doctor|die Ärzte
der Arzttermin|doctor's appointment|die Arzttermine
die Apotheke|pharmacy|die Apotheken
die Hochzeit|wedding|die Hochzeiten
die Einladung|invitation|die Einladungen
das Geschenk|present|die Geschenke
der Geburtstag|birthday|die Geburtstage
die Liebe|love|-
das Herz|heart|die Herzen
die Hand|hand|die Hände
die Sonne|sun|-
der Traum|dream|die Träume
der Kompromiss|compromise|die Kompromisse
der Mietvertrag|rental contract|die Mietverträge
die Miete|rent|die Mieten
das Konto|account|die Konten
die Ausgabe|expense|die Ausgaben
der Dauerauftrag|standing order|die Daueraufträge
die Überstunde|hour of overtime|die Überstunden
der Feierabend|end of the working day|die Feierabende
der Standpunkt|point of view|die Standpunkte
die Geborgenheit|feeling safe and warm|-
die Verletzlichkeit|vulnerability|-
das Vertrauen|trust|-
die Gleichberechtigung|equality|-
die Verantwortung|responsibility|-
die Grenze|border / limit|die Grenzen
die Gemütlichkeit|cosiness|-
das Fernweh|longing for faraway places|-
der Stammtisch|regulars' table|die Stammtische
die Sonntagsruhe|Sunday quiet time|-
die Mülltrennung|waste separation|-
das Ehrenamt|volunteer work|die Ehrenämter
die Pünktlichkeit|punctuality|-
die Sehnsucht|deep longing|die Sehnsüchte
die Zweisamkeit|togetherness as a couple|-
die Torschlusspanik|fear that time is running out|-
das Kopfkino|imagining scenes in your head|-
der Kummerspeck|weight from emotional eating|-
das Fingerspitzengefühl|tact, intuition|-
die Schnapsidee|crazy idea|die Schnapsideen
`;

export const ADJECTIVES = `
gut|good|चांगला|besser|am besten
schön|beautiful / nice|सुंदर|schöner|am schönsten
wunderschön|gorgeous|अतिशय सुंदर|-|-
lecker|tasty|चविष्ट|leckerer|am leckersten
glücklich|happy|आनंदी|glücklicher|am glücklichsten
müde|tired|दमलेला|müder|am müdesten
traurig|sad|दुःखी|trauriger|am traurigsten
verliebt|in love|प्रेमात पडलेला|verliebter|am verliebtesten
eifersüchtig|jealous|मत्सरी|eifersüchtiger|am eifersüchtigsten
teuer|expensive|महाग|teurer|am teuersten
billig|cheap|स्वस्त|billiger|am billigsten
günstig|good value|परवडणारा|günstiger|am günstigsten
groß|big|मोठा|größer|am größten
klein|small|लहान|kleiner|am kleinsten
neu|new|नवीन|neuer|am neuesten
alt|old|जुना|älter|am ältesten
warm|warm|उबदार|wärmer|am wärmsten
kalt|cold|थंड|kälter|am kältesten
toll|great|भारी|toller|am tollsten
super|great|छान|-|-
lieb|sweet / dear|गोड|lieber|am liebsten
stolz|proud|अभिमानी|stolzer|am stolzesten
laut|loud|मोठ्या आवाजाचा|lauter|am lautesten
frisch|fresh|ताजा|frischer|am frischesten
spät|late|उशिरा|später|am spätesten
früh|early|लवकर|früher|am frühesten
schnell|fast|जलद|schneller|am schnellsten
langsam|slow|हळू|langsamer|am langsamsten
erkältet|having a cold|सर्दी झालेला|-|-
überfordert|overwhelmed|दबून गेलेला|-|-
gemeinsam|shared / together|एकत्रित|-|-
`;
