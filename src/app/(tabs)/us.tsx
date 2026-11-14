import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, H1, H2, Row, Screen, SpeakButton, T } from "../../components/ui";
import { findTopic } from "../../content/levels";
import { heartLevel, isoWeek, weeklyLeader } from "../../lib/game";
import { CODE_TTL_MS, formatCode } from "../../lib/link";
import { appBaseUrl, shareText } from "../../lib/share";
import { partnerColor, partnerSoft, usePalette } from "../../lib/theme";
import { couple, currentStreak, partnerName, today, useProgress, type ChatItem, type SendResult } from "../../state/progress";

const QUICK = ["Guten Morgen, Schatz! ☀️", "Ich vermisse dich 💞", "Ich liebe dich", "Schlaf gut! 🌙", "Ich bin stolz auf dich", "Du fehlst mir"];

export default function Us() {
  const { state } = useProgress();
  if (!state.couple) return <LinkSetup />;
  if (state.couple.status === "invited") return <WaitingForPartner />;
  return <CoupleChat />;
}

/** Fallback when the message couldn’t go in-app: offer to share it as a link. */
function useFallback() {
  const [pending, setPending] = useState<{ link: string; error?: string } | null>(null);
  const [note, setNote] = useState("");
  const handle = (r: SendResult) => {
    if (r.delivered) setPending(null);
    else setPending({ link: r.link, error: r.error });
  };
  const view = pending ? (
    <Card>
      <T style={{ fontWeight: "700" }}>{pending.error ? `⚠️ ${pending.error}` : "📨 Send it to your partner"}</T>
      <T muted style={{ marginVertical: 6, fontSize: 13 }}>
        {pending.error ? "Share it as a secure link instead:" : "In-app delivery isn’t set up yet, so share this secure link with your partner:"}
      </T>
      <Row>
        <Button
          title="Share link"
          onPress={async () => {
            const r = await shareText(`💌 Zwei Herzen ♡ — open this to read it:\n${pending.link}`);
            setNote(r === "copied" ? "Link copied — paste it to your partner." : "");
            if (r !== "cancelled") setPending(null);
          }}
        />
        <Button title="Later" variant="secondary" onPress={() => setPending(null)} />
      </Row>
    </Card>
  ) : note ? (
    <T muted style={{ textAlign: "center", marginBottom: 8 }}>{note}</T>
  ) : null;
  return { handle, view };
}

