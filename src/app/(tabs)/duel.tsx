import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Button, Card, Chip, Grid, H1, H2, LevelPicker, PartnerName, Row, Screen, T, Tile } from "../../components/ui";
import { resolveTopic } from "../../lib/topics";
import { LEVELS, type LevelId } from "../../content/levels";
import { usePalette } from "../../lib/theme";
import { couple, partnerName, useProgress } from "../../state/progress";

export default function DuelHome() {
  const c = usePalette();
  const { state } = useProgress();
  // Default to the level you both have unlocked, so it's fair.
  const [levelId, setLevelId] = useState<LevelId>(
    LEVELS[Math.min(state.partners[0].unlocked, state.partners[1].unlocked)].id,
  );
  const level = LEVELS.find((l) => l.id === levelId)!;
  const recent = state.duels.slice(-3).reverse();
  const linked = couple.isLinked(state);
  const [mode, setMode] = useState<"remote" | "local">(linked ? "remote" : "local");
  const remote = linked && mode === "remote";
  const start = (topicId: string) =>
    remote
      ? router.push({ pathname: "/remote-duel", params: { topic: topicId } })
      : router.push({ pathname: "/duel/[topicId]", params: { topicId } });
  const remoteDuels = [...state.remoteDuels].reverse().slice(0, 8);

  return (
    <Screen>
      <H1>Quiz duel ⚔️</H1>
      {linked ? (
        <Row style={{ marginBottom: 8 }}>
          <Chip label="🌍 Remote" selected={remote} onPress={() => setMode("remote")} />
          <Chip label="📱 Same phone" selected={!remote} onPress={() => setMode("local")} />
        </Row>
      ) : null}
      {remote ? (
        <T muted>
          Play a round here; {partnerName(state, 1)} gets the exact same questions on their phone, wherever they are. Highest score wins!
        </T>
      ) : (
        <T muted>
          <PartnerName i={0} /> plays first, then hands the phone to <PartnerName i={1} />. Same questions — who knows more?
        </T>
      )}

      {remote && remoteDuels.length ? (
        <>
          <H2>🌍 Your remote duels</H2>
          {remoteDuels.map((d) => {
            const status = couple.duelStatus(d);
            return (
              <Card key={d.id}>
                <Row>
                  <T style={{ flex: 1, fontWeight: "700" }}>{resolveTopic(d.topic)?.title ?? d.topic}</T>
                  <Text style={{ color: c.a, fontWeight: "800" }}>{d.scores[0] ?? "–"}</Text>
                  <T muted>:</T>
                  <Text style={{ color: c.b, fontWeight: "800" }}>{d.scores[1] ?? "–"}</Text>
                </Row>
                <T muted style={{ fontSize: 13 }}>
                  {{ "your-turn": "Your turn!", "their-turn": `Waiting for ${partnerName(state, 1)}…`, won: "You won 🏆", lost: "They won 💪", tie: "Tie 🤝" }[status]}
                </T>
                {status === "your-turn" ? (
                  <Button title="Play now" onPress={() => router.push({ pathname: "/remote-duel", params: { id: d.id } })} style={{ marginTop: 6 }} />
                ) : null}
              </Card>
            );
          })}
          <H2>Start a new one</H2>
        </>
      ) : null}

      <LevelPicker value={levelId} unlocked={LEVELS.length} onChange={setLevelId} />
      <T muted style={{ fontSize: 13, marginBottom: 12 }}>
        {level.id} · {level.name}
      </T>

      <Grid>
        {level.subLevels.flatMap((sub) =>
          sub.units.map((t) => <Tile key={t.id} emoji={t.emoji} title={t.title} subtitle={sub.id} onPress={() => start(t.id)} />),
        )}
        <Tile emoji="🎲" title={`Mix of ${level.id}`} subtitle="All units" onPress={() => start(`mix-${level.id}`)} />
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
