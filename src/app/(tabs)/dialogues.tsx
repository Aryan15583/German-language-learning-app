import { Fragment } from "react";
import { router } from "expo-router";
import { Grid, H1, H2, PartnerName, Screen, T, Tile } from "../../components/ui";
import { DIALOGUES, LEVELS } from "../../content/levels";

export default function Dialogues() {
  return (
    <Screen>
      <H1>Role-play 🎭</H1>
      <T muted>
        Read a scene out loud together. <PartnerName i={0} /> plays A, <PartnerName i={1} /> plays B.
      </T>
      {LEVELS.map((level) => {
        const list = DIALOGUES.filter((d) => d.level === level.id);
        if (!list.length) return null;
        return (
          <Fragment key={level.id}>
            <H2>
              {level.id} · {level.name}
            </H2>
            <Grid>
              {list.map((d) => (
                <Tile
                  key={d.id}
                  emoji={d.emoji}
                  title={d.title}
                  subtitle={`${d.lines.length} lines`}
                  onPress={() => router.push({ pathname: "/dialogue/[id]", params: { id: d.id } })}
                />
              ))}
            </Grid>
          </Fragment>
        );
      })}
    </Screen>
  );
}
