import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BigButton, Card, H1, ProgressBar, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic, LEVELS, levelOfTopic, meaning, otherMeaning, type Topic, type Word } from "../../content/levels";

import { nextStep, stepHref, stepLabel } from "../../lib/path";
import { speakGerman } from "../../lib/speech";
import { usePalette } from "../../lib/theme";
import { shuffle } from "../../lib/util";
import { useProgress, XP } from "../../state/progress";

const oursTopic = (words: Word[]): Topic | undefined =>
  words.length
    ? {
        id: "ours",
        title: "Our words",
        emoji: "💞",
        tip: { title: "", body: "" },
        compare: { en: "", mr: "" },
        words,
      }
    : undefined;

export default function Lesson() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { state, markKnown, practiced } = useProgress();
  // "ours" = the couple's own shared words.
  const ours = topicId === "ours";
  const topic = ours ? oursTopic(state.customWords) : findTopic(topicId);
  const level = ours ? LEVELS[0] : levelOfTopic(topicId);
  const learner = state.learner;

  // Unknown words first; if everything is known, review the whole deck.
  const initialDeck = useMemo(() => {
    if (!topic) return [];
    const known = new Set(state.partners[learner].known[topic.id] ?? []);
    const unknown = topic.words.map((_, i) => i).filter((i) => !known.has(i));
    return shuffle(unknown.length ? unknown : topic.words.map((_, i) => i));
  }, [topic?.id, learner]); // eslint-disable-line react-hooks/exhaustive-deps

  const [deck, setDeck] = useState(initialDeck);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gained, setGained] = useState(0);
  const [done, setDone] = useState(false);

  // Say each new word out loud, so learners hear it without searching for a button.
  const currentWord = topic && deck.length ? topic.words[deck[pos]]?.de : undefined;
  useEffect(() => {
    if (currentWord && !done) speakGerman(currentWord);
  }, [currentWord, done]);
  const afterStep = nextStep(state.partners[learner]);
  const after = stepLabel(afterStep);

  if (!topic || !level) {
    return (
      <Screen>
        <T>Topic not found.</T>
      </Screen>
    );
  }

  const next = (newDeck = deck, xp = gained) => {
    setFlipped(false);
    if (pos + 1 >= newDeck.length) {
      if (xp) practiced(learner, xp);
      setDone(true);
    } else setPos(pos + 1);
  };

  const title = ours ? "💞 Our words" : topic.title;

  if (done) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <Text style={{ fontSize: 48, textAlign: "center", marginTop: 16 }}>🎉</Text>
        <H1>Toll gemacht! Well done!</H1>
        <T muted style={{ textAlign: "center", fontSize: 16 }}>
          +{gained} XP 🎉
        </T>
        {!ours ? (
          <Card style={{ alignItems: "center", marginTop: 16 }}>
            <T muted style={{ fontWeight: "700" }}>Next up</T>
            <Text style={{ fontSize: 44 }}>{after.emoji}</Text>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: "900", textAlign: "center" }}>{after.title}</Text>
            <BigButton title="▶  Keep going" onPress={() => router.replace(stepHref(afterStep))} color={c.good} large />
          </Card>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ alignSelf: "center", marginTop: 16, padding: 8 }}>
          <T muted style={{ textDecorationLine: "underline" }}>I’m done for now</T>
        </Pressable>
      </Screen>
    );
  }

  const word = topic.words[deck[pos]];

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <Row>
        <T muted style={{ fontWeight: "700" }}>Card {pos + 1} of {deck.length}</T>
      </Row>
      <ProgressBar value={pos / deck.length} />

      <Pressable accessibilityRole="button" accessibilityLabel="Flip card" onPress={() => setFlipped(true)}>
        <Card style={{ minHeight: 260, alignItems: "center", justifyContent: "center", marginTop: 8, borderWidth: 2, borderColor: c.accentSoft }}>
          <Text style={{ fontSize: 40 }}>{topic.emoji}</Text>
          <Text style={{ color: c.text, fontSize: 34, fontWeight: "900", textAlign: "center", marginTop: 6 }}>{word.de}</Text>
          {flipped ? (
            <View style={{ alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: c.accent, fontSize: 22, fontWeight: "700", textAlign: "center" }}>
                {meaning(word, state.partners[learner].lang)}
              </Text>
              <Text style={{ color: c.muted, fontSize: 15, marginTop: 4, textAlign: "center" }}>
                {otherMeaning(word, state.partners[learner].lang)}
              </Text>
            </View>
          ) : (
            <T muted style={{ marginTop: 14, fontSize: 16 }}>👆 Tap the card to see what it means</T>
          )}
        </Card>
      </Pressable>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <SpeakButton text={word.de} />
      </View>

      {flipped ? (
        <Row style={{ flexWrap: "nowrap", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <BigButton
              title="😕 Not yet"
              color={c.b}
              onPress={() => {
                const d = [...deck, deck[pos]];
                setDeck(d);
                next(d);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BigButton
              title="😊 I know it"
              color={c.good}
              onPress={() => {
                markKnown(learner, topic.id, deck[pos]);
                const xp = gained + XP.flashcard;
                setGained(xp);
                next(deck, xp);
              }}
            />
          </View>
        </Row>
      ) : null}
    </Screen>
  );
}
