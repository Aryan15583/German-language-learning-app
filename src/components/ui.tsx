import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LANGS, LEVELS, type Lang, type LevelId } from "../content/levels";
import { speakGerman } from "../lib/speech";
import { partnerColor, usePalette } from "../lib/theme";
import { partnerName, useProgress, type PartnerIndex } from "../state/progress";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const inner = <View style={styles.inner}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>{inner}</ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[styles.h1, { color: c.text }]}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[styles.h2, { color: c.text }]}>{children}</Text>;
}

export function T({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return <Text style={[{ color: muted ? c.muted : c.text, fontSize: 15, lineHeight: 21 }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const c = usePalette();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? c.accent : c.accentSoft, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? c.onAccent : c.text }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? c.accent : c.border, backgroundColor: selected ? c.accent : c.surface },
      ]}
    >
      <Text style={{ color: selected ? c.onAccent : c.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Tile({
  emoji,
  title,
  subtitle,
  onPress,
  locked,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  locked?: boolean;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.surface, borderColor: pressed ? c.accent : c.border, opacity: locked ? 0.55 : 1 },
      ]}
    >
      <Text style={{ fontSize: 26 }}>{locked ? "🔒" : emoji}</Text>
      <Text style={{ color: c.text, fontWeight: "700", marginTop: 6 }}>{title}</Text>
      {subtitle ? <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = usePalette();
  return (
    <View style={[styles.progress, { backgroundColor: c.accentSoft }]}>
      <View style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, height: "100%", backgroundColor: color ?? c.accent }} />
    </View>
  );
}

export function SpeakButton({ text }: { text: string }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Listen: ${text}`}
      onPress={() => speakGerman(text)}
      hitSlop={8}
      style={[styles.speak, { borderColor: c.border }]}
    >
      <Text>🔊</Text>
    </Pressable>
  );
}

export function PartnerName({ i, suffix = "" }: { i: PartnerIndex; suffix?: string }) {
  const c = usePalette();
  const { state } = useProgress();
  return <Text style={{ color: partnerColor(c, i), fontWeight: "700" }}>{partnerName(state, i) + suffix}</Text>;
}

/** Header switch for who is currently studying. */
export function LearnerSwitch() {
  const c = usePalette();
  const { state, setLearner } = useProgress();
  return (
    <View style={[styles.switch, { backgroundColor: c.surface, borderColor: c.border }]}>
      {([0, 1] as const).map((i) => {
        const on = state.learner === i;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => setLearner(i)}
            style={[styles.switchBtn, on && { backgroundColor: partnerColor(c, i) }]}
          >
            <Text style={{ color: on ? "#fff" : c.text, fontSize: 13, fontWeight: on ? "700" : "400" }}>
              {partnerName(state, i)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Row of CEFR level pills; locked ones show a padlock. */
export function LevelPicker({
  value,
  unlocked,
  onChange,
}: {
  value: LevelId;
  unlocked: number;
  onChange: (id: LevelId) => void;
}) {
  const c = usePalette();
  return (
    <View style={styles.levelRow}>
      {LEVELS.map((l, i) => {
        const on = l.id === value;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            accessibilityLabel={`Level ${l.id}${i > unlocked ? ", locked" : ""}`}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(l.id)}
            style={[
              styles.levelPill,
              { borderColor: on ? c.accent : c.border, backgroundColor: on ? c.accent : c.surface },
            ]}
          >
            <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "800" }}>{l.id}</Text>
            {i > unlocked ? <Text style={{ fontSize: 10 }}>🔒</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.row, style]}>{children}</View>
);

const styles = StyleSheet.create({
  inner: { width: "100%", maxWidth: 640, alignSelf: "center", padding: 16 },
  h1: { fontSize: 26, fontWeight: "800", marginTop: 4, marginBottom: 4 },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  button: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: "center" },
  buttonText: { fontWeight: "700", fontSize: 15 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  tile: { borderWidth: 1, borderRadius: 16, padding: 14, flexGrow: 1, flexBasis: 150 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  progress: { height: 8, borderRadius: 999, overflow: "hidden", marginVertical: 8 },
  speak: { borderWidth: 1, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, alignSelf: "center" },
  switch: { flexDirection: "row", borderWidth: 1, borderRadius: 999, padding: 3, gap: 2 },
  switchBtn: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  levelPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 40,
    flexBasis: 40,
    alignItems: "center",
    flexGrow: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
});

/** "Learn through: English / मराठी" switch for one partner. */
export function LangPicker({ i }: { i: PartnerIndex }) {
  const { state, setLang } = useProgress();
  return (
    <Row>
      {LANGS.map((l) => (
        <Chip key={l.id} label={l.label} selected={state.partners[i].lang === l.id} onPress={() => setLang(i, l.id)} />
      ))}
    </Row>
  );
}

/** A word's meaning in the learner's language, with the other language underneath for comparison. */
export function Meaning({ w, lang, size = 15 }: { w: { en: string; mr: string }; lang: Lang; size?: number }) {
  const c = usePalette();
  const main = lang === "mr" ? w.mr : w.en;
  const other = lang === "mr" ? w.en : w.mr;
  return (
    <View>
      <Text style={{ color: c.text, fontSize: size }}>{main}</Text>
      <Text style={{ color: c.muted, fontSize: Math.round(size * 0.85) }}>{other}</Text>
    </View>
  );
}
