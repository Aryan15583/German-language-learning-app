import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Quiz } from "../components/Quiz";
import { Button, Card, H1, PartnerName, Screen, T } from "../components/ui";
import { levelWords } from "../content/levels";
import { REMOTE_QUESTIONS, resolveTopic } from "../lib/topics";
import { newId } from "../lib/crypto";
import { makeQuestions } from "../lib/questions";
import { shareText } from "../lib/share";
import { partnerColor, usePalette } from "../lib/theme";
import { seededRng } from "../lib/util";
import { couple, partnerName, useProgress, XP, type SendResult } from "../state/progress";

/**
 * A duel played on two phones. Start one with ?topic=…, or answer one with ?id=….
 * Both players get the same questions (same seed), each in their own language.
 */
export default function RemoteDuel() {
  const c = usePalette();
  const params = useLocalSearchParams<{ topic?: string; id?: string }>();
  const { state, playRemoteDuel, practiced } = useProgress();
  const existing = params.id ? state.remoteDuels.find((d) => d.id === params.id) : undefined;
  const [setup] = useState(() =>
    existing ? { id: existing.id, topic: existing.topic, seed: existing.seed } : { id: newId(), topic: params.topic ?? "", seed: Math.floor(Math.random() * 2 ** 31) },
  );
  const info = resolveTopic(setup.topic);
  const [phase, setPhase] = useState<"play" | "sending" | "done">("play");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<SendResult | null>(null);
  const [shareNote, setShareNote] = useState("");

  if (!couple.isLinked(state)) {
    return (
      <Screen>
        <H1>Link your phones first</H1>
        <T muted>Remote duels need your phones linked. Open the Us tab to get or enter a partner code.</T>
        <Button title="Go to Us" onPress={() => router.replace("/us")} style={{ marginTop: 12 }} />
      </Screen>
    );
  }
  if (!info || (existing && existing.scores[0] !== null && phase === "play")) {
    return (
      <Screen>
        <H1>{info ? "You already played this one" : "Duel not found"}</H1>
        <Button title="Back to chat" onPress={() => router.replace("/us")} />
      </Screen>
    );
  }

  const questions = makeQuestions(info.pool, levelWords(info.level), {
    count: REMOTE_QUESTIONS,
    lang: state.partners[0].lang,
    rng: seededRng(setup.seed),
  });
  const duel = state.remoteDuels.find((d) => d.id === setup.id);
  const status = duel ? couple.duelStatus(duel) : null;
  const header = <Stack.Screen options={{ title: `🌍 ${info.title}` }} />;

  if (phase === "play") {
    return (
      <Screen>
        {header}
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <T>
            {existing
              ? `🌍 ${partnerName(state, 1)} scored ${existing.scores[1]}/${REMOTE_QUESTIONS}. Can you beat it?`
              : `🌍 Play now — ${partnerName(state, 1)} gets the exact same questions on their phone.`}
          </T>
        </Card>
        <Quiz
          questions={questions}
          color={partnerColor(c, 0)}
          label={<PartnerName i={0} suffix="'s turn" />}
          onFinish={async (correct) => {
            setScore(correct);
            setPhase("sending");
            practiced(0, correct * XP.duelCorrect);
            const r = await playRemoteDuel({ id: setup.id, topic: setup.topic, seed: setup.seed, score: correct });
            setResult(r);
            setPhase("done");
          }}
        />
      </Screen>
    );
  }

  if (phase === "sending") {
    return (
      <Screen>
        {header}
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        <T muted style={{ textAlign: "center", marginTop: 12 }}>Sending your score…</T>
      </Screen>
    );
  }

  const theirs = duel?.scores[1];
  const big = status === "won" ? "🏆" : status === "lost" ? "💪" : status === "tie" ? "🤝" : "📨";
  return (
    <Screen>
      {header}
      <Text style={{ fontSize: 56, textAlign: "center", marginTop: 16 }}>{big}</Text>
      <H1>
        {status === "won"
          ? "Du gewinnst! You win!"
          : status === "lost"
            ? `${partnerName(state, 1)} gewinnt!`
            : status === "tie"
              ? "Unentschieden!"
              : `You scored ${score}/${REMOTE_QUESTIONS}`}
      </H1>
      {theirs !== null && theirs !== undefined ? (
        <Card style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {([0, 1] as const).map((i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 30, fontWeight: "900", color: partnerColor(c, i) }}>{duel?.scores[i]}</Text>
              <PartnerName i={i} />
            </View>
          ))}
        </Card>
      ) : null}
      {result?.delivered ? (
        <T muted style={{ textAlign: "center", marginBottom: 12 }}>
          {status === "their-turn" ? `Sent! ${partnerName(state, 1)} will see your challenge in their app.` : "Your result was sent."}
        </T>
      ) : result ? (
        <Card>
          <T muted style={{ marginBottom: 8 }}>{result.error ? `⚠️ ${result.error} ` : ""}Share your duel as a secure link:</T>
          <Button
            title="Share duel link"
            onPress={async () => {
              const r = await shareText(`⚔️ Zwei Herzen ♡ duel — your turn!\n${result.link}`);
              setShareNote(r === "copied" ? "Copied — paste it to your partner." : "Sent!");
            }}
          />
          {shareNote ? <T muted style={{ marginTop: 6 }}>{shareNote}</T> : null}
        </Card>
      ) : null}
      <Button title="Back to chat" variant="secondary" onPress={() => router.replace("/us")} />
    </Screen>
  );
}
