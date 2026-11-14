import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { usePalette } from "../lib/theme";
import { emailProblem, passwordProblem } from "../lib/vault";
import { useAccount } from "../state/account";
import { Button, Card, Chip, Row, T } from "./ui";

type Mode = "login" | "signup" | "forgot";

/** Log in / create account / forgot password, plus "unlock" and "set a new password" steps. */
export function AuthScreen() {
  const c = usePalette();
  const acct = useAccount();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const input = {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.text,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    marginTop: 10,
  } as const;

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; code?: string }>) => {
    setBusy(true);
    setError("");
    setInfo("");
    const r = await fn();
    setBusy(false);
    if (!r.ok) {
      if (r.code === "confirm-email") setInfo(r.error ?? "");
      else setError(r.error ?? "Something went wrong.");
      setMismatch(r.code === "password-mismatch");
    }
    return r;
  };

  const phase = acct.phase;
  const heading =
    phase === "unlock"
      ? "Welcome back 💞"
      : phase === "recovery"
        ? "Choose a new password"
        : mode === "signup"
          ? "Create your account"
          : mode === "login"
            ? "Willkommen zurück!"
            : "Reset your password";

  const passwordField = (value: string, set: (t: string) => void, label: string, placeholder: string) => (
    <TextInput
      style={input}
      value={value}
      onChangeText={(t) => {
        set(t);
        setError("");
      }}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={mode === "signup" || phase === "recovery" ? "newPassword" : "password"}
      accessibilityLabel={label}
    />
  );

  const submit = async () => {
    if (busy) return;
    if (phase === "unlock") return run(() => acct.unlock(password));
    if (phase === "recovery") {
      const p = passwordProblem(password);
      if (p) return setError(p);
      if (password !== confirm) return setError("The two passwords don’t match.");
      return run(() => acct.setNewPassword(password));
    }
    const e = emailProblem(email);
    if (e) return setError(e);
    if (mode === "forgot") {
      const r = await run(() => acct.sendReset(email));
      if (r.ok) setInfo("If there’s an account for this email, a reset link is on its way. Check your inbox (and spam).");
      return;
    }
    if (mode === "signup") {
      const p = passwordProblem(password);
      if (p) return setError(p);
      if (password !== confirm) return setError("The two passwords don’t match.");
      return run(() => acct.signUp(email, password));
    }
    return run(() => acct.signIn(email, password));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48, alignItems: "center" }} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: "/icons/icon-192.png" }} style={{ width: 84, height: 84, borderRadius: 20 }} accessibilityIgnoresInvertColors />
        <Text style={{ color: c.accent, fontWeight: "900", fontSize: 22, marginTop: 12 }}>Zwei Herzen ♡</Text>
        <T muted style={{ marginBottom: 18 }}>Until Berlin — learning German together</T>

        <Card style={{ width: "100%", maxWidth: 420 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "800" }}>{heading}</Text>

          {phase === "signed-out" ? (
            <Row style={{ marginTop: 10 }}>
              <Chip label="Create account" selected={mode === "signup"} onPress={() => setMode("signup")} />
              <Chip label="Log in" selected={mode === "login"} onPress={() => setMode("login")} />
            </Row>
          ) : null}

          {phase === "unlock" ? (
            <T muted style={{ marginTop: 6 }}>
              Enter the password for <Text style={{ fontWeight: "700" }}>{acct.account?.email}</Text> to unlock your progress on this phone.
            </T>
          ) : null}
          {phase === "recovery" ? (
            <T muted style={{ marginTop: 6 }}>Your progress on this phone is kept and locked with the new password.</T>
          ) : null}

          {phase === "signed-out" ? (
            <TextInput
              style={input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              placeholder="Email"
              placeholderTextColor={c.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel="Email"
            />
          ) : null}

          {mode !== "forgot" || phase !== "signed-out" ? passwordField(password, setPassword, "Password", phase === "recovery" ? "New password" : "Password") : null}
          {(phase === "signed-out" && mode === "signup") || phase === "recovery"
            ? passwordField(confirm, setConfirm, "Confirm password", "Type it again")
            : null}

          {mode !== "forgot" || phase !== "signed-out" ? (
            <Pressable accessibilityRole="button" onPress={() => setShow(!show)} style={{ alignSelf: "flex-end", padding: 6 }}>
              <T muted style={{ fontSize: 13 }}>{show ? "🙈 Hide password" : "👁 Show password"}</T>
            </Pressable>
          ) : null}

          {error ? (
            <Text accessibilityLiveRegion="polite" style={{ color: c.bad, marginTop: 6 }}>
              {error}
            </Text>
          ) : null}
          {info ? (
            <Text accessibilityLiveRegion="polite" style={{ color: c.good, marginTop: 6 }}>
              {info}
            </Text>
          ) : null}

          <View style={{ marginTop: 12 }}>
            {busy ? (
              <ActivityIndicator color={c.accent} />
            ) : (
              <Button
                title={
                  phase === "unlock"
                    ? "Unlock"
                    : phase === "recovery"
                      ? "Save new password"
                      : mode === "signup"
                        ? "Create account 💞"
                        : mode === "login"
                          ? "Log in"
                          : "Send reset link"
                }
                onPress={submit}
              />
            )}
          </View>

          {mismatch ? (
            <View style={{ marginTop: 10 }}>
              <T muted style={{ fontSize: 13 }}>
                You can start a new backup with your current password. Anything already on this phone is kept.
              </T>
              <Button title="Start a new backup" variant="secondary" onPress={() => run(() => acct.startFresh(password))} style={{ marginTop: 6 }} />
            </View>
          ) : null}

          {phase === "signed-out" && mode === "login" ? (
            <Pressable accessibilityRole="button" onPress={() => setMode("forgot")} style={{ marginTop: 12, alignSelf: "center" }}>
              <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Forgot password?</T>
            </Pressable>
          ) : null}
          {phase === "signed-out" && mode === "forgot" ? (
            <Pressable accessibilityRole="button" onPress={() => setMode("login")} style={{ marginTop: 12, alignSelf: "center" }}>
              <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Back to log in</T>
            </Pressable>
          ) : null}
          {phase === "unlock" ? (
            <Pressable accessibilityRole="button" onPress={acct.signOut} style={{ marginTop: 12, alignSelf: "center" }}>
              <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Use a different account</T>
            </Pressable>
          ) : null}
        </Card>

        <T muted style={{ fontSize: 12, textAlign: "center", marginTop: 14, maxWidth: 380 }}>
          🔒 Your progress is encrypted on your phone with your password before it’s saved. Nobody else can read it — which also means a
          forgotten password can’t be recovered.
        </T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
