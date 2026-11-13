import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Card, H1, PartnerName, ProgressBar, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic, LEVELS, levelOfTopic, levelWords, type Level, type Word } from "../../content/levels";
import { speakGerman } from "../../lib/speech";
import { partnerColor, usePalette } from "../../lib/theme";
import { shuffle } from "../../lib/util";
import { partnerName, today, useProgress, type PartnerIndex } from "../../state/progress";

const QUESTIONS = 6;

type Question = { prompt: string; answer: string; german: string; deToEn: boolean; options: string[] };

function resolve(topicId: string): { title: string; pool: Word[]; level: Level } | null {
  if (topicId.startsWith("mix-")) {
    const level = LEVELS.find((l) => l.id === topicId.slice(4));
    return level ? { title: `${level.id} mix`, pool: levelWords(level), level } : null;
  }
  const topic = findTopic(topicId);
  const level = levelOfTopic(topicId);
  return topic && level ? { title: `${level.id} · ${topic.title}`, pool: topic.words, level } : null;
}

function makeQuestions(pool: Word[], level: Level): Question[] {
  const distractorPool = levelWords(level);
  return shuffle(pool)
    .slice(0, QUESTIONS)
    .map((w) => {
      const deToEn = Math.random() < 0.5;
      const others = shuffle(distractorPool.filter((o) => o.de !== w.de)).slice(0, 3);
      return {
        prompt: deToEn ? w.de : w.en,
        answer: deToEn ? w.en : w.de,
        german: w.de,
        deToEn,
        options: shuffle([w, ...others].map((o) => (deToEn ? o.en : o.de))),
      };
    });
}

export default function Duel() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { state, practiced, addDuel } = useProgress();
  const info = useMemo(() => resolve(topicId), [topicId]);

  const [questions, setQuestions] = useState(() => (info ? makeQuestions(info.pool, info.level) : []));
  const [player, setPlayer] = useState<PartnerIndex>(0);
  const [phase, setPhase] = useState<"handoff" | "play" | "result">("handoff");
  const [q, setQ] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!info) {
    return (
      <Screen>
        <T>Topic not found.</T>
      </Screen>
    );
  }

  const header = <Stack.Screen options={{ title: info.title }} />;
  const color = partnerColor(c, player);

  const choose = (opt: string) => {
    if (picked) return;
    const item = questions[q];
    const right = opt === item.answer;
    setPicked(opt);
    const newScores: [number, number] = [...scores];
    if (right) newScores[player]++;
    setScores(newScores);
    if (!item.deToEn || !right) speakGerman(item.german);

    timer.current = setTimeout(
      () => {
        setPicked(null);
        if (q + 1 < questions.length) return setQ(q + 1);
        if (player === 0) {
          setPlayer(1);
          setQ(0);
          return setPhase("handoff");
        }
        // Both played: award XP (10 per correct answer, +15 for the winner).
        const [a, b] = newScores;
        practiced(0, a * 10 + (a > b ? 15 : 0));
        practiced(1, b * 10 + (b > a ? 15 : 0));
        addDuel({ title: info.title, scores: newScores, date: today() });
        setPhase("result");
      },
      right ? 700 : 1500,
    );
  };

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
              setQuestions(makeQuestions(info.pool, info.level));
              setScores([0, 0]);
              setPlayer(0);
              setQ(0);
              setPhase("handoff");
            }}
          />
          <Button title="Other topic" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const item = questions[q];
  return (
    <Screen>
      {header}
      <Row>
        <PartnerName i={player} suffix="'s turn" />
        <View style={{ flex: 1 }} />
        <T muted style={{ fontSize: 13 }}>
          {q + 1} / {questions.length}
        </T>
      </Row>
      <ProgressBar value={q / questions.length} color={color} />

      <Card style={{ marginTop: 8 }}>
        <T muted style={{ fontSize: 13 }}>{item.deToEn ? "What does this mean?" : "How do you say this in German?"}</T>
        <Row style={{ marginTop: 4 }}>
          <Text style={{ color: c.text, fontSize: 21, fontWeight: "800", flexShrink: 1 }}>{item.prompt}</Text>
          {item.deToEn ? <SpeakButton text={item.german} /> : null}
        </Row>
      </Card>

      <View style={{ gap: 8 }}>
        {item.options.map((o) => {
          const isAnswer = picked && o === item.answer;
          const isWrong = picked === o && o !== item.answer;
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              disabled={!!picked}
              onPress={() => choose(o)}
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 14,
                borderColor: isAnswer ? c.good : isWrong ? c.bad : c.border,
                backgroundColor: isAnswer ? c.goodSoft : isWrong ? c.badSoft : c.surface,
              }}
            >
              <Text style={{ color: c.text, fontSize: 16 }}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
