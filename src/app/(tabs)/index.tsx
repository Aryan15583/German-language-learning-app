import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BigButton, Card, ProgressBar, Row, Screen, SpeakButton, T } from "../../components/ui";
import { LEVELS, levelWords, meaning } from "../../content/levels";
import { DAILY_GOAL, isoWeek } from "../../lib/game";
import { nextStep, stepHref, stepLabel } from "../../lib/path";
import { partnerColor, usePalette } from "../../lib/theme";
import { dailyIndex } from "../../lib/util";
import { couple, currentStreak, partnerName, today, useProgress } from "../../state/progress";

/** Today: one big button that always knows what to do next. */
export default function Today() {
  const c = usePalette();
  const { state, dismissWelcome, accountMode } = useProgress();
  // Whoever is selected (on a shared phone) — always partner 0 with accounts.
  const who = state.learner;
  const me = state.partners[who];
  const step = nextStep(me, dailyIndex(1000));
  const label = stepLabel(step);
  const streak = currentStreak(state);
  const day = today();
  const todayXp = me.today.date === day ? me.today.xp : 0;
  const goalDone = todayXp >= DAILY_GOAL;
  const linked = couple.isLinked(state);
  const words = levelWords(LEVELS[me.unlocked]);
  const word = words[dailyIndex(words.length)];

  return (
    <Screen>
      {!state.welcomeDone ? (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "900" }}>How it works 👋</Text>
          <Step n="1" text="Tap the big ▶ Start button. That’s it — the app picks what’s next." />
          <Step n="2" text="Learn a few words 📚, then a short quiz ✏️. Every level ends with a big test 🎓." />
          <Step n="3" text={linked || !accountMode ? "Chat and play with your partner in 💞 Us." : "Link with your partner in 💞 Us to chat and play together."} />
          <BigButton title="Got it! 👍" onPress={dismissWelcome} color={c.accent} />
        </Card>
      ) : null}

      <Text style={{ color: c.text, fontSize: 30, fontWeight: "900", marginTop: 4 }}>Hallo {partnerName(state, who)}! 👋</Text>

      <Row style={{ marginTop: 6, marginBottom: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: c.text }}>🔥 {streak}</Text>
        <T muted>{streak === 1 ? "day" : "days"}</T>
        <View style={{ flex: 1 }} />
        <T muted style={{ fontSize: 14 }}>{goalDone ? "🎯 Goal done! 🎉" : `🎯 ${todayXp} / ${DAILY_GOAL} XP today`}</T>
      </Row>
      <ProgressBar value={todayXp / DAILY_GOAL} color={goalDone ? c.good : c.accent} />

      {/* The one big button */}
      <Card style={{ marginTop: 12, alignItems: "center", paddingVertical: 24, borderWidth: 2, borderColor: c.accent }}>
        <T muted style={{ fontSize: 14, fontWeight: "700" }}>{goalDone ? "Want more? Next up:" : "Next up"}</T>
        <Text style={{ fontSize: 64, marginVertical: 4 }}>{label.emoji}</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "900", textAlign: "center" }}>{label.title}</Text>
        <T muted style={{ textAlign: "center", marginBottom: 14 }}>{label.detail}</T>
        <BigButton title="▶  Start" onPress={() => router.push(stepHref(step))} color={c.good} large />
      </Card>

      <Card>
        <T muted style={{ fontSize: 13, fontWeight: "700" }}>⭐ Word of the day</T>
        <Row style={{ marginTop: 4, flexWrap: "nowrap" }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", flexShrink: 1 }}>{word.de}</Text>
          <SpeakButton text={word.de} />
        </Row>
        <T muted>{meaning(word, me.lang)}</T>
      </Card>

      <Row style={{ flexWrap: "nowrap", gap: 10 }}>
        <FunTile emoji="💬" title="Talk" onPress={() => router.push("/talk")} />
        <FunTile emoji="⚔️" title="Play" onPress={() => router.push("/play")} />
        <FunTile emoji="💌" title="Love note" onPress={() => router.push("/note")} />
      </Row>

      {linked ? <PartnerStrip /> : null}
    </Screen>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  const c = usePalette();
  return (
    <Row style={{ marginTop: 10, flexWrap: "nowrap", alignItems: "flex-start" }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: c.onAccent, fontWeight: "900" }}>{n}</Text>
      </View>
      <T style={{ flex: 1, fontSize: 16 }}>{text}</T>
    </Row>
  );
}

function FunTile({ emoji, title, onPress }: { emoji: string; title: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: pressed ? c.accent : c.border,
        backgroundColor: c.surface,
      })}
    >
      <Text style={{ fontSize: 34 }}>{emoji}</Text>
      <Text style={{ color: c.text, fontWeight: "800", marginTop: 4 }}>{title}</Text>
    </Pressable>
  );
}

/** Your partner at a glance (tap to open Us). */
function PartnerStrip() {
  const c = usePalette();
  const { state } = useProgress();
  const week = isoWeek(today());
  const mine = state.partners[0].week.id === week ? state.partners[0].week.xp : 0;
  const theirs = state.partners[1].week.id === week ? state.partners[1].week.xp : 0;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.navigate("/us")} style={{ marginTop: 12 }}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 28 }}>💞</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: partnerColor(c, 1), fontWeight: "900", fontSize: 16 }}>{partnerName(state, 1)}</Text>
          <T muted style={{ fontSize: 13 }}>
            🔥 {state.partners[1].remote?.streak ?? 0} · this week {mine} vs {theirs} XP
          </T>
        </View>
        <Text style={{ color: c.muted, fontSize: 22 }}>›</Text>
      </Card>
    </Pressable>
  );
}
