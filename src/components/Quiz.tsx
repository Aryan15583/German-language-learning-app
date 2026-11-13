import { useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { checkTypedAnswer, isAccepted, type AnswerVerdict } from "../lib/answers";
import type { Question } from "../lib/questions";
import { speakGerman } from "../lib/speech";
import { usePalette } from "../lib/theme";
import { Button, Card, ProgressBar, Row, SpeakButton, T } from "./ui";

const UMLAUTS = ["ä", "ö", "ü", "ß"];

type Props = {
  questions: Question[];
  /** Shown above the progress bar, e.g. "Aryan's turn" or "A1 exam". */
  label?: ReactNode;
  color?: string;
  onFinish: (correct: number, total: number) => void;
};

/** Runs a list of questions one by one with instant feedback, then reports the score. */
export function Quiz({ questions, label, color, onFinish }: Props) {
  const c = usePalette();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);

  const q = questions[index];
  if (!q) return null;
  const answered = verdict !== null;

  const settle = (v: AnswerVerdict) => {
    setVerdict(v);
    if (isAccepted(v)) setCorrect((n) => n + 1);
    // Hear the German whenever it wasn't already on screen, or after a mistake.
    if (q.kind === "type" || (q.kind === "choice" && q.direction === "x-de") || !isAccepted(v)) speakGerman(q.german);
  };

  const choose = (option: string) => {
    if (answered || q.kind !== "choice") return;
    setPicked(option);
    settle(option === q.answer ? "correct" : "wrong");
  };

  const check = () => {
    if (answered || q.kind !== "type" || !typed.trim()) return;
    settle(checkTypedAnswer(typed, q.answer));
  };

  const next = () => {
    const total = correct; // already includes this question
    if (index + 1 >= questions.length) return onFinish(total, questions.length);
    setIndex(index + 1);
    setPicked(null);
    setTyped("");
    setVerdict(null);
  };

  const instruction =
    q.kind === "type"
      ? "Type this in German"
      : q.direction === "de-x"
        ? "What does this mean?"
        : "How do you say this in German?";

  return (
    <View>
      <Row>
        {label}
        <View style={{ flex: 1 }} />
        <T muted style={{ fontSize: 13 }}>
          {index + 1} / {questions.length}
        </T>
      </Row>
      <ProgressBar value={index / questions.length} color={color} />

      <Card style={{ marginTop: 8 }}>
        <T muted style={{ fontSize: 13 }}>{instruction}</T>
        <Row style={{ marginTop: 4, flexWrap: "nowrap" }}>
          <Text style={{ color: c.text, fontSize: 21, fontWeight: "800", flexShrink: 1 }}>{q.prompt}</Text>
          {q.kind === "choice" && q.direction === "de-x" ? <SpeakButton text={q.german} /> : null}
        </Row>
      </Card>

      {q.kind === "choice" ? (
        <View style={{ gap: 8 }}>
          {q.options.map((o) => {
            const isAnswer = answered && o === q.answer;
            const isWrong = answered && picked === o && o !== q.answer;
            return (
              <Pressable
                key={o}
                accessibilityRole="button"
                accessibilityLabel={`Answer: ${o}`}
                disabled={answered}
                onPress={() => choose(o)}
                style={{
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 14,
                  borderColor: isAnswer ? c.good : isWrong ? c.bad : c.border,
                  backgroundColor: isAnswer ? c.goodSoft : isWrong ? c.badSoft : c.surface,
                }}
              >
                <Text style={{ color: c.text, fontSize: 16 }}>{o}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!answered}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Auf Deutsch…"
            placeholderTextColor={c.muted}
            accessibilityLabel="Your answer in German"
            onSubmitEditing={check}
            returnKeyType="done"
            style={{
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              color: c.text,
              borderRadius: 12,
              padding: 14,
              fontSize: 18,
            }}
          />
          <Row style={{ marginTop: 8 }}>
            {UMLAUTS.map((u) => (
              <Pressable
                key={u}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${u}`}
                disabled={answered}
                onPress={() => setTyped((t) => t + u)}
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: c.surface }}
              >
                <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>{u}</Text>
              </Pressable>
            ))}
          </Row>
          {!answered ? (
            <Button title="Check" onPress={check} disabled={!typed.trim()} style={{ marginTop: 12 }} />
          ) : null}
        </View>
      )}

      {answered ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            marginTop: 14,
            borderRadius: 14,
            padding: 14,
            backgroundColor: isAccepted(verdict) ? c.goodSoft : c.badSoft,
          }}
        >
          <Text style={{ color: isAccepted(verdict) ? c.good : c.bad, fontWeight: "800", fontSize: 17 }}>
            {verdict === "correct" ? "Richtig! ✓" : verdict === "typo" ? "Fast! Almost — watch the spelling" : "Nicht ganz — not quite"}
          </Text>
          {verdict !== "correct" ? (
            <T style={{ marginTop: 4 }}>
              Correct answer: <Text style={{ fontWeight: "700" }}>{q.answer}</Text>
            </T>
          ) : null}
          <Button title={index + 1 >= questions.length ? "See results" : "Continue"} onPress={next} style={{ marginTop: 10 }} />
        </View>
      ) : null}
    </View>
  );
}
