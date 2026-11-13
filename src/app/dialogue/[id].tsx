import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Chip, Row, Screen, SpeakButton, T } from "../../components/ui";
import { DIALOGUES, meaning } from "../../content/levels";
import { partnerColor, partnerSoft, usePalette } from "../../lib/theme";
import { partnerName, useProgress, type PartnerIndex } from "../../state/progress";

export default function DialogueScreen() {
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = DIALOGUES.find((x) => x.id === id);
  const { state, practiced } = useProgress();
  const [showEn, setShowEn] = useState(true);
  const [swapped, setSwapped] = useState(false);
  const [challenge, setChallenge] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (!d) {
    return (
      <Screen>
        <T>Dialogue not found.</T>
      </Screen>
    );
  }

  const speaker = (who: "a" | "b"): PartnerIndex => ((who === "a") !== swapped ? 0 : 1);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${d.level} · ${d.title}` }} />
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Show translation" selected={showEn} onPress={() => setShowEn(!showEn)} />
        <Chip
          label="Challenge: hide German"
          selected={challenge}
          onPress={() => {
            setChallenge(!challenge);
            setRevealed(new Set());
          }}
        />
        <Chip label="Swap roles ⇄" onPress={() => setSwapped(!swapped)} />
      </Row>

      {d.lines.map((l, i) => {
        const p = speaker(l.who);
        const hidden = challenge && !revealed.has(i);
        const right = p === 1;
        return (
          <Pressable
            key={i}
            disabled={!hidden}
            accessibilityRole={hidden ? "button" : undefined}
            accessibilityLabel={hidden ? "Reveal German line" : undefined}
            onPress={() => setRevealed(new Set(revealed).add(i))}
            style={{
              maxWidth: "86%",
              alignSelf: right ? "flex-end" : "flex-start",
              backgroundColor: partnerSoft(c, p),
              borderRadius: 16,
              borderBottomLeftRadius: right ? 16 : 4,
              borderBottomRightRadius: right ? 4 : 16,
              padding: 12,
              marginVertical: 5,
            }}
          >
            <Text style={{ color: partnerColor(c, p), fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
              {partnerName(state, p)}
            </Text>
            {hidden ? (
              <T muted style={{ fontStyle: "italic", marginVertical: 2 }}>Say it in German, then tap to check…</T>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 2 }}>
                <T style={{ flexShrink: 1, fontSize: 16 }}>{l.de}</T>
                <SpeakButton text={l.de} />
              </View>
            )}
            {showEn || hidden ? <T muted style={{ fontSize: 14 }}>{meaning(l, state.partners[p].lang)}</T> : null}
          </Pressable>
        );
      })}

      <T muted style={{ textAlign: "center", marginVertical: 12 }}>
        {challenge ? "Say each line from the translation, then tap to check." : "Tip: read it twice, then swap roles."}
      </T>
      <Button
        title="We did it! (+10 XP each)"
        onPress={() => {
          practiced(0, 10);
          practiced(1, 10);
          router.back();
        }}
      />
    </Screen>
  );
}
