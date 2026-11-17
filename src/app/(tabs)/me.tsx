import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, H2, LangPicker, PartnerName, Row, Screen, T } from "../../components/ui";
import { LEVELS } from "../../content/levels";
import { ACHIEVEMENTS, earnedAchievements, heartLevel } from "../../lib/game";
import { partnerColor, usePalette } from "../../lib/theme";
import { useAccount } from "../../state/account";
import { couple, currentStreak, partnerName, useProgress, type PartnerIndex } from "../../state/progress";

/** Me: your profile and all the settings, kept out of the way of learning. */
export default function Me() {
  const c = usePalette();
  const { state, reset, accountMode } = useProgress();
  const who = state.learner;
  const p = state.partners[who];
  const hearts = heartLevel(p.xp);
  const earned = earnedAchievements(couple.achievementContext(state, who, currentStreak(state)));
  const [confirmReset, setConfirmReset] = useState(false);
  const people: PartnerIndex[] = accountMode || couple.isLinked(state) ? [0] : [0, 1];

  return (
    <Screen>
      <Card style={{ alignItems: "center", paddingVertical: 20 }}>
        <Text style={{ fontSize: 48 }}>🙂</Text>
        <Text style={{ color: partnerColor(c, who), fontSize: 24, fontWeight: "900" }}>{partnerName(state, who)}</Text>
        <T muted>
          {LEVELS[p.unlocked].id} · ❤️ Lv {hearts.level} {hearts.title} · {p.xp} XP
        </T>
      </Card>

      <BigRow emoji="🏅" title="My badges" detail={`${earned.length} of ${ACHIEVEMENTS.length}`} onPress={() => router.push("/badges")} />
      <BigRow emoji="🧭" title="Find my level" detail="A short test that puts you in the right place" onPress={() => router.push("/placement")} />
      <BigRow emoji="✏️" title="Change my name or level" detail="Back to the start screen" onPress={() => router.push("/setup")} />

      <H2>My language 🌐</H2>
      <Card>
        {people.map((i) => (
          <Row key={i} style={{ marginVertical: 4 }}>
            {people.length > 1 ? (
              <View style={{ minWidth: 70 }}>
                <PartnerName i={i} />
              </View>
            ) : null}
            <LangPicker i={i} />
          </Row>
        ))}
        <T muted style={{ fontSize: 13, marginTop: 6 }}>Meanings and help appear in this language.</T>
      </Card>

      {accountMode ? <AccountCard /> : null}
      <PinSettings />

      {accountMode ? null : (
        <>
          <Pressable accessibilityRole="button" onPress={() => setConfirmReset(true)} style={{ alignSelf: "center", marginTop: 24, padding: 8 }}>
            <T muted style={{ fontSize: 13, textDecorationLine: "underline" }}>Start over (erase everything)</T>
          </Pressable>
          {confirmReset ? (
            <Card>
              <T muted style={{ fontSize: 13 }}>This erases all names and progress on this phone.</T>
              <Row style={{ marginTop: 8 }}>
                <Button
                  title="Erase"
                  variant="secondary"
                  onPress={() => {
                    reset();
                    router.replace("/setup");
                  }}
                />
                <Button title="Keep everything" onPress={() => setConfirmReset(false)} />
              </Row>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** A big, easy-to-tap row. */
function BigRow({ emoji, title, detail, onPress }: { emoji: string; title: string; detail: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: pressed ? c.accent : c.border,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
      })}
    >
      <Text style={{ fontSize: 30 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: "800" }}>{title}</Text>
        <T muted style={{ fontSize: 13 }}>{detail}</T>
      </View>
      <Text style={{ color: c.muted, fontSize: 22 }}>›</Text>
    </Pressable>
  );
}

/** Optional PIN for each profile on this phone. */
function PinSettings() {
  const c = usePalette();
  const { state, setPin } = useProgress();
  const { accountMode } = useProgress();
  const people: PartnerIndex[] = couple.isLinked(state) || accountMode ? [0] : [0, 1];
  const [editing, setEditing] = useState<PartnerIndex | null>(null);
  const [pin, setPinText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  return (
    <>
      <H2>Privacy 🔐</H2>
      <Card>
        {people.map((i) => (
          <Row key={i} style={{ marginVertical: 4 }}>
            <View style={{ minWidth: 70 }}>
              <PartnerName i={i} />
            </View>
            <T muted style={{ flex: 1, fontSize: 13 }}>{state.partners[i].pin ? "PIN on 🔒" : "No PIN"}</T>
            <Chip label={state.partners[i].pin ? "Change" : "Set PIN"} onPress={() => setEditing(i)} />
            {state.partners[i].pin ? (
              <Chip
                label="Remove"
                onPress={async () => {
                  await setPin(i, null);
                  setNote("PIN removed.");
                }}
              />
            ) : null}
          </Row>
        ))}
        {editing !== null ? (
          <View style={{ marginTop: 8 }}>
            <TextInput
              value={pin}
              onChangeText={(t) => setPinText(t.replace(/\D/g, "").slice(0, 8))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="New PIN (4–8 digits)"
              placeholderTextColor={c.muted}
              accessibilityLabel="New PIN"
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, color: c.text, backgroundColor: c.bg, fontSize: 18, letterSpacing: 4 }}
            />
            <Row style={{ marginTop: 8 }}>
              {busy ? (
                <ActivityIndicator color={c.accent} />
              ) : (
                <Button
                  title="Save PIN"
                  disabled={pin.length < 4}
                  onPress={async () => {
                    setBusy(true);
                    await setPin(editing, pin);
                    setBusy(false);
                    setEditing(null);
                    setPinText("");
                    setNote("PIN saved. The app asks for it next time it opens.");
                  }}
                />
              )}
              <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
            </Row>
          </View>
        ) : null}
        {note ? <T muted style={{ marginTop: 6, fontSize: 13 }}>{note}</T> : null}
        <T muted style={{ fontSize: 12, marginTop: 6 }}>
          The PIN is stored only as a salted, slow hash on this phone. It can’t be recovered — forgetting it means resetting the app.
        </T>
      </Card>
    </>
  );
}

/** Signed-in account: email, backup status and sign out. */
function AccountCard() {
  const acct = useAccount();
  const [confirm, setConfirm] = useState(false);
  const backupText = { idle: "Backup ready", saving: "Saving…", saved: "Backed up ✓", error: "Backup failed — will retry" }[acct.backup];
  return (
    <>
      <H2>Account 👤</H2>
      <Card>
        <T style={{ fontWeight: "700" }}>{acct.account?.email}</T>
        {acct.account?.provider === "google" ? <T muted style={{ fontSize: 13 }}>Signed in with Google</T> : null}
        <T muted style={{ fontSize: 13 }}>
          🔒 {backupText} · encrypted with your {acct.account?.provider === "google" ? "backup passphrase" : "password"}
        </T>
        {confirm ? (
          <View style={{ marginTop: 8 }}>
            <T muted style={{ fontSize: 13 }}>Your progress is saved in your account. Signing out removes it from this phone until you log in again.</T>
            <Row style={{ marginTop: 8 }}>
              <Button title="Sign out" variant="secondary" onPress={acct.signOut} />
              <Button title="Stay" onPress={() => setConfirm(false)} />
            </Row>
          </View>
        ) : (
          <Button title="Sign out" variant="secondary" onPress={() => setConfirm(true)} style={{ marginTop: 8 }} />
        )}
      </Card>
    </>
  );
}
