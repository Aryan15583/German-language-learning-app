import { router } from "expo-router";
import { Fragment } from "react";
import { Grid, H1, H2, PartnerName, Screen, T, Tile } from "../../components/ui";
import { CHATS } from "../../content/chats";
import { DIALOGUES, LANGS, LEVELS } from "../../content/levels";
import { useProgress } from "../../state/progress";

export default function Talk() {
  const { state } = useProgress();
  const p = state.partners[state.learner];

  return (
    <Screen>
      <H1>Talk 💬</H1>
      <T muted>
        Learn to hold a conversation. Chats are for <PartnerName i={state.learner} /> alone; role-plays are for both of you.
      </T>

      <H2>Chat practice</H2>
      <T muted style={{ fontSize: 13, marginTop: -4, marginBottom: 8 }}>
        Reply to a character in German: pick a suggestion or type your own. Mistakes get explained in{" "}
        {LANGS.find((l) => l.id === p.lang)!.label}.
      </T>
      <Grid>
        {CHATS.map((chat) => {
          const stars = p.chatStars[chat.id] ?? 0;
          return (
            <Tile
              key={chat.id}
              emoji={chat.emoji}
              title={chat.title}
              subtitle={`${chat.level} · ${stars ? "⭐".repeat(stars) : "new"}`}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: chat.id } })}
            />
          );
        })}
      </Grid>

      <H2>Role-play together 🎭</H2>
      <T muted style={{ fontSize: 13, marginTop: -4, marginBottom: 8 }}>
        Read a scene out loud. <PartnerName i={0} /> plays A, <PartnerName i={1} /> plays B.
      </T>
      {LEVELS.map((level) => {
        const list = DIALOGUES.filter((d) => d.level === level.id);
        if (!list.length) return null;
        return (
          <Fragment key={level.id}>
            <T muted style={{ fontWeight: "700", marginTop: 10, marginBottom: 6 }}>
              {level.id} · {level.name}
            </T>
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
