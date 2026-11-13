import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Text, View } from "react-native";
import { LearnerSwitch } from "../../components/ui";
import { usePalette } from "../../lib/theme";
import { useProgress } from "../../state/progress";

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  const c = usePalette();
  const { state } = useProgress();

  if (!state.partners[0].name || !state.partners[1].name) return <Redirect href="/setup" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.accent, fontWeight: "800" },
        headerShadowVisible: false,
        headerRight: () => (
          <View style={{ marginRight: 12 }}>
            <LearnerSwitch />
          </View>
        ),
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Zusammen 👉👈", tabBarLabel: "Home", tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: icon("📚") }} />
      <Tabs.Screen name="duel" options={{ title: "Duel", tabBarIcon: icon("⚔️") }} />
      <Tabs.Screen name="talk" options={{ title: "Talk", tabBarIcon: icon("💬") }} />
      <Tabs.Screen name="notes" options={{ title: "Notes", tabBarIcon: icon("💌") }} />
    </Tabs>
  );
}
