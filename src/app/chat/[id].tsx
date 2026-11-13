import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Chip, PartnerName, Row, SpeakButton, T } from "../../components/ui";
import { findChat } from "../../content/chats";
import { meaning } from "../../content/levels";
import { answerChat, chatStars, startChat, type ChatInput, type ChatMessage } from "../../lib/chat";
import { partnerColor, partnerSoft, usePalette } from "../../lib/theme";
import { useProgress, XP } from "../../state/progress";

const UMLAUTS = ["ä", "ö", "ü", "ß"];

export default function ChatScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = findChat(id);
  const { state, practiced, recordChat } = useProgress();
  const learner = state.learner;
  const lang = state.partners[learner].lang;
  const [chatState, setChatState] = useState(() => (chat ? startChat(chat) : null));
  const [text, setText] = useState("");
  const [help, setHelp] = useState(true);
  const scroll = useRef<ScrollViewInstance>(null);

  if (!chat || !chatState) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}>
        <T>Chat not found.</T>
      </View>
    );
  }

  const send = (input: ChatInput) => {
    const next = answerChat(chat, chatState, input);
    if (next === chatState) return;
    setChatState(next);
    setText("");
    if (next.step > chatState.step) practiced(learner, XP.chatTurn);
    if (next.done && !chatState.done) {
      recordChat(learner, chat.id, chatStars(next.mistakes));
      practiced(learner, XP.chatDone);
    }
  };

  const step = chat.steps[chatState.step];
  const stars = chatStars(chatState.mistakes);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: `${chat.level} · ${chat.title}` }} />
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, width: "100%", maxWidth: 640, alignSelf: "center" }}
      >
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <T>
            {chat.emoji} {lang === "mr" ? chat.intro.mr : chat.intro.en}
          </T>
          <Row style={{ marginTop: 8 }}>
            <Chip label={lang === "mr" ? "भाषांतर दाखवा" : "Show translations"} selected={help} onPress={() => setHelp(!help)} />
          </Row>
        </Card>

        {chatState.messages.map((m, k) => (
          <Message key={k} m={m} bot={chat.bot} help={help} lang={lang} learner={learner} />
        ))}

        {chatState.done ? (
          <Card style={{ alignItems: "center", marginTop: 12 }}>
            <Text style={{ fontSize: 34 }}>{"⭐".repeat(stars) + "☆".repeat(3 - stars)}</Text>
            <T style={{ fontWeight: "800", fontSize: 18, marginTop: 4 }}>Super gemacht!</T>
            <T muted style={{ textAlign: "center", marginVertical: 6 }}>
              {chatState.mistakes === 0
                ? "A perfect conversation!"
                : `${chatState.mistakes} ${chatState.mistakes === 1 ? "slip" : "slips"} — try again for 3 stars.`}
            </T>
            <View style={{ gap: 8, alignSelf: "stretch" }}>
              <Button title="Chat again" variant="secondary" onPress={() => setChatState(startChat(chat))} />
              <Button title="Back to chats" onPress={() => router.back()} />
            </View>
          </Card>
        ) : null}
      </ScrollView>

      {!chatState.done && step ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.surface,
            padding: 12,
            paddingBottom: 12 + insets.bottom,
          }}
        >
          <View style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}>
            <T muted style={{ fontSize: 12, marginBottom: 6 }}>
              <PartnerName i={learner} /> · {lang === "mr" ? "उत्तर निवडा किंवा टाइप करा" : "Pick a reply or type your own"}
            </T>
            <View style={{ gap: 6 }}>
              {step.replies.map((r, k) => (
                <Pressable
                  key={r.de}
                  accessibilityRole="button"
                  accessibilityLabel={`Reply: ${r.de}`}
                  onPress={() => send({ reply: k })}
                  style={({ pressed }) => ({
                    borderWidth: 1,
                    borderColor: pressed ? c.accent : c.border,
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: c.bg,
                  })}
                >
                  <Text style={{ color: c.text, fontSize: 15 }}>{r.de}</Text>
                  {help ? <Text style={{ color: c.muted, fontSize: 12 }}>{meaning(r, lang)}</Text> : null}
                </Pressable>
              ))}
            </View>
            <Row style={{ marginTop: 8, flexWrap: "nowrap" }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Auf Deutsch antworten…"
                placeholderTextColor={c.muted}
                autoCapitalize="sentences"
                autoCorrect={false}
                spellCheck={false}
                accessibilityLabel="Type your reply in German"
                onSubmitEditing={() => send({ text })}
                returnKeyType="send"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  color: c.text,
                  backgroundColor: c.bg,
                  fontSize: 15,
                }}
              />
              <Button title="Send" onPress={() => send({ text })} disabled={!text.trim()} />
            </Row>
            <Row style={{ marginTop: 6 }}>
              {UMLAUTS.map((u) => (
                <Pressable
                  key={u}
                  accessibilityRole="button"
                  accessibilityLabel={`Insert ${u}`}
                  onPress={() => setText((t) => t + u)}
                  style={{ borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 }}
                >
                  <Text style={{ color: c.text, fontWeight: "700" }}>{u}</Text>
                </Pressable>
              ))}
            </Row>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Message({
  m,
  bot,
  help,
  lang,
  learner,
}: {
  m: ChatMessage;
  bot: { name: string; avatar: string };
  help: boolean;
  lang: "en" | "mr";
  learner: 0 | 1;
}) {
  const c = usePalette();
  const bubble = { maxWidth: "85%" as const, borderRadius: 16, padding: 12, marginVertical: 5 };

  if (m.from === "bot") {
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        <Text style={{ fontSize: 24 }}>{bot.avatar}</Text>
        <View style={[bubble, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderBottomLeftRadius: 4 }]}>
          <Text style={{ color: c.accent, fontSize: 11, fontWeight: "800" }}>{bot.name}</Text>
          <Row style={{ flexWrap: "nowrap", marginTop: 2 }}>
            <Text style={{ color: c.text, fontSize: 16, flexShrink: 1 }}>{m.line.de}</Text>
            <SpeakButton text={m.line.de} />
          </Row>
          {help ? <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{meaning(m.line, lang)}</Text> : null}
        </View>
      </View>
    );
  }

  if (m.from === "me") {
    return (
      <View
        style={[
          bubble,
          {
            alignSelf: "flex-end",
            backgroundColor: m.ok ? partnerSoft(c, learner) : c.badSoft,
            borderBottomRightRadius: 4,
          },
        ]}
      >
        <Text style={{ color: partnerColor(c, learner), fontSize: 11, fontWeight: "800", textAlign: "right" }}>
          {m.ok ? "✓" : "✗"}
        </Text>
        <Text style={{ color: c.text, fontSize: 16 }}>{m.de}</Text>
      </View>
    );
  }

  const body =
    m.kind === "why"
      ? lang === "mr"
        ? m.why.mr
        : m.why.en
      : m.kind === "typo"
        ? `${lang === "mr" ? "छान! फक्त स्पेलिंग पाहा:" : "Good! Just check the spelling:"} ${m.expected}`
        : `${lang === "mr" ? "उदाहरणार्थ असं म्हणा:" : "Try something like:"} „${m.example.de}“ — ${meaning(m.example, lang)}`;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ alignSelf: "center", backgroundColor: m.kind === "typo" ? c.goodSoft : c.accentSoft, borderRadius: 12, padding: 10, marginVertical: 6, maxWidth: "92%" }}
    >
      <Text style={{ color: c.text, fontSize: 14 }}>💡 {body}</Text>
    </View>
  );
}
