import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Card, Grid, H1, H2, LevelPicker, PartnerName, ProgressBar, Row, Screen, T, Tile } from "../../components/ui";
import { LEVELS, levelIndex, type LevelId } from "../../content/levels";
import { partnerColor, usePalette } from "../../lib/theme";
import {
  examReady,
  EXAM_PASS,
  isLocked,
  knownInUnit,
  levelProgress,
  subLevelProgress,
  unitPassed,
  useProgress,
} from "../../state/progress";

export default function Learn() {
  const c = usePalette();
  const { state } = useProgress();
  const i = state.learner;
  const p = state.partners[i];
  // Each partner keeps their own selected level; default is their current level.
  const [selected, setSelected] = useState<[LevelId | null, LevelId | null]>([null, null]);
  const levelId = selected[i] ?? LEVELS[p.unlocked].id;
  const setLevelId = (id: LevelId) => setSelected((s) => (i === 0 ? [id, s[1]] : [s[0], id]));

  const level = LEVELS[levelIndex(levelId)];
  const locked = isLocked(p, level);
  const prog = levelProgress(p, level);
  const passedExam = p.examsPassed.includes(level.id);
  const ready = examReady(p, level);
  const openExam = () => router.push({ pathname: "/exam/[levelId]", params: { levelId: level.id } });

  return (
    <Screen>
      <H1>Learn 📚</H1>
      <T muted>
        Studying as <PartnerName i={i} /> — switch at the top right.
      </T>

      <LevelPicker value={levelId} unlocked={p.unlocked} onChange={setLevelId} />

      <Card>
        <Row>
          <T style={{ fontWeight: "800", fontSize: 17 }}>
            {level.id} · {level.name}
          </T>
          {passedExam ? <Text>🎓</Text> : null}
        </Row>
        <T muted>{level.blurb}</T>
        <ProgressBar value={prog.share} color={partnerColor(c, i)} />
        <T muted style={{ fontSize: 13 }}>
          {prog.passed} of {prog.total} unit tests passed
        </T>
      </Card>

      {locked ? (
        <Card>
          <T style={{ fontWeight: "700" }}>🔒 {level.id} is locked</T>
          <T muted style={{ marginVertical: 8 }}>
            Pass the {LEVELS[levelIndex(level.id) - 1].id} exam to unlock it — or, if you already know this level, test out
            by passing the {level.id} exam now.
          </T>
          <Button title={`Test out: take the ${level.id} exam`} variant="secondary" onPress={openExam} />
        </Card>
      ) : null}

      {level.subLevels.map((sub) => {
        const sp = subLevelProgress(p, sub);
        return (
          <View key={sub.id}>
            <H2>
              {sub.id} · {sub.title} {sp.done ? "✓" : ""}
            </H2>
            <T muted style={{ fontSize: 13, marginTop: -4, marginBottom: 8 }}>
              {sp.passed} / {sp.total} units passed
            </T>
            <Grid>
              {sub.units.map((u) => (
                <Tile
                  key={u.id}
                  emoji={unitPassed(p, u.id) ? "⭐" : u.emoji}
                  title={u.title}
                  locked={locked}
                  subtitle={
                    unitPassed(p, u.id)
                      ? `Passed · best ${Math.round((p.unitScores[u.id] ?? 0) * 100)}%`
                      : `${knownInUnit(p, u.id)} / ${u.words.length} words known`
                  }
                  onPress={() => {
                    if (!locked) router.push({ pathname: "/unit/[topicId]", params: { topicId: u.id } });
                  }}
                />
              ))}
            </Grid>
          </View>
        );
      })}

      {!locked ? (
        <>
          <H2>🎓 {level.id} exam</H2>
          <Card>
            {passedExam ? (
              <T>
                Bestanden! You passed the {level.id} exam
                {levelIndex(level.id) < LEVELS.length - 1 ? ` and unlocked ${LEVELS[levelIndex(level.id) + 1].id}.` : " — that's mastery!"}
              </T>
            ) : (
              <T muted>
                {ready
                  ? `All units passed — you're ready! Score ${Math.round(EXAM_PASS * 100)}% to pass.`
                  : `Pass all ${prog.total} unit tests to unlock the exam (${prog.passed}/${prog.total}).`}
              </T>
            )}
            <Button
              title={passedExam ? "Retake exam" : "Take the exam"}
              variant={passedExam ? "secondary" : "primary"}
              disabled={!ready && !passedExam}
              onPress={openExam}
              style={{ marginTop: 10 }}
            />
          </Card>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/placement")}
        style={{ alignSelf: "center", marginTop: 16, padding: 8 }}
      >
        <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Not sure of your level? Take the placement test</T>
      </Pressable>
    </Screen>
  );
}
