import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { Button, Card, H1, H2, Meaning, Row, Screen, SpeakButton, T } from "../components/ui";
import { LIMITS } from "../lib/link";
import { shareText } from "../lib/share";
import { usePalette } from "../lib/theme";
import { couple, useProgress } from "../state/progress";

/** The couple’s own words: added by either partner, shared to both phones. */
export default function Words() {
  const c = usePalette();
  const { state, addOurWord } = useProgress();
  const [de, setDe] = useState("");
  const [en, setEn] = useState("");
  const [mr, setMr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const lang = state.partners[state.learner].lang;
  const linked = couple.isLinked(state);

  const input = {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.text,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginTop: 8,
  } as const;

  const add = async () => {
    if (!de.trim() || !en.trim() || busy) return;
    setBusy(true);
    const r = await addOurWord({ de: de.trim(), en: en.trim(), mr: mr.trim() });
    setBusy(false);
    setDe("");
    setEn("");
    setMr("");
    if (!r) setNote("Added 💞");
    else if (r.delivered) setNote("Added and shared with your partner 💞");
    else {
      const s = await shareText(`📖 Zwei Herzen ♡ — a new word for us:\n${r.link}`);
      setNote(s === "copied" ? "Added. Link copied — paste it to your partner." : "Added and shared 💞");
    }
  };

  return (
    <Screen>
      <H1>Our words 💞</H1>
      <T muted>
        Your own phrases — pet names, inside jokes, things you say every day. {linked ? "They appear on both phones." : ""}
      </T>

      <Card style={{ marginTop: 12 }}>
        <T style={{ fontWeight: "800" }}>Add a word</T>
        <TextInput style={input} value={de} onChangeText={setDe} placeholder="German, e.g. Kuscheln" placeholderTextColor={c.muted} maxLength={LIMITS.word} accessibilityLabel="German word" />
        <TextInput style={input} value={en} onChangeText={setEn} placeholder="English meaning" placeholderTextColor={c.muted} maxLength={LIMITS.word} accessibilityLabel="English meaning" />
        <TextInput style={input} value={mr} onChangeText={setMr} placeholder="मराठी (optional)" placeholderTextColor={c.muted} maxLength={LIMITS.word} accessibilityLabel="Marathi meaning" />
        <View style={{ marginTop: 10 }}>
          {busy ? <ActivityIndicator color={c.accent} /> : <Button title="Add 💞" onPress={add} disabled={!de.trim() || !en.trim()} />}
        </View>
        {note ? <T muted style={{ marginTop: 6 }}>{note}</T> : null}
      </Card>

      <H2>
        {state.customWords.length} word{state.customWords.length === 1 ? "" : "s"}
      </H2>
      {state.customWords.length ? (
        <>
          <Button title="📚 Practise with flashcards" variant="secondary" onPress={() => router.push({ pathname: "/lesson/[topicId]", params: { topicId: "ours" } })} />
          <Card style={{ marginTop: 10 }}>
            {[...state.customWords].reverse().map((w, k) => (
              <Row key={w.de} style={{ flexWrap: "nowrap", paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: c.border }}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "700" }}>{w.de}</T>
                  <Meaning w={w} lang={lang} size={14} />
                </View>
                <SpeakButton text={w.de} />
              </Row>
            ))}
          </Card>
        </>
      ) : (
        <T muted>No words yet. Add the first one above!</T>
      )}
    </Screen>
  );
}
