import { useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, Text, TextInput, View } from "react-native";
import { partnerColor, usePalette } from "../lib/theme";
import { couple, partnerName, useProgress, type PartnerIndex } from "../state/progress";
import { Button, Chip, Row, T } from "./ui";

const native = Platform.OS !== "web";

/** Full-screen PIN prompt for the current profile. */
export function Lock() {
  const c = usePalette();
  const { state, unlock, setLearner, reset } = useProgress();
  const i = state.learner;
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [shake] = useState(() => new Animated.Value(0));

  const doShake = () =>
    Animated.sequence(
      [10, -10, 8, -8, 4, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: native })),
    ).start();

  const submit = async () => {
    if (!pin || busy) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (!ok) {
      setError("Falsche PIN — wrong PIN");
      setPin("");
      doShake();
    }
  };

  const others = ([0, 1] as PartnerIndex[]).filter((x) => x !== i && !couple.isLinked(state) && state.partners[x].name);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 44 }}>🔐</Text>
      <Text style={{ color: c.accent, fontWeight: "800", fontSize: 16, marginTop: 6 }}>Zwei Herzen ♡</Text>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginTop: 8 }}>
        Hallo, <Text style={{ color: partnerColor(c, i) }}>{partnerName(state, i)}</Text>
      </Text>
      <T muted style={{ marginBottom: 16 }}>Enter your PIN to continue</T>

      <Animated.View style={{ transform: [{ translateX: shake }], width: "100%", maxWidth: 280 }}>
        <TextInput
          value={pin}
          onChangeText={(t) => {
            setPin(t.replace(/\D/g, "").slice(0, 8));
            setError("");
          }}
          onSubmitEditing={submit}
          keyboardType="number-pad"
          secureTextEntry
          autoFocus
          maxLength={8}
          accessibilityLabel="PIN"
          placeholder="• • • •"
          placeholderTextColor={c.muted}
          style={{
            borderWidth: 1,
            borderColor: error ? c.bad : c.border,
            backgroundColor: c.surface,
            color: c.text,
            borderRadius: 14,
            padding: 14,
            fontSize: 24,
            letterSpacing: 8,
            textAlign: "center",
          }}
        />
      </Animated.View>
      <Text style={{ color: c.bad, minHeight: 22, marginTop: 6 }} accessibilityLiveRegion="polite">
        {error}
      </Text>
      <View style={{ width: "100%", maxWidth: 280 }}>
        {busy ? <ActivityIndicator color={c.accent} /> : <Button title="Entsperren (Unlock)" onPress={submit} disabled={pin.length < 4} />}
      </View>

      {others.length ? (
        <Row style={{ marginTop: 18 }}>
          <T muted>Not you?</T>
          {others.map((x) => (
            <Chip key={x} label={partnerName(state, x)} onPress={() => setLearner(x)} />
          ))}
        </Row>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => setConfirmReset(true)} style={{ marginTop: 24, padding: 8 }}>
        <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Forgot PIN?</T>
      </Pressable>
      {confirmReset ? (
        <View style={{ maxWidth: 320, alignItems: "center" }}>
          <T muted style={{ textAlign: "center", fontSize: 13 }}>
            The PIN can’t be recovered. Resetting erases all progress and chats on this device.
          </T>
          <Button title="Erase everything on this device" variant="secondary" onPress={reset} style={{ marginTop: 8 }} />
        </View>
      ) : null}
    </View>
  );
}
