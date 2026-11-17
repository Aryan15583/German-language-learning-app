import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BigButton, Card, Meaning, ProgressBar, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic, levelOfTopic, meaning, subLevelOfTopic } from "../../content/levels";
import { usePalette } from "../../lib/theme";
import { knownInUnit, unitPassed, useProgress } from "../../state/progress";

/** One unit: two big buttons (learn, then quiz). Tips and the word list fold away. */
export default function Unit() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const unit = findTopic(topicId);
  const level = levelOfTopic(topicId);
  const sub = subLevelOfTopic(topicId);
  const { state } = useProgress();
  const p = state.partners[state.learner];

  if (!unit || !level || !sub) {
    return (
      <Screen>
        <T>Not found.</T>
      </Screen>
    );
  }

  const known = knownInUnit(p, unit.id);
  const allKnown = known >= unit.words.length;
  const passed = unitPassed(p, unit.id);
  const go = (pathname: "/lesson/[topicId]" | "/quiz/[topicId]") => router.push({ pathname, params: { topicId: unit.id } });

  return (
    <Screen>
      <Stack.Screen options={{ title: unit.title }} />
      <View style={{ alignItems: "center", marginTop: 4 }}>
        <Text style={{ fontSize: 72 }}>{unit.emoji}</Text>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "900", textAlign: "center" }}>{unit.title}</Text>
        {passed ? <Text style={{ color: c.good, fontWeight: "900", fontSize: 16, marginTop: 4 }}>⭐ Done! Great job</Text> : null}
      </View>

      <Card style={{ marginTop: 14 }}>
        <T style={{ fontWeight: "700" }}>
          You know {known} of {unit.words.length} words
        </T>
        <ProgressBar value={known / unit.words.length} color={allKnown ? c.good : c.accent} />
        <BigButton title="📚  Learn the words" onPress={() => go("/lesson/[topicId]")} color={allKnown ? c.b : c.good} />
        <BigButton title={passed ? "✏️  Do the quiz again" : "✏️  Quiz"} onPress={() => go("/quiz/[topicId]")} color={allKnown && !passed ? c.good : c.b} />
        <T muted style={{ fontSize: 13, textAlign: "center", marginTop: 8 }}>
          {allKnown ? "You know all the words — try the quiz!" : "Tip: learn the words first, then take the quiz."}
        </T>
      </Card>

      <Fold title={`💡 Little grammar tip: ${unit.tip.title}`}>
        <T>{unit.tip.body}</T>
      </Fold>
      <Fold title="🇮🇳 Marathi ↔ German">
        <T>{meaning(unit.compare, p.lang)}</T>
      </Fold>
      <Fold title={`📖 All ${unit.words.length} words`}>
        {unit.words.map((w, k) => (
          <View key={w.de} style={{ paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: c.border }}>
            <Row style={{ flexWrap: "nowrap" }}>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: "700", fontSize: 16 }}>{w.de}</T>
                <Meaning w={w} lang={p.lang} size={14} />
              </View>
              <SpeakButton text={w.de} />
            </Row>
          </View>
        ))}
      </Fold>
    </Screen>
  );
}

/** A tap-to-open section, closed by default so the screen stays simple. */
function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}>
        <Row style={{ flexWrap: "nowrap" }}>
          <Text style={{ color: c.text, fontWeight: "800", flex: 1 }}>{title}</Text>
          <Text style={{ color: c.muted, fontSize: 18 }}>{open ? "▲" : "▼"}</Text>
        </Row>
      </Pressable>
      {open ? <View style={{ marginTop: 8 }}>{children}</View> : null}
    </Card>
  );
}
