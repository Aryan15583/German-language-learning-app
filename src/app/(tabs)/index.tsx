import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Grid, H1, H2, LangPicker, PartnerName, ProgressBar, Row, Screen, SpeakButton, T, Tile } from "../../components/ui";
import { LEVELS, levelWords } from "../../content/levels";
import { partnerColor, usePalette } from "../../lib/theme";
import { romanizeMarathi } from "../../lib/romanize";
import { dailyIndex } from "../../lib/util";
import { ACHIEVEMENTS, DAILY_GOAL, earnedAchievements, heartLevel, isoWeek, weeklyLeader } from "../../lib/game";
import { couple, currentStreak, currentSubLevel, levelProgress, partnerName, today, useProgress, type PartnerIndex } from "../../state/progress";

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

      <Competition />

      <Card>
        <T muted style={{ fontSize: 13 }}>Satz des Tages · Phrase of the day · {shared.id}</T>
        <Row style={{ marginVertical: 4 }}>
          <Text style={{ color: c.text, fontSize: 21, fontWeight: "800", flexShrink: 1 }}>{phrase.de}</Text>
          <SpeakButton text={phrase.de} />
        </Row>
        <T muted>{phrase.en}</T>
        <T muted>
          {phrase.mr} · {romanizeMarathi(phrase.mr)}
        </T>
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

      <PinSettings />

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

/** Hearts level, daily goal, weekly battle and badges. */
function Competition() {
  const c = usePalette();
  const { state } = useProgress();
  const me: PartnerIndex = couple.isLinked(state) ? 0 : state.learner;
  const other: PartnerIndex = me === 0 ? 1 : 0;
  const p = state.partners[me];
  const hearts = heartLevel(p.xp);
  const day = today();
  const todayXp = p.today.date === day ? p.today.xp : 0;
  const week = isoWeek(day);
  const weekXp = (i: PartnerIndex) => (state.partners[i].week.id === week ? state.partners[i].week.xp : 0);
  const leader = weeklyLeader(weekXp(me), weekXp(other));
  const streak = currentStreak(state);
  const earned = earnedAchievements(couple.achievementContext(state, me, streak));

  return (
    <Card>
      <Row>
        <Text style={{ fontSize: 26 }}>❤️</Text>
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: "800" }}>
            Lv {hearts.level} · {hearts.title}
          </T>
          <ProgressBar value={hearts.progress} color={partnerColor(c, me)} />
          <T muted style={{ fontSize: 12 }}>
            {hearts.into} / {hearts.span} XP to the next heart
          </T>
        </View>
      </Row>

      <View style={{ marginTop: 12 }}>
        <T style={{ fontWeight: "700" }}>
          🎯 Daily goal {todayXp >= DAILY_GOAL ? "✓ geschafft!" : `${todayXp} / ${DAILY_GOAL} XP`}
        </T>
        <ProgressBar value={todayXp / DAILY_GOAL} color={todayXp >= DAILY_GOAL ? c.good : c.accent} />
      </View>

      <View style={{ marginTop: 10 }}>
        <T style={{ fontWeight: "700" }}>⚔️ Weekly battle</T>
        <Row style={{ marginTop: 4 }}>
          <Text style={{ color: partnerColor(c, me), fontWeight: "900", fontSize: 20 }}>{weekXp(me)}</Text>
          <T muted>vs</T>
          <Text style={{ color: partnerColor(c, other), fontWeight: "900", fontSize: 20 }}>{weekXp(other)}</Text>
          <View style={{ flex: 1 }} />
          <T style={{ fontSize: 13 }}>
            {leader === "tie" ? "Gleichstand 🤝" : leader === "me" ? `${partnerName(state, me)} leads 👑` : `${partnerName(state, other)} leads 🔥`}
          </T>
        </Row>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/badges")} style={{ marginTop: 12 }}>
        <Row>
          <T style={{ fontWeight: "700" }}>🏅 Badges</T>
          <Text style={{ fontSize: 18, flexShrink: 1 }}>{earned.length ? earned.map((a) => a.emoji).join(" ") : "—"}</Text>
          <View style={{ flex: 1 }} />
          <T muted style={{ fontSize: 13 }}>
            {earned.length}/{ACHIEVEMENTS.length} ›
          </T>
        </Row>
      </Pressable>
    </Card>
  );
}

/** Optional PIN for each profile on this phone. */
function PinSettings() {
  const c = usePalette();
  const { state, setPin } = useProgress();
  const people: PartnerIndex[] = couple.isLinked(state) ? [0] : [0, 1];
  const [editing, setEditing] = useState<PartnerIndex | null>(null);
  const [pin, setPinText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  return (
    <>
      <H2>Privacy 🔐</H2>
      <Card>
        {people.map((i) => (
          <Row key={i} style={{ marginVertical: 4 }}>
            <View style={{ minWidth: 70 }}>
              <PartnerName i={i} />
            </View>
            <T muted style={{ flex: 1, fontSize: 13 }}>{state.partners[i].pin ? "PIN on 🔒" : "No PIN"}</T>
            <Chip label={state.partners[i].pin ? "Change" : "Set PIN"} onPress={() => setEditing(i)} />
            {state.partners[i].pin ? (
              <Chip
                label="Remove"
                onPress={async () => {
                  await setPin(i, null);
                  setNote("PIN removed.");
                }}
              />
            ) : null}
          </Row>
        ))}
        {editing !== null ? (
          <View style={{ marginTop: 8 }}>
            <TextInput
              value={pin}
              onChangeText={(t) => setPinText(t.replace(/\D/g, "").slice(0, 8))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="New PIN (4–8 digits)"
              placeholderTextColor={c.muted}
              accessibilityLabel="New PIN"
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, color: c.text, backgroundColor: c.bg, fontSize: 18, letterSpacing: 4 }}
            />
            <Row style={{ marginTop: 8 }}>
              {busy ? (
                <ActivityIndicator color={c.accent} />
              ) : (
                <Button
                  title="Save PIN"
                  disabled={pin.length < 4}
                  onPress={async () => {
                    setBusy(true);
                    await setPin(editing, pin);
                    setBusy(false);
                    setEditing(null);
                    setPinText("");
                    setNote("PIN saved. The app asks for it next time it opens.");
                  }}
                />
              )}
              <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
            </Row>
          </View>
        ) : null}
        {note ? <T muted style={{ marginTop: 6, fontSize: 13 }}>{note}</T> : null}
        <T muted style={{ fontSize: 12, marginTop: 6 }}>
          The PIN is stored only as a salted, slow hash on this phone. It can’t be recovered — forgetting it means resetting the app.
        </T>
      </Card>
    </>
  );
}
