import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Quiz } from "../../components/Quiz";
import { Button, Card, H1, PartnerName, Screen, T } from "../../components/ui";
import { findLevel, findTopic, levelOfTopic, levelWords, type Level, type Word } from "../../content/levels";
import { makeQuestions } from "../../lib/questions";
import { partnerColor, usePalette } from "../../lib/theme";
import { partnerName, today, useProgress, XP, type PartnerIndex } from "../../state/progress";

const QUESTIONS = 6;

/** "mix-B1" means every unit in B1; anything else is a unit id. */
function resolve(topicId: string): { title: string; pool: Word[]; level: Level } | null {
  if (topicId.startsWith("mix-")) {
    const level = findLevel(topicId.slice(4));
    return level ? { title: `${level.id} mix`, pool: levelWords(level), level } : null;
  }
  const topic = findTopic(topicId);
  const level = levelOfTopic(topicId);
  return topic && level ? { title: `${level.id} · ${topic.title}`, pool: topic.words, level } : null;
}

export default function Duel() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { state, practiced, addDuel } = useProgress();
  const [info] = useState(() => resolve(topicId));
  // Both partners get exactly the same questions.
  const build = () => (info ? makeQuestions(info.pool, levelWords(info.level), { count: QUESTIONS }) : []);
  const [questions, setQuestions] = useState(build);
  const [player, setPlayer] = useState<PartnerIndex>(0);
  const [phase, setPhase] = useState<"handoff" | "play" | "result">("handoff");
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(0);

  if (!info) {
    return (
      <Screen>
        <T>Topic not found.</T>
      </Screen>
    );
  }

  const header = <Stack.Screen options={{ title: info.title }} />;

  if (phase === "handoff") {
    return (
      <Screen>
        {header}
        <Text style={{ fontSize: 48, textAlign: "center", marginTop: 24 }}>📱➡️</Text>
        <H1>
          Pass the phone to <PartnerName i={player} />
        </H1>
        <T muted style={{ marginBottom: 20 }}>
          {player ? `No peeking at ${partnerName(state, 0)}'s score! 🙈` : `${questions.length} questions. Viel Glück!`}
        </T>
        <Button title="I'm ready" onPress={() => setPhase("play")} />
      </Screen>
    );
  }

  if (phase === "result") {
    const [a, b] = scores;
    const winner: PartnerIndex | null = a === b ? null : a > b ? 0 : 1;
    return (
      <Screen>
        {header}
        <Text style={{ fontSize: 48, textAlign: "center", marginTop: 16 }}>{winner === null ? "🤝" : "🏆"}</Text>
        <H1>{winner === null ? "Unentschieden! It's a tie!" : `${partnerName(state, winner)} gewinnt!`}</H1>
        <Card style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
          {([0, 1] as const).map((i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 30, fontWeight: "800", color: partnerColor(c, i) }}>{scores[i]}</Text>
              <PartnerName i={i} />
            </View>
          ))}
        </Card>
        <T muted style={{ textAlign: "center", marginBottom: 16 }}>
          {winner === null ? "Perfectly matched 💞" : "Loser makes dinner tonight? 😉  Der Verlierer kocht heute!"}
        </T>
        <View style={{ gap: 10 }}>
          <Button
            title="Revanche! (Rematch)"
            onPress={() => {
              setQuestions(build());
              setScores([0, 0]);
              setPlayer(0);
              setRound(round + 1);
              setPhase("handoff");
            }}
          />
          <Button title="Other topic" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <Quiz
        key={`${round}-${player}`}
        questions={questions}
        color={partnerColor(c, player)}
        label={<PartnerName i={player} suffix="'s turn" />}
        onFinish={(correct) => {
          const next: [number, number] = player === 0 ? [correct, 0] : [scores[0], correct];
          setScores(next);
          if (player === 0) {
            setPlayer(1);
            setPhase("handoff");
            return;
          }
          const [a, b] = next;
          practiced(0, a * XP.duelCorrect + (a > b ? XP.duelWin : 0));
          practiced(1, b * XP.duelCorrect + (b > a ? XP.duelWin : 0));
          addDuel({ title: info.title, scores: next, date: today() });
          setPhase("result");
        }}
      />
    </Screen>
  );
}
