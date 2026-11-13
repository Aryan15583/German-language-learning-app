import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Card, H1, PartnerName, ProgressBar, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic, levelOfTopic } from "../../content/levels";
import { usePalette } from "../../lib/theme";
import { shuffle } from "../../lib/util";
import { useProgress } from "../../state/progress";

export default function Lesson() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = findTopic(topicId);
  const level = levelOfTopic(topicId);
  const { state, markKnown, practiced } = useProgress();
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

  const title = `${level.id} · ${topic.title}`;

  if (done) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <Text style={{ fontSize: 48, textAlign: "center", marginTop: 16 }}>🎉</Text>
        <H1>Toll gemacht!</H1>
        <T muted>
          <PartnerName i={learner} /> earned {gained} XP. Now quiz each other in a duel?
        </T>
        <View style={{ gap: 10, marginTop: 16 }}>
          <Button
            title="Start a duel on this topic"
            onPress={() => router.replace({ pathname: "/duel/[topicId]", params: { topicId: topic.id } })}
          />
          <Button title="Back to topics" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const word = topic.words[deck[pos]];

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <Row>
        <PartnerName i={learner} suffix=" is learning" />
        <View style={{ flex: 1 }} />
        <T muted style={{ fontSize: 13 }}>
          {pos + 1} / {deck.length}
        </T>
      </Row>
      <ProgressBar value={pos / deck.length} />

      <Pressable accessibilityRole="button" accessibilityLabel="Flip card" onPress={() => setFlipped(true)}>
        <Card style={{ minHeight: 210, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", textAlign: "center" }}>{word.de}</Text>
          {flipped ? (
            <Text style={{ color: c.accent, fontSize: 19, marginTop: 12, textAlign: "center" }}>{word.en}</Text>
          ) : (
            <T muted style={{ marginTop: 12 }}>Tap to reveal</T>
          )}
        </Card>
      </Pressable>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <SpeakButton text={word.de} />
      </View>

      {flipped ? (
        <Row style={{ flexWrap: "nowrap" }}>
          <Button
            title="Still learning"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => {
              const d = [...deck, deck[pos]];
              setDeck(d);
              next(d);
            }}
          />
          <Button
            title="Got it ✓"
            style={{ flex: 1 }}
            onPress={() => {
              markKnown(learner, topic.id, deck[pos]);
              const xp = gained + 5;
              setGained(xp);
              next(deck, xp);
            }}
          />
        </Row>
      ) : null}
    </Screen>
  );
}
