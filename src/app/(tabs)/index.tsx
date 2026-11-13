import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card, Grid, H1, H2, LangPicker, PartnerName, ProgressBar, Row, Screen, SpeakButton, T, Tile } from "../../components/ui";
import { LEVELS, levelWords } from "../../content/levels";
import { partnerColor, usePalette } from "../../lib/theme";
import { dailyIndex } from "../../lib/util";
import { currentStreak, currentSubLevel, levelProgress, partnerName, today, useProgress } from "../../state/progress";

export default function Home() {
  const c = usePalette();
  const { state, reset } = useProgress();
  const [pa, pb] = state.partners;

  // Phrase of the day comes from the level you both can handle.
  const shared = LEVELS[Math.min(pa.unlocked, pb.unlocked)];
  const words = levelWords(shared);
  const phrase = words[dailyIndex(words.length)];

  return (
    <Screen>
      <H1>
        Hallo {partnerName(state, 0)} & {partnerName(state, 1)} 💞
      </H1>
      <T muted>
        {state.streak.last === today() ? "You've practised today — super!" : "Practise together today to keep your streak."}
      </T>

      <Card style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-around" }}>
        <Stat value={`🔥 ${currentStreak(state)}`} label="day streak" />
        <Stat value={String(pa.xp)} label={`${partnerName(state, 0)} XP`} color={c.a} />
        <Stat value={String(pb.xp)} label={`${partnerName(state, 1)} XP`} color={c.b} />
      </Card>

      <Card>
        <T muted style={{ fontSize: 13 }}>Satz des Tages · Phrase of the day · {shared.id}</T>
        <Row style={{ marginVertical: 4 }}>
          <Text style={{ color: c.text, fontSize: 21, fontWeight: "800", flexShrink: 1 }}>{phrase.de}</Text>
          <SpeakButton text={phrase.de} />
        </Row>
        <T muted>{phrase.en}</T>
        <T muted>{phrase.mr}</T>
        <T muted style={{ marginTop: 8 }}>💡 Use it on each other at least once today!</T>
      </Card>

      <Card>
        <T style={{ fontWeight: "700" }}>Where you are</T>
        {([0, 1] as const).map((i) => {
          const p = state.partners[i];
          const level = LEVELS[p.unlocked];
          const prog = levelProgress(p, level);
          const sub = currentSubLevel(p);
          return (
            <View key={i} style={{ marginTop: 10 }}>
              <Row>
                <PartnerName i={i} />
                <View style={{ backgroundColor: partnerColor(c, i), borderRadius: 6, paddingHorizontal: 6 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{level.id}</Text>
                </View>
                <T muted style={{ fontSize: 13 }}>
                  {sub.id} · {sub.title}
                </T>
                <View style={{ flex: 1 }} />
                <T muted style={{ fontSize: 13 }}>
                  {p.examsPassed.length ? "🎓".repeat(p.examsPassed.length) + " " : ""}
                  {prog.passed}/{prog.total} units
                </T>
              </Row>
              <ProgressBar value={prog.share} color={partnerColor(c, i)} />
            </View>
          );
        })}
      </Card>

      <H2>What shall we do?</H2>
      <Grid>
        <Tile emoji="📚" title="Flashcards" subtitle="Learn by level" onPress={() => router.navigate("/learn")} />
        <Tile emoji="⚔️" title="Quiz duel" subtitle="Pass the phone" onPress={() => router.navigate("/duel")} />
        <Tile emoji="💬" title="Chat" subtitle="Learn to talk" onPress={() => router.navigate("/talk")} />
        <Tile emoji="💌" title="Love note" subtitle="Write in German" onPress={() => router.navigate("/notes")} />
      </Grid>

      <H2>Learn through · शिकण्याची भाषा</H2>
      <Card>
        {([0, 1] as const).map((i) => (
          <Row key={i} style={{ marginVertical: 4 }}>
            <View style={{ minWidth: 70 }}>
              <PartnerName i={i} />
            </View>
            <LangPicker i={i} />
          </Row>
        ))}
        <T muted style={{ fontSize: 13, marginTop: 6 }}>
          Meanings, quizzes and chat help appear in this language. Flashcards always show both, so you can compare.
        </T>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          reset();
          router.replace("/setup");
        }}
        style={{ alignSelf: "center", marginTop: 28, padding: 8 }}
      >
        <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Start over (reset names & progress)</T>
      </Pressable>
    </Screen>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  const c = usePalette();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: color ?? c.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: c.muted }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
