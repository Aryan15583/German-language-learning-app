import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { usePalette } from "../lib/theme";
import { Card, H1, T } from "./ui";

/** Score summary shown at the end of a test. */
export function Results({
  passed,
  correct,
  total,
  title,
  message,
  children,
}: {
  passed: boolean;
  correct: number;
  total: number;
  title: string;
  message: ReactNode;
  children?: ReactNode;
}) {
  const c = usePalette();
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <View>
      <Text style={{ fontSize: 52, textAlign: "center", marginTop: 16 }}>{passed ? "🎉" : "💪"}</Text>
      <H1>{title}</H1>
      <Card style={{ alignItems: "center", marginTop: 8 }}>
        <Text style={{ fontSize: 40, fontWeight: "800", color: passed ? c.good : c.bad }}>{pct}%</Text>
        <T muted>
          {correct} of {total} correct
        </T>
      </Card>
      <T muted style={{ textAlign: "center", marginBottom: 16 }}>
        {message}
      </T>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}
