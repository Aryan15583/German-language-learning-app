import { router } from "expo-router";
import { useState } from "react";
import { Button, Card, Grid, H1, LevelPicker, PartnerName, ProgressBar, Screen, T, Tile } from "../../components/ui";
import { LEVELS, UNLOCK_SHARE, type LevelId } from "../../content/levels";
import { partnerColor, usePalette } from "../../lib/theme";
import { knownInTopic, levelProgress, useProgress } from "../../state/progress";

export default function Learn() {
  const c = usePalette();
  const { state, unlockLevel } = useProgress();
  const i = state.learner;
  const p = state.partners[i];
  // Each partner keeps their own selected level; default is their current level.
  const [selected, setSelected] = useState<[LevelId | null, LevelId | null]>([null, null]);
  const levelId = selected[i] ?? LEVELS[p.unlocked].id;
  const setLevelId = (id: LevelId) => setSelected((s) => (i === 0 ? [id, s[1]] : [s[0], id]));

  const idx = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[idx];
  const locked = idx > p.unlocked;
  const prog = levelProgress(p, level.id);
  const prev = LEVELS[idx - 1];

  return (
    <Screen>
      <H1>Learn 📚</H1>
      <T muted>
        Studying as <PartnerName i={i} /> — switch at the top right.
      </T>

      <LevelPicker value={levelId} unlocked={p.unlocked} onChange={setLevelId} />

      <Card>
        <T style={{ fontWeight: "800", fontSize: 17 }}>
          {level.id} · {level.name}
        </T>
        <T muted>{level.blurb}</T>
        <ProgressBar value={prog.share} color={partnerColor(c, i)} />
        <T muted style={{ fontSize: 13 }}>
          {prog.known} of {prog.total} words mastered
          {idx < LEVELS.length - 1 && !locked
            ? ` · ${Math.max(0, Math.ceil(prog.total * UNLOCK_SHARE) - prog.known)} more to unlock ${LEVELS[idx + 1].id}`
            : ""}
        </T>
      </Card>

      {locked ? (
        <Card>
          <T style={{ fontWeight: "700" }}>🔒 {level.id} is locked</T>
          <T muted style={{ marginVertical: 8 }}>
            Master {Math.round(UNLOCK_SHARE * 100)}% of {prev.id} to unlock it — or skip ahead if you already know this level.
          </T>
          <Button title={`I'm ready — unlock ${level.id}`} variant="secondary" onPress={() => unlockLevel(i, idx)} />
        </Card>
      ) : (
        <Grid>
          {level.topics.map((t) => (
            <Tile
              key={t.id}
              emoji={t.emoji}
              title={t.title}
              subtitle={`${knownInTopic(p, t.id)} / ${t.words.length} known`}
              onPress={() => router.push({ pathname: "/lesson/[topicId]", params: { topicId: t.id } })}
            />
          ))}
        </Grid>
      )}
    </Screen>
  );
}
