import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Button, Card, Script, Spinner } from "../components/ui";
import { couple, useProgress, type OpenResult } from "../web/progress";
import { takeFragment } from "../web/share";

/** Opens a secure message link (used when in-app delivery isn't set up). */
export default function Inbox() {
  const { openLink, state } = useProgress();
  const [result, setResult] = useState<OpenResult | "empty" | null>(null);

  useEffect(() => {
    // Read once, then wipe the secret part from the address bar and history.
    const fragment = takeFragment();
    Promise.resolve().then(() => setResult(fragment ? openLink(fragment) : "empty"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- open once

  if (!result) return <Spinner />;
  if (result === "empty" || !result.ok) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md text-center">
          <p className="mt-6 text-6xl">🔒</p>
          <Script className="mt-2 text-4xl">This link can’t be opened</Script>
          <p className="mt-2 text-muted">{result === "empty" ? "The link is incomplete. Ask your partner to send it again." : result.error}</p>
          <Button href="/us" className="mt-5">
            Go to Us
          </Button>
        </div>
      </AppShell>
    );
  }
  const { env, isNew } = result;
  const duel = env.kind === "duel" ? state.remoteDuels.find((d) => d.id === env.duel.id) : undefined;
  const yourTurn = duel && couple.duelStatus(duel) === "your-turn";
  const what = {
    hello: "linked your phones 💞",
    offer: "made a partner code 💞",
    join: "linked your phones 💞",
    stats: "shared their progress 📈",
    viewed: "saw your disappearing messages 👁",
    react: "reacted to your message ❤️",
    edit: "edited a message ✏️",
    unsend: "deleted a message 🗑",
    clear: "cleared the chat 🧹",
    read: "read your messages ✓✓",
    msg: "sent you a message 💬",
    note: "sent you a love note 💌",
    secret: "sent you a secret 🔒",
    word: "shared a new word 📖",
    duel: yourTurn ? "challenged you to a duel ⚔️" : "played their duel turn ⚔️",
  }[env.kind];
  return (
    <AppShell>
      <div className="mx-auto max-w-md text-center">
        <p className="mt-6 text-6xl">💞</p>
        <Script className="mt-2 text-4xl">
          {env.from.name} {what}
        </Script>
        <Card className="mt-4">
          <p className="text-muted">{isNew ? "Added to your app." : "You’ve already opened this one."}</p>
        </Card>
        {yourTurn ? (
          <Button size="lg" full className="mt-5" href={`/remote-duel?id=${env.kind === "duel" ? env.duel.id : ""}`}>
            Play your turn
          </Button>
        ) : (
          <Button size="lg" full className="mt-5" href="/messages">
            Open chat
          </Button>
        )}
      </div>
    </AppShell>
  );
}
