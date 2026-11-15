import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { Button, Card, LevelPicker, ProgressBar, Screen, T } from "../../components/ui";
import { LEVELS, levelIndex, type LevelId, type Topic } from "../../content/levels";
import { unitState, type UnitState } from "../../lib/path";
import { usePalette } from "../../lib/theme";
import { examReady, isLocked, levelProgress, useProgress } from "../../state/progress";

const native = Platform.OS !== "web";
// Bubbles zig-zag gently down the screen, like a game map.
const OFFSETS = [0, 60, 0, -60];

/** The learning path: big bubbles to tap, one after another. */
export default function Learn() {
  const c = usePalette();
  const { state } = useProgress();
  const p = state.partners[state.learner];
  const [picked, setPicked] = useState<LevelId | null>(null);
  const level = LEVELS[levelIndex(picked ?? LEVELS[p.unlocked].id)];
  const locked = isLocked(p, level);
  const prog = levelProgress(p, level);
  const passed = p.examsPassed.includes(level.id);
  const ready = examReady(p, level);
  const openTest = () => router.push({ pathname: "/exam/[levelId]", params: { levelId: level.id } });
  let n = 0;

  return (
    <Screen>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: "900" }}>Your path 🗺️</Text>
      <LevelPicker value={level.id} unlocked={p.unlocked} onChange={setPicked} />

      <Card>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>
          {level.id} · {level.name} {passed ? "🎓" : ""}
        </Text>
        <ProgressBar value={prog.share} />
        <T muted style={{ fontSize: 13 }}>
          {prog.passed} of {prog.total} done
        </T>
      </Card>

      {locked ? (
        <Card style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
          <T style={{ fontWeight: "800", textAlign: "center" }}>Not open yet</T>
          <T muted style={{ textAlign: "center", marginVertical: 6 }}>
            Finish {LEVELS[levelIndex(level.id) - 1].id} first. Already know {level.id}? You can skip ahead by passing its big test.
          </T>
          <Button title={`Try the ${level.id} big test`} variant="secondary" onPress={openTest} />
        </Card>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          {level.subLevels.map((sub, k) => (
            <View key={sub.id} style={{ alignItems: "center", width: "100%" }}>
              <T muted style={{ fontWeight: "800", marginTop: k ? 18 : 4, marginBottom: 6 }}>
                Part {k + 1} · {sub.title}
              </T>
              {sub.units.map((u) => (
                <Bubble key={u.id} unit={u} state={unitState(p, u)} offset={OFFSETS[n++ % OFFSETS.length]} />
              ))}
            </View>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${level.id} big test`}
            onPress={ready || passed ? openTest : undefined}
            style={{ alignItems: "center", marginTop: 22, opacity: ready || passed ? 1 : 0.45 }}
          >
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: passed ? "#F5C542" : ready ? c.accent : c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 46 }}>{ready || passed ? "🎓" : "🔒"}</Text>
            </View>
            <Text style={{ color: c.text, fontWeight: "900", marginTop: 6 }}>Big test</Text>
            <T muted style={{ fontSize: 12, textAlign: "center" }}>
              {passed ? "Passed! 🎉" : ready ? "You’re ready — tap to start" : "Finish all bubbles first"}
            </T>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

function Bubble({ unit, state, offset }: { unit: Topic; state: UnitState; offset: number }) {
  const c = usePalette();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (state !== "next") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const bg = state === "done" ? "#F5C542" : state === "next" ? c.accent : c.surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unit.title}${state === "done" ? ", done" : state === "next" ? ", start here" : ""}`}
      onPress={() => router.push({ pathname: "/unit/[topicId]", params: { topicId: unit.id } })}
      style={{ alignItems: "center", marginVertical: 8, transform: [{ translateX: offset }] }}
    >
      <Animated.View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: bg,
          borderWidth: state === "open" ? 3 : 0,
          borderColor: c.border,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pulse }],
          shadowColor: state === "next" ? c.accent : "transparent",
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: state === "next" ? 6 : 0,
        }}
      >
        <Text style={{ fontSize: 38 }}>{unit.emoji}</Text>
        {state === "done" ? <Text style={{ position: "absolute", top: -4, right: -4, fontSize: 22 }}>⭐</Text> : null}
      </Animated.View>
      {state === "next" ? (
        <View style={{ backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: -10 }}>
          <Text style={{ color: c.onAccent, fontWeight: "900", fontSize: 12 }}>START</Text>
        </View>
      ) : null}
      <Text style={{ color: c.text, fontWeight: "800", marginTop: 4, maxWidth: 160, textAlign: "center" }}>{unit.title}</Text>
    </Pressable>
  );
}
