import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Card, Grid, H1, H2, LevelPicker, PartnerName, Row, Screen, T, Tile } from "../../components/ui";
import { LEVELS, type LevelId } from "../../content/levels";
import { usePalette } from "../../lib/theme";
import { useProgress } from "../../state/progress";

export default function DuelHome() {
  const c = usePalette();
  const { state } = useProgress();
  // Default to the level you both have unlocked, so it's fair.
  const [levelId, setLevelId] = useState<LevelId>(
    LEVELS[Math.min(state.partners[0].unlocked, state.partners[1].unlocked)].id,
  );
  const level = LEVELS.find((l) => l.id === levelId)!;
  const recent = state.duels.slice(-3).reverse();
  const start = (topicId: string) => router.push({ pathname: "/duel/[topicId]", params: { topicId } });

  return (
    <Screen>
      <H1>Quiz duel ⚔️</H1>
      <T muted>
        <PartnerName i={0} /> plays first, then hands the phone to <PartnerName i={1} />. Same questions — who knows more?
      </T>

      <LevelPicker value={levelId} unlocked={LEVELS.length} onChange={setLevelId} />
      <T muted style={{ fontSize: 13, marginBottom: 12 }}>
        {level.id} · {level.name}
      </T>

      <Grid>
        {level.topics.map((t) => (
          <Tile key={t.id} emoji={t.emoji} title={t.title} onPress={() => start(t.id)} />
        ))}
        <Tile emoji="🎲" title={`Mix of ${level.id}`} subtitle="All topics" onPress={() => start(`mix-${level.id}`)} />
      </Grid>

      {recent.length ? (
        <>
          <H2>Recent duels</H2>
          {recent.map((d, k) => (
            <Card key={k}>
              <Row>
                <T style={{ flex: 1 }}>{d.title}</T>
                <Text style={{ color: c.a, fontWeight: "800" }}>{d.scores[0]}</Text>
                <T muted>:</T>
                <Text style={{ color: c.b, fontWeight: "800" }}>{d.scores[1]}</Text>
              </Row>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
