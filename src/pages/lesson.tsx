import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { KeepGoing } from "../components/KeepGoing";
import { Missing } from "../components/NotFound";
import { Button, Card, cx, PageHeader, ProgressBar, Script, Speak } from "../components/ui";
import { meaning, otherMeaning, type Topic, type Word } from "../core/content/levels";
import { lessonById } from "../web/topics";
import { shuffle } from "../core/lib/util";
import { useId } from "../web/nav";
import { useProgress, XP } from "../web/progress";
import { speakGerman } from "../web/speech";

const oursTopic = (words: Word[]): Topic | undefined =>
  words.length ? { id: "ours", title: "Our words", emoji: "💞", tip: { title: "", body: "" }, compare: { en: "", mr: "" }, words } : undefined;

export default function LessonPage() {
  const id = useId();
  const { state } = useProgress();
  const topic = id === "ours" ? oursTopic(state.customWords) : id ? lessonById(id)?.topic : undefined;
  if (id === null) return <Missing loading />;
  if (!topic) return <Missing />;
  return <Lesson key={topic.id} topic={topic} />;
}

/** Flashcards: tap to flip, then "I know it" or "Not yet". */
function Lesson({ topic }: { topic: Topic }) {
  const { state, markKnown, practiced, log } = useProgress();
  const learner = state.learner;
  const lang = state.partners[learner].lang;
  const ours = topic.id === "ours";

  const initialDeck = useMemo(() => {
    const known = new Set(state.partners[learner].known[topic.id] ?? []);
    const unknown = topic.words.map((_, i) => i).filter((i) => !known.has(i));
    return shuffle(unknown.length ? unknown : topic.words.map((_, i) => i));
  }, [topic.id, learner]); // eslint-disable-line react-hooks/exhaustive-deps -- build the deck once

  const [deck, setDeck] = useState(initialDeck);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gained, setGained] = useState(0);
  const [done, setDone] = useState(false);
  const word = topic.words[deck[pos]];

  useEffect(() => {
    if (word && !done) speakGerman(word.de);
  }, [word, done]);

  const next = (newDeck: number[], xp: number) => {
    setFlipped(false);
    if (pos + 1 >= newDeck.length) {
      if (xp) practiced(learner, xp);
      log("📚", `Learned the words in “${topic.title}”`);
      setDone(true);
    } else setPos(pos + 1);
  };

  if (done) {
    return (
      <AppShell focus>
        <div className="mx-auto max-w-md text-center anim-fade-up">
          <p className="mt-6 text-6xl">🎉</p>
          <Script className="mt-2 text-4xl">Toll gemacht! Well done!</Script>
          <p className="mt-1 text-lg text-muted">+{gained} XP</p>
          {ours ? null : topic.id.startsWith("berlin-") ? (
            <Button size="lg" full variant="good" href={`/quiz?id=${topic.id}`} className="mt-6">
              ✏️ Take the {topic.title} quiz
            </Button>
          ) : (
            <div className="mt-6">
              <KeepGoing />
            </div>
          )}
          <Button variant="ghost" href="/" className="mt-4">
            I’m done for now
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell focus>
      <div className="mx-auto max-w-xl">
        <PageHeader title={ours ? "💞 Our words" : topic.title} />
        <div className="mb-2 flex justify-between text-sm font-semibold text-muted">
          <span>
            Card {pos + 1} of {deck.length}
          </span>
          <span>+{gained} XP</span>
        </div>
        <ProgressBar value={pos / deck.length} />

        <div className="mt-5 [perspective:1200px]">
          <button
            type="button"
            aria-label={flipped ? `${word.de}: ${meaning(word, lang)}` : "Flip card"}
            onClick={() => setFlipped(true)}
            className={cx("relative h-80 w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}
          >
            <Face>
              <span className="text-5xl">{topic.emoji}</span>
              <span className="mt-3 text-4xl font-extrabold text-ink">{word.de}</span>
              <span className="mt-5 text-muted">👆 Tap the card to see what it means</span>
            </Face>
            <Face back>
              <span className="text-3xl font-extrabold text-ink">{word.de}</span>
              <span className="mt-4 text-2xl font-bold text-plum">{meaning(word, lang)}</span>
              <span className="mt-1 text-muted">{otherMeaning(word, lang)}</span>
            </Face>
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <Speak text={word.de} big />
        </div>

        {flipped ? (
          <div className="mt-5 grid grid-cols-2 gap-3 anim-fade-up">
            <Button
              size="lg"
              variant="soft"
              onClick={() => {
                const d = [...deck, deck[pos]];
                setDeck(d);
                next(d, gained);
              }}
            >
              😕 Not yet
            </Button>
            <Button
              size="lg"
              variant="good"
              onClick={() => {
                markKnown(learner, topic.id, deck[pos], word.de);
                const xp = gained + XP.flashcard;
                setGained(xp);
                next(deck, xp);
              }}
            >
              😊 I know it
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Face({ back, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <Card
      className={cx(
        "absolute inset-0 flex flex-col items-center justify-center border-2 border-rose-soft text-center [backface-visibility:hidden]",
        back && "bg-blush [transform:rotateY(180deg)]",
      )}
    >
      {children}
    </Card>
  );
}
