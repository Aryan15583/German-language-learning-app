import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Button, Card, H1, Screen, T } from "../components/ui";
import { takeFragment } from "../lib/share";
import { couple, useProgress, type OpenResult } from "../state/progress";

/** Opens a secure message link (used when in-app delivery isn’t set up). */
export default function Inbox() {
  const { openLink, state } = useProgress();
  const [result, setResult] = useState<OpenResult | "empty" | null>(null);

  useEffect(() => {
    // Read once, then wipe the secret part from the address bar and history.
    const fragment = takeFragment();
    Promise.resolve().then(() => setResult(fragment ? openLink(fragment) : "empty"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return null;

  if (result === "empty" || !result.ok) {
    return (
      <Screen>
        <Text style={{ fontSize: 48, textAlign: "center", marginTop: 20 }}>🔒</Text>
        <H1>This link can’t be opened</H1>
        <T muted>{result === "empty" ? "The link is incomplete. Ask your partner to send it again." : result.error}</T>
        <Button title="Go to Us" onPress={() => router.replace("/us")} style={{ marginTop: 16 }} />
      </Screen>
    );
  }

  const { env, isNew } = result;
  const duel = env.kind === "duel" ? state.remoteDuels.find((d) => d.id === env.duel.id) : undefined;
  const yourTurn = duel && couple.duelStatus(duel) === "your-turn";
  const what = {
    hello: "linked your phones 💞",
    stats: "shared their progress 📈",
    msg: "sent you a message 💬",
    note: "sent you a love note 💌",
    secret: "sent you a secret 🔒",
    word: "shared a new word 📖",
    duel: yourTurn ? "challenged you to a duel ⚔️" : "played their duel turn ⚔️",
  }[env.kind];

  return (
    <Screen>
      <Text style={{ fontSize: 52, textAlign: "center", marginTop: 20 }}>💞</Text>
      <H1>
        {env.from.name} {what}
      </H1>
      <Card>
        <T muted>{isNew ? "Added to your app." : "You’ve already opened this one."}</T>
      </Card>
      {yourTurn ? (
        <Button title="Play your turn" onPress={() => router.replace({ pathname: "/remote-duel", params: { id: env.kind === "duel" ? env.duel.id : "" } })} />
      ) : (
        <Button title="Open chat" onPress={() => router.replace("/us")} />
      )}
    </Screen>
  );
}
