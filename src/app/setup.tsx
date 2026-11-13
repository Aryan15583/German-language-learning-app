import { router } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button, Card, H1, H2, LevelPicker, Screen, T } from "../components/ui";
import { LEVELS, type LevelId } from "../content/levels";
import { usePalette } from "../lib/theme";
import { useProgress } from "../state/progress";

const levelIndex = (id: LevelId) => LEVELS.findIndex((l) => l.id === id);

export default function Setup() {
  const c = usePalette();
  const { state, setNames } = useProgress();
  const [a, setA] = useState(state.partners[0].name);
  const [b, setB] = useState(state.partners[1].name);
  const [la, setLa] = useState<LevelId>(LEVELS[state.partners[0].unlocked].id);
  const [lb, setLb] = useState<LevelId>(LEVELS[state.partners[1].unlocked].id);
  const ok = a.trim() && b.trim();

  const input = {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.text,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  } as const;

  const descr = (id: LevelId) => {
    const l = LEVELS.find((x) => x.id === id)!;
    return `${l.id} · ${l.name} — ${l.blurb}`;
  };

  return (
    <Screen>
      <H1>Willkommen! 👋</H1>
      <T muted>Learn German together — practise side by side, quiz each other, and send sweet notes in German.</T>

      <H2>You</H2>
      <Card>
        <TextInput
          style={input}
          placeholder="Your name"
          placeholderTextColor={c.muted}
          value={a}
          onChangeText={setA}
          maxLength={20}
          accessibilityLabel="Your name"
        />
        <T muted style={{ marginTop: 12 }}>Your German level</T>
        <LevelPicker value={la} unlocked={LEVELS.length} onChange={setLa} />
        <T muted>{descr(la)}</T>
      </Card>

      <H2>Your partner</H2>
      <Card>
        <TextInput
          style={input}
          placeholder="Partner's name"
          placeholderTextColor={c.muted}
          value={b}
          onChangeText={setB}
          maxLength={20}
          accessibilityLabel="Partner's name"
        />
        <T muted style={{ marginTop: 12 }}>Their German level</T>
        <LevelPicker value={lb} unlocked={LEVELS.length} onChange={setLb} />
        <T muted>{descr(lb)}</T>
      </Card>

      <View style={{ marginTop: 8 }}>
        <Button
          title="Los geht's! (Let's go!)"
          disabled={!ok}
          onPress={() => {
            setNames(a.trim(), b.trim(), [levelIndex(la), levelIndex(lb)]);
            router.replace("/");
          }}
        />
        <T muted style={{ marginTop: 10, textAlign: "center" }}>
          Not sure? Pick A1. Higher levels unlock once you master 70% of a level.
        </T>
      </View>
    </Screen>
  );
}
