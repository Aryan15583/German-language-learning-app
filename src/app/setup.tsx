import { router } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Button, Card, Chip, H1, H2, LevelPicker, Row, Screen, T } from "../components/ui";
import { LANGS, LEVELS, type Lang, type LevelId } from "../content/levels";
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
  const [langs, setLangs] = useState<[Lang, Lang]>([state.partners[0].lang, state.partners[1].lang]);
  const ok = a.trim() && b.trim();

  const langRow = (i: 0 | 1) => (
    <>
      <T muted style={{ marginTop: 12 }}>Learn German through · शिकण्याची भाषा</T>
      <Row style={{ marginTop: 6 }}>
        {LANGS.map((l) => (
          <Chip
            key={l.id}
            label={l.label}
            selected={langs[i] === l.id}
            onPress={() => setLangs((x) => (i === 0 ? [l.id, x[1]] : [x[0], l.id]))}
          />
        ))}
      </Row>
    </>
  );

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
      <T muted>Learn German together — practise side by side, quiz each other, chat, and send sweet notes in German. मराठीतूनही शिका!</T>

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
        {langRow(0)}
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
        {langRow(1)}
      </Card>

      <View style={{ marginTop: 8 }}>
        <Button
          title="Los geht's! (Let's go!)"
          disabled={!ok}
          onPress={() => {
            setNames(a.trim(), b.trim(), [levelIndex(la), levelIndex(lb)], langs);
            router.replace("/");
          }}
        />
        <T muted style={{ marginTop: 10, textAlign: "center" }}>
          Not sure? Pick A1 — you can take a placement test later. Each level ends with an exam that unlocks the next.
        </T>
      </View>
    </Screen>
  );
}
