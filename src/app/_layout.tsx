import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { usePalette } from "../lib/theme";
import { ProgressProvider, useProgress } from "../state/progress";

function RootStack() {
  const c = usePalette();
  const { ready } = useProgress();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.accent,
          headerTitleStyle: { color: c.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="unit/[topicId]" options={{ title: "Unit" }} />
        <Stack.Screen name="lesson/[topicId]" options={{ title: "Flashcards" }} />
        <Stack.Screen name="quiz/[topicId]" options={{ title: "Unit test" }} />
        <Stack.Screen name="exam/[levelId]" options={{ title: "Exam" }} />
        <Stack.Screen name="placement" options={{ title: "Placement test" }} />
        <Stack.Screen name="duel/[topicId]" options={{ title: "Quiz duel" }} />
        <Stack.Screen name="dialogue/[id]" options={{ title: "Role-play" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ProgressProvider>
      <RootStack />
    </ProgressProvider>
  );
}

/** Shown instead of a blank screen if something unexpected goes wrong. Progress is not lost. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFF7F5" }}>
      <Text style={{ fontSize: 48 }}>🥨</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#2B1D22", marginTop: 8 }}>Hoppla! Something went wrong.</Text>
      <Text style={{ color: "#7A6870", textAlign: "center", marginVertical: 12 }}>
        Your progress is safe. Try again, and if it keeps happening, reload the page.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={{ backgroundColor: "#E2557A", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Noch mal versuchen (Try again)</Text>
      </Pressable>
    </View>
  );
}