function LinkSetup() {
  const c = usePalette();
  const { state, createCode, joinCode, relayOn } = useProgress();
  const [busy, setBusy] = useState<"" | "create" | "join">("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const fallback = useFallback();

  return (
    <Screen>
      <H1>Us 💞</H1>
      <T muted>Link your phones to chat, duel and see each other’s progress — from anywhere in the world.</T>

      <Card style={{ marginTop: 14, backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
        <T style={{ fontWeight: "800", fontSize: 16 }}>1 · Get your code</T>
        <T muted style={{ marginVertical: 6 }}>Make a 6-character code and tell it to your partner.</T>
        {busy === "create" ? (
          <ActivityIndicator color={c.accent} />
        ) : (
          <Button
            title="✨ Get my partner code"
            onPress={async () => {
              setBusy("create");
              await createCode();
              setBusy("");
            }}
          />
        )}
      </Card>

      <T muted style={{ textAlign: "center", marginVertical: 6 }}>— or —</T>

      <Card>
        <T style={{ fontWeight: "800", fontSize: 16 }}>2 · Enter your partner’s code</T>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase());
            setError("");
          }}
          placeholder="K7M-2QX"
          placeholderTextColor={c.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          accessibilityLabel="Partner code"
          style={{
            borderWidth: 1,
            borderColor: error ? c.bad : c.border,
            backgroundColor: c.bg,
            color: c.text,
            borderRadius: 12,
            padding: 14,
            fontSize: 24,
            letterSpacing: 6,
            textAlign: "center",
            fontWeight: "800",
            marginVertical: 10,
          }}
        />
        {error ? <Text style={{ color: c.bad, marginBottom: 8 }}>{error}</Text> : null}
        {busy === "join" ? (
          <ActivityIndicator color={c.accent} />
        ) : (
          <Button
            title="💞 Link with my partner"
            disabled={code.replace(/[\s-]/g, "").length !== 6}
            onPress={async () => {
              setBusy("join");
              const r = await joinCode(code);
              setBusy("");
              if (!r.ok) setError(r.error);
              else fallback.handle(r.result);
            }}
          />
        )}
      </Card>
      {fallback.view}

      <T muted style={{ fontSize: 12, textAlign: "center", marginTop: 12 }}>
        🔒 End-to-end encrypted. {relayOn ? "Messages arrive inside the app; the mailbox only ever sees scrambled data." : "Messages travel as secure links you send each other."}
        {state.partners[0].name ? "" : " Set your name on Home first."}
      </T>
    </Screen>
  );
}

function WaitingForPartner() {
  const c = usePalette();
  const { state, unlink, relayOn } = useProgress();
  const cpl = state.couple!;
  const [now] = useState(() => Date.now());
  const expired = couple.codeExpired(cpl.since, now);
  const hoursLeft = Math.max(0, Math.ceil((cpl.since + CODE_TTL_MS - now) / 3600e3));
  const [note, setNote] = useState("");

  return (
    <Screen>
      <H1>Your partner code</H1>
      <Card style={{ alignItems: "center", marginTop: 12, paddingVertical: 24 }}>
        <Text accessibilityLabel={`Code ${cpl.code}`} style={{ fontSize: 40, fontWeight: "900", letterSpacing: 6, color: c.accent }}>
          {cpl.code ? formatCode(cpl.code) : "——"}
        </Text>
        <T muted style={{ marginTop: 6 }}>{expired ? "This code expired." : `Valid for ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"}`}</T>
      </Card>
      {expired ? (
        <Button title="Make a new code" onPress={unlink} />
      ) : (
        <>
          <T style={{ textAlign: "center", marginBottom: 12 }}>
            Tell your partner this code. They open the app → <Text style={{ fontWeight: "800" }}>Us</Text> → enter the code.
          </T>
          <Button
            title="Share the code"
            onPress={async () => {
              const r = await shareText(`💞 Let’s link our Zwei Herzen ♡ app!\nMy code: ${formatCode(cpl.code ?? "")}\n${appBaseUrl()}`);
              setNote(r === "copied" ? "Copied — paste it to your partner." : "");
            }}
          />
          {note ? <T muted style={{ textAlign: "center", marginTop: 6 }}>{note}</T> : null}
          <Row style={{ justifyContent: "center", marginTop: 16 }}>
            {relayOn ? <ActivityIndicator color={c.accent} /> : null}
            <T muted>{relayOn ? "Waiting for your partner… this links automatically." : "When your partner sends you their hello link, open it."}</T>
          </Row>
        </>
      )}
      <Pressable accessibilityRole="button" onPress={unlink} style={{ alignSelf: "center", marginTop: 24, padding: 8 }}>
        <T muted style={{ textDecorationLine: "underline", fontSize: 13 }}>Cancel</T>
      </Pressable>
    </Screen>
  );
}

function CoupleChat() {
  const c = usePalette();
  const { state, send, resendHello, relayOn, syncStatus, syncNow, unlink } = useProgress();
  const [text, setText] = useState("");
  const [secret, setSecret] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const fallback = useFallback();
  const me = state.partners[0];
  const them = state.partners[1];
  const myStreak = currentStreak(state);
  const week = isoWeek(today());
  const mineWeek = me.week.id === week ? me.week.xp : 0;
  const theirWeek = them.week.id === week ? them.week.xp : 0;
  const leader = weeklyLeader(mineWeek, theirWeek);
  const waitingForConfirm = state.couple!.role === "joiner" && !them.remote;

  const submit = async (body = text) => {
    const t = body.trim();
    if (!t || sending) return;
    setSending(true);
    const r = await send(secret ? { kind: "secret", text: t, unlockAt: 7 } : { kind: "msg", text: t });
    setSending(false);
    setText("");
    setSecret(false);
    fallback.handle(r);
  };

  return (
    <Screen>
      <Card style={{ backgroundColor: partnerSoft(c, 1), borderColor: partnerSoft(c, 1) }}>
        <Row>
          <Text style={{ fontSize: 30 }}>💞</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: partnerColor(c, 1), fontWeight: "900", fontSize: 18 }}>{partnerName(state, 1)}</Text>
            <T muted style={{ fontSize: 12 }}>
              ❤️ Lv {heartLevel(them.xp).level} {heartLevel(them.xp).title} · 🔥 {them.remote?.streak ?? 0} days
            </T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Check for new messages" onPress={syncNow} hitSlop={8}>
            <T muted style={{ fontSize: 12 }}>
              {syncStatus === "ok" ? "🟢 live" : syncStatus === "offline" ? "🟠 offline" : "🔗 links"}
            </T>
          </Pressable>
        </Row>
      </Card>

      {waitingForConfirm ? (
        <Card>
          <T style={{ fontWeight: "700" }}>Almost there 💫</T>
          <T muted style={{ marginVertical: 6, fontSize: 13 }}>
            {relayOn
              ? "Your hello is on its way. You’re linked as soon as your partner’s app picks it up."
              : "Send your hello link so your partner’s phone links too."}
          </T>
          {!relayOn ? (
            <Button
              title="Send hello link"
              onPress={async () => {
                const r = await resendHello();
                if (r) fallback.handle(r);
              }}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        <T style={{ fontWeight: "800" }}>⚔️ This week</T>
        <Row style={{ marginTop: 6 }}>
          <Text style={{ color: partnerColor(c, 0), fontWeight: "900", fontSize: 22 }}>{mineWeek}</Text>
          <T muted>XP vs</T>
          <Text style={{ color: partnerColor(c, 1), fontWeight: "900", fontSize: 22 }}>{theirWeek}</Text>
          <View style={{ flex: 1 }} />
          <T style={{ fontSize: 13 }}>
            {leader === "tie" ? "Gleichstand 🤝" : leader === "me" ? "You’re ahead 👑" : `${partnerName(state, 1)} leads 🔥`}
          </T>
        </Row>
      </Card>

      <H2>Chat</H2>
      {state.chat.length === 0 ? <T muted>Say hallo! Every message also shares your progress for the weekly battle.</T> : null}
      {state.chat.map((m) => (
        <ChatRow key={m.id + m.from} m={m} myStreak={myStreak} />
      ))}
      {fallback.view}

      <Row style={{ marginTop: 10 }}>
        {QUICK.map((q) => (
          <Chip key={q} label={q} onPress={() => setText(q)} />
        ))}
      </Row>
      <Row style={{ marginTop: 8, flexWrap: "nowrap" }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={secret ? "🔒 A secret (opens at their 7-day streak)…" : "Auf Deutsch, bitte… 💬"}
          placeholderTextColor={c.muted}
          multiline
          maxLength={1000}
          accessibilityLabel="Message"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: secret ? c.accent : c.border,
            borderRadius: 14,
            padding: 12,
            color: c.text,
            backgroundColor: c.surface,
            fontSize: 15,
            maxHeight: 120,
          }}
        />
        {sending ? <ActivityIndicator color={c.accent} /> : <Button title="Send" onPress={() => submit()} disabled={!text.trim()} />}
      </Row>
      <Row style={{ marginTop: 8 }}>
        <Chip label="🔒 Secret" selected={secret} onPress={() => setSecret(!secret)} />
        <Chip label="💌 Love note" onPress={() => router.push("/note")} />
        <Chip label="📖 Our words" onPress={() => router.push("/words")} />
        <Chip label="⚔️ Remote duel" onPress={() => router.navigate("/duel")} />
      </Row>

      <Pressable accessibilityRole="button" onPress={() => setConfirmUnlink(true)} style={{ alignSelf: "center", marginTop: 28, padding: 8 }}>
        <T muted style={{ textDecorationLine: "underline", fontSize: 12 }}>Unlink phones</T>
      </Pressable>
      {confirmUnlink ? (
        <Card>
          <T muted style={{ fontSize: 13 }}>Unlinking keeps your chat history on this phone, but you’ll need a new code to link again.</T>
          <Row style={{ marginTop: 8 }}>
            <Button title="Unlink" variant="secondary" onPress={unlink} />
            <Button title="Keep linked" onPress={() => setConfirmUnlink(false)} />
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}

function ChatRow({ m, myStreak }: { m: ChatItem; myStreak: number }) {
  const c = usePalette();
  const { state } = useProgress();

  if (m.kind === "system") {
    return <T muted style={{ textAlign: "center", fontSize: 12, marginVertical: 6 }}>{m.text}</T>;
  }

  const mine = m.from === 0;
  const bubble = {
    maxWidth: "86%" as const,
    alignSelf: mine ? ("flex-end" as const) : ("flex-start" as const),
    backgroundColor: partnerSoft(c, m.from),
    borderRadius: 16,
    borderBottomRightRadius: mine ? 4 : 16,
    borderBottomLeftRadius: mine ? 16 : 4,
    padding: 12,
    marginVertical: 4,
  };
  const time = new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (m.kind === "duel") {
    const d = state.remoteDuels.find((x) => x.id === m.duelId);
    const status = d ? couple.duelStatus(d) : "their-turn";
    const topic = d ? (d.topic.startsWith("mix-") ? `${d.topic.slice(4)} mix` : findTopic(d.topic)?.title ?? d.topic) : "Duel";
    const label = {
      "your-turn": "Your turn! ⚔️",
      "their-turn": `Waiting for ${partnerName(state, 1)}…`,
      won: "You won 🏆",
      lost: `${partnerName(state, 1)} won 💪`,
      tie: "Tie 🤝",
    }[status];
    return (
      <View style={bubble}>
        <T style={{ fontWeight: "800" }}>⚔️ Remote duel · {topic}</T>
        {d && d.scores[0] !== null && d.scores[1] !== null ? (
          <T>
            {d.scores[0]} : {d.scores[1]}
          </T>
        ) : null}
        <T muted style={{ fontSize: 13 }}>{label}</T>
        {status === "your-turn" ? (
          <Button title="Play now" onPress={() => router.push({ pathname: "/remote-duel", params: { id: m.duelId } })} style={{ marginTop: 6 }} />
        ) : null}
      </View>
    );
  }

  if (m.kind === "secret" && !couple.secretOpen(m, myStreak)) {
    return (
      <View style={[bubble, { borderWidth: 1, borderColor: c.accent, borderStyle: "dashed" }]}>
        <T style={{ fontWeight: "800" }}>🔒 A secret from {partnerName(state, 1)}</T>
        <T muted style={{ fontSize: 13 }}>
          Opens at a {m.unlockAt}-day streak · you’re at {myStreak} 🔥
        </T>
      </View>
    );
  }

  return (
    <View style={bubble}>
      {m.kind === "secret" ? <T style={{ fontSize: 12, fontWeight: "800", color: c.accent }}>✨ Secret{mine ? " (sent)" : " unlocked"}</T> : null}
      {m.kind === "note" ? <T style={{ fontSize: 12, fontWeight: "800", color: c.accent }}>💌 Love note</T> : null}
      {m.kind === "word" ? <T style={{ fontSize: 12, fontWeight: "800", color: c.accent }}>📖 New shared word</T> : null}
      <Row style={{ flexWrap: "nowrap" }}>
        <Text style={{ color: c.text, fontSize: 16, flexShrink: 1, fontFamily: m.kind === "note" ? "serif" : undefined }}>{m.text}</Text>
        {m.kind !== "word" ? <SpeakButton text={m.text} /> : null}
      </Row>
      <T muted style={{ fontSize: 11, textAlign: mine ? "right" : "left" }}>{time}</T>
    </View>
  );
}
