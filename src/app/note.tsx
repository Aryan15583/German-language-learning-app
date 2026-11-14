import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Share, Text, View } from "react-native";
import { Button, Card, Chip, H1, H2, PartnerName, Row, Screen, SpeakButton, T } from "../components/ui";
import { meaning, NOTE_PARTS } from "../content/levels";
import { usePalette } from "../lib/theme";
import { router } from "expo-router";
import { shareText } from "../lib/share";
import { couple, useProgress, XP } from "../state/progress";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Notes() {
  const c = usePalette();
  const { state, practiced, send: sendToPartner } = useProgress();
  const linked = couple.isLinked(state);
  const from = state.learner;
  const to = from === 0 ? 1 : 0;
  const [opener, setOpener] = useState(0);
  const [middles, setMiddles] = useState<number[]>([0]);
  const [closer, setCloser] = useState(1);
  const [status, setStatus] = useState("");

  const signature = closer === 3 ? `\n${state.partners[from].name}` : "";
  const text =
    `${NOTE_PARTS.openers[opener]}\n` +
    `${[...middles].sort((x, y) => x - y).map((i) => cap(NOTE_PARTS.middles[i].de)).join(" ")}\n` +
    `${NOTE_PARTS.closers[closer]}${signature}`;

  const toggle = (i: number) =>
    setMiddles((m) => (m.includes(i) ? (m.length > 1 ? m.filter((x) => x !== i) : m) : [...m, i]));

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    practiced(from, 5);
    setStatus("Copied! Paste it into your chat 💬");
  };

  const send = async () => {
    if (linked) {
      const r = await sendToPartner({ kind: "note", text });
      practiced(from, XP.note);
      if (r.delivered) {
        setStatus("Sent to your partner's app 💌");
        setTimeout(() => router.back(), 900);
      } else {
        await shareText(`💌 Zwei Herzen ♡ — a love note for you:\n${r.link}`);
        setStatus("Shared as a secure link 💌");
      }
      return;
    }
    try {
      const res = await Share.share({ message: text });
      if (res.action === Share.sharedAction) {
        practiced(from, 5);
        setStatus("Sent 💌");
      }
    } catch {
      await copy(); // e.g. web browsers without a share sheet
    }
  };

  return (
    <Screen>
      <H1>Love note 💌</H1>
      <T muted>
        From <PartnerName i={from} /> to <PartnerName i={to} />. Build it, then send it by text!
      </T>

      <H2>Start</H2>
      <Row>
        {NOTE_PARTS.openers.map((o, i) => (
          <Chip key={o} label={o} selected={i === opener} onPress={() => setOpener(i)} />
        ))}
      </Row>

      <H2>Say something sweet</H2>
      <Row>
        {NOTE_PARTS.middles.map((m, i) => (
          <Chip key={m.de} label={meaning(m, state.partners[from].lang)} selected={middles.includes(i)} onPress={() => toggle(i)} />
        ))}
      </Row>

      <H2>End</H2>
      <Row>
        {NOTE_PARTS.closers.map((x, i) => (
          <Chip key={x} label={x} selected={i === closer} onPress={() => setCloser(i)} />
        ))}
      </Row>

      <H2>Preview</H2>
      <Card>
        <Text style={{ color: c.text, fontSize: 18, lineHeight: 27, fontFamily: "serif" }}>{text}</Text>
      </Card>
      <Row>
        <SpeakButton text={text} />
        <View style={{ flex: 1 }} />
        <Button title="Copy" variant="secondary" onPress={copy} />
        <Button title={linked ? `Send to ${state.partners[1].name || "partner"} 💌` : "Send 💌"} onPress={send} />
      </Row>
      {status ? <T muted style={{ marginTop: 10, textAlign: "center" }}>{status}</T> : null}
    </Screen>
  );
}
