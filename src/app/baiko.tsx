import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";

// 🤫 Hidden easter egg. Opened by tapping the ♡ in the title five times.

const MESSAGE = "For my Baiko";
const HEARTS = ["💕", "💖", "💗", "❤️", "💞", "♡", "💓"];
const native = Platform.OS !== "web";

function FloatingHeart({ width, height, index, still }: { width: number; height: number; index: number; still: boolean }) {
  const [rise] = useState(() => new Animated.Value(0));
  const [sway] = useState(() => new Animated.Value(0));
  const look = useMemo(
    () => ({
      emoji: HEARTS[index % HEARTS.length],
      left: ((index * 47) % 100) / 100,
      size: 18 + ((index * 13) % 22),
      duration: 4200 + ((index * 733) % 3200),
      delay: (index * 380) % 3600,
    }),
    [index],
  );

  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(look.delay),
        Animated.timing(rise, { toValue: 1, duration: look.duration, easing: Easing.out(Easing.quad), useNativeDriver: native }),
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(sway, { toValue: -1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    wiggle.start();
    return () => {
      loop.stop();
      wiggle.stop();
    };
  }, [still, look, rise, sway]);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        left: look.left * (width - look.size),
        bottom: -40,
        fontSize: look.size,
        opacity: rise.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 0.9, 0] }),
        transform: [
          { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 80)] }) },
          { translateX: sway.interpolate({ inputRange: [-1, 1], outputRange: [-14, 14] }) },
          { scale: rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.1, 0.8] }) },
        ],
      }}
    >
      {look.emoji}
    </Animated.Text>
  );
}

export default function Baiko() {
  const { width, height } = useWindowDimensions();
  const [still, setStill] = useState(false);
  const [typed, setTyped] = useState("");
  const [pop] = useState(() => new Animated.Value(0));
  const [beat] = useState(() => new Animated.Value(1));
  const [after] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setStill)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 1. The card springs in.
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: native }).start();
    // 2. A soft glow pulses behind it.
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: native }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: native }),
      ]),
    ).start();
    // 3. The message types itself, letter by letter.
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(MESSAGE.slice(0, i));
      if (i >= MESSAGE.length) {
        clearInterval(typer);
        // 4. Then the rest fades in, and the heart starts to beat.
        Animated.timing(after, { toValue: 1, duration: 900, useNativeDriver: native }).start();
        Animated.loop(
          Animated.sequence([
            Animated.timing(beat, { toValue: 1.12, duration: 160, useNativeDriver: native }),
            Animated.timing(beat, { toValue: 0.97, duration: 160, useNativeDriver: native }),
            Animated.timing(beat, { toValue: 1.08, duration: 160, useNativeDriver: native }),
            Animated.timing(beat, { toValue: 1, duration: 500, useNativeDriver: native }),
          ]),
        ).start();
      }
    }, 140);
    return () => clearInterval(typer);
  }, [pop, beat, after, glow]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="For my Baiko. Tap to close."
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={styles.backdrop}
    >
      {Array.from({ length: 22 }, (_, i) => (
        <FloatingHeart key={i} index={i} width={width} height={height} still={still} />
      ))}

      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "0deg"] }) }],
          },
        ]}
      >
        <Animated.Text style={[styles.heart, { transform: [{ scale: beat }] }]}>💖</Animated.Text>
        <Text style={styles.title}>
          {typed}
          <Text style={{ opacity: typed.length < MESSAGE.length ? 1 : 0 }}>|</Text>
        </Text>
        <Animated.View style={{ opacity: after, transform: [{ translateY: after.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={styles.marathi}>माझ्या बायकोसाठी 💞</Text>
          <Text style={styles.german}>Mit all meiner Liebe — bis Berlin und weiter.</Text>
          <Text style={styles.small}>Zwei Herzen ♡ Until Berlin</Text>
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.hint, { opacity: after }]}>tap anywhere to close</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(43, 10, 24, 0.86)", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 24 },
  glow: { position: "absolute", width: 320, height: 320, borderRadius: 160, backgroundColor: "#FF7A9C" },
  card: {
    backgroundColor: "#FFF7F5",
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    maxWidth: 360,
    width: "100%",
    shadowColor: "#E2557A",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  heart: { fontSize: 64 },
  title: { fontSize: 34, fontWeight: "900", color: "#E2557A", marginTop: 8, textAlign: "center", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
  marathi: { fontSize: 20, color: "#2B1D22", textAlign: "center", marginTop: 12, fontWeight: "700" },
  german: { fontSize: 15, color: "#7A6870", textAlign: "center", marginTop: 8, fontStyle: "italic" },
  small: { fontSize: 12, color: "#B8A6AD", textAlign: "center", marginTop: 16, letterSpacing: 1 },
  hint: { position: "absolute", bottom: 40, color: "#FBE1E8", fontSize: 12 },
});
