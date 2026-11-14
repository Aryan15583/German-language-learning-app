import { router } from "expo-router";
import { useRef } from "react";
import { Text } from "react-native";
import { usePalette } from "../lib/theme";

const TAPS = 5;
const WINDOW_MS = 2500;

/** The app title. (Psst: the heart is a door.) */
export function BrandTitle() {
  const c = usePalette();
  const taps = useRef<number[]>([]);

  const onHeart = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < WINDOW_MS), now];
    if (taps.current.length >= TAPS) {
      taps.current = [];
      router.push("/baiko");
    }
  };

  return (
    <Text style={{ color: c.accent, fontWeight: "800", fontSize: 18 }}>
      Zwei Herzen{" "}
      <Text onPress={onHeart} suppressHighlighting accessibilityElementsHidden importantForAccessibility="no">
        ♡
      </Text>
    </Text>
  );
}
