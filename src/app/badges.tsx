import { Text, View } from "react-native";
import { Card, H1, PartnerName, Row, Screen, T } from "../components/ui";
import { ACHIEVEMENTS } from "../lib/game";
import { partnerColor, usePalette } from "../lib/theme";
import { couple, currentStreak, useProgress, type PartnerIndex } from "../state/progress";

export default function Badges() {
  const c = usePalette();
  const { state } = useProgress();
  const streak = currentStreak(state);
  const ctx = ([0, 1] as PartnerIndex[]).map((i) => couple.achievementContext(state, i, streak));

  return (
    <Screen>
      <H1>Achievements 🏅</H1>
      <T muted style={{ marginBottom: 12 }}>
        Collect them together — who gets more, <PartnerName i={0} /> or <PartnerName i={1} />?
      </T>
      {ACHIEVEMENTS.map((a) => {
        const got = ctx.map((x) => a.test(x));
        return (
          <Card key={a.id} style={{ opacity: got[0] || got[1] ? 1 : 0.55 }}>
            <Row style={{ flexWrap: "nowrap" }}>
              <Text style={{ fontSize: 30 }}>{got[0] || got[1] ? a.emoji : "🔒"}</Text>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: "800" }}>{a.title}</T>
                <T muted style={{ fontSize: 13 }}>{a.desc}</T>
              </View>
              {([0, 1] as PartnerIndex[]).map((i) => (
                <View
                  key={i}
                  accessibilityLabel={`${got[i] ? "Earned" : "Not yet"} by ${state.partners[i].name}`}
                  style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: got[i] ? partnerColor(c, i) : c.border }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>{(state.partners[i].name || "?").slice(0, 1).toUpperCase()}</Text>
                </View>
              ))}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
