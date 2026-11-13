import { router, Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, H2, Meaning, PartnerName, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic, LANGS, levelOfTopic, meaning, subLevelOfTopic } from "../../content/levels";
import { usePalette } from "../../lib/theme";
import { knownInUnit, UNIT_PASS, UNIT_TEST_QUESTIONS, unitPassed, useProgress } from "../../state/progress";

export default function Unit() {
  const c = usePalette();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const unit = findTopic(topicId);
  const level = levelOfTopic(topicId);
  const sub = subLevelOfTopic(topicId);
  const { state } = useProgress();
  const i = state.learner;
  const p = state.partners[i];

  if (!unit || !level || !sub) {
    return (
      <Screen>
        <T>Unit not found.</T>
      </Screen>
    );
  }

  const best = p.unitScores[unit.id];
  const passed = unitPassed(p, unit.id);
  const go = (pathname: "/lesson/[topicId]" | "/quiz/[topicId]") => router.push({ pathname, params: { topicId: unit.id } });

  return (
    <Screen>
      <Stack.Screen options={{ title: `${sub.id} · ${unit.title}` }} />
      <Text style={{ fontSize: 40 }}>{unit.emoji}</Text>
      <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>{unit.title}</Text>
      <T muted>
        {level.id} {level.name} · {sub.id} {sub.title}
      </T>

      <Card style={{ marginTop: 12, backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
        <T style={{ fontWeight: "800" }}>💡 {unit.tip.title}</T>
        <T style={{ marginTop: 4 }}>{unit.tip.body}</T>
      </Card>

      <Card style={{ backgroundColor: c.bSoft, borderColor: c.bSoft }}>
        <T style={{ fontWeight: "800" }}>🇮🇳 मराठी ↔ Deutsch</T>
        <T style={{ marginTop: 4 }}>{meaning(unit.compare, p.lang)}</T>
      </Card>

      <Card>
        <T style={{ fontWeight: "700" }}>1 · Learn the words</T>
        <T muted style={{ marginVertical: 6 }}>
          <PartnerName i={i} /> knows {knownInUnit(p, unit.id)} of {unit.words.length} words.
        </T>
        <Button title="📚 Flashcards" variant="secondary" onPress={() => go("/lesson/[topicId]")} />
      </Card>

      <Card>
        <T style={{ fontWeight: "700" }}>2 · Unit test {passed ? "⭐" : ""}</T>
        <T muted style={{ marginVertical: 6 }}>
          {UNIT_TEST_QUESTIONS} questions, including typing. Score {Math.round(UNIT_PASS * 100)}% to pass.
          {best !== undefined ? ` Best so far: ${Math.round(best * 100)}%.` : ""}
        </T>
        <Button title={passed ? "Retake the test" : "📝 Take the unit test"} onPress={() => go("/quiz/[topicId]")} />
      </Card>

      <H2>Words · German | {LANGS.find((l) => l.id === p.lang)!.label} | {p.lang === "en" ? "मराठी" : "English"}</H2>
      <Card>
        {unit.words.map((w, k) => (
          <View
            key={w.de}
            style={{ paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: c.border }}
          >
            <Row style={{ flexWrap: "nowrap" }}>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: "600" }}>{w.de}</T>
                <Meaning w={w} lang={p.lang} size={14} />
              </View>
              <SpeakButton text={w.de} />
            </Row>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
