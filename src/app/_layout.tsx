import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
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
