// Accounts (Supabase Auth) with a zero-knowledge backup: progress is encrypted
// on the phone with a key derived from the password before it is uploaded.
// One person per phone: signing out removes that person's data from the device.
import AsyncStorage from "./storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { accountsEnabled, fetchAuthSettings, supabase, type AuthSettings } from "./supabase";
import { cloudIsNewer, deriveVaultKey, newSalt, openBackup, sealBackup } from "../core/lib/vault";

export type Phase = "loading" | "off" | "signed-out" | "unlock" | "recovery" | "ready";
export type Provider = "email" | "google";
export type Account = { id: string; email: string; provider: Provider };

type AuthUser = { id: string; email?: string | null; app_metadata?: { provider?: string } };
const toAccount = (u: AuthUser, fallbackEmail = ""): Account => ({
  id: u.id,
  email: u.email ?? fallbackEmail,
  provider: u.app_metadata?.provider === "google" ? "google" : "email",
});
type Vault = { key: string; salt: string };
export type BackupStatus = "idle" | "saving" | "saved" | "error";
type Result = { ok: true } | { ok: false; error: string; code?: "password-mismatch" | "confirm-email" };

const vaultKey = (uid: string) => `zh-vault:${uid}`;
export const stateKey = (uid: string) => `zh-state:${uid}`;
const SAVE_DELAY_MS = 2500;

/** Supabase messages → something kind and clear. */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("not confirmed")) return "Please confirm your email first — check your inbox (and spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "There’s already an account with this email — log in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Please wait a minute and try again.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "Google sign-in isn’t switched on yet.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "New sign-ups are closed for this app.";
  if (m.includes("weak") || m.includes("password should")) return "Please choose a stronger password.";
  if (m.includes("fetch") || m.includes("network")) return "Can’t reach the internet right now.";
  return message || "Something went wrong. Please try again.";
}

type Ctx = {
  enabled: boolean;
  phase: Phase;
  account: Account | null;
  /** Decrypted cloud progress to start from (null = use this phone's copy or start fresh). */
  initialState: unknown;
  backup: BackupStatus;
  /** Google accounts: does a backup exist yet (enter passphrase) or not (choose one)? */
  hasBackup: boolean | null;
  /** Web only: continue with a Google account. */
  signInWithGoogle: () => Promise<Result>;
  /** What the Supabase project allows (null until known). */
  settings: AuthSettings | null;
  resendConfirmation: (email: string) => Promise<Result>;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  /** Re-enter the password on a phone that has a session but no key (e.g. after confirming email). */
  unlock: (password: string) => Promise<Result>;
  /** Keep this phone's progress (if any) and start a new backup with the current password. */
  startFresh: (password: string) => Promise<Result>;
  sendReset: (email: string) => Promise<Result>;
  setNewPassword: (password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  saveBackup: (state: unknown) => void;
};

const AccountContext = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const enabled = accountsEnabled();
  const [phase, setPhase] = useState<Phase>(enabled ? "loading" : "off");
  const [account, setAccount] = useState<Account | null>(null);
  const [initialState, setInitialState] = useState<unknown>(null);
  const [backup, setBackup] = useState<BackupStatus>("idle");
  const [hasBackup, setHasBackup] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<AuthSettings | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchAuthSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, [enabled]);
  const vault = useRef<Vault | null>(null);
  const pending = useRef<{ state: unknown; timer: ReturnType<typeof setTimeout> } | null>(null);

  const fetchRow = useCallback(async (uid: string): Promise<{ salt: string; blob: string } | null> => {
    const { data, error } = await supabase()!.from("user_data").select("salt, blob").eq("user_id", uid).limit(1);
    if (error) throw new Error(error.message);
    return data && data[0] ? (data[0] as { salt: string; blob: string }) : null;
  }, []);

  const upload = useCallback(async (uid: string, v: Vault, state: unknown) => {
    setBackup("saving");
    const { error } = await supabase()!
      .from("user_data")
      .upsert({ user_id: uid, salt: v.salt, blob: sealBackup(v.key, state) }, { onConflict: "user_id" });
    setBackup(error ? "error" : "saved");
  }, []);

  /** Open (or create) this account's encrypted backup with the password. */
  const openVault = useCallback(
    async (acct: Account, password: string, fresh = false): Promise<Result> => {
      // Let the UI show a spinner before the slow key derivation.
      await new Promise((r) => setTimeout(r, 30));
      let row: { salt: string; blob: string } | null;
      try {
        row = fresh ? null : await fetchRow(acct.id);
      } catch (e) {
        return { ok: false, error: friendlyAuthError((e as Error).message) };
      }
      let v: Vault;
      let restored: unknown = null;
      if (row) {
        v = { salt: row.salt, key: deriveVaultKey(password, row.salt) };
        try {
          restored = openBackup(v.key, row.blob);
          // Keep this phone's copy if it has newer, not-yet-uploaded changes.
          const local = await AsyncStorage.getItem(stateKey(acct.id)).catch(() => null);
          if (!cloudIsNewer(local ? JSON.parse(local) : null, restored)) restored = null;
        } catch {
          return {
            ok: false,
            code: "password-mismatch",
            error:
              acct.provider === "google"
                ? "That backup passphrase doesn’t match."
                : "Your saved progress was locked with an older password, so it can’t be opened.",
          };
        }
      } else {
        const salt = newSalt();
        v = { salt, key: deriveVaultKey(password, salt) };
        // Starting fresh: keep whatever this phone already has for this account.
        const local = await AsyncStorage.getItem(stateKey(acct.id)).catch(() => null);
        if (local) {
          try {
            await upload(acct.id, v, JSON.parse(local));
          } catch {
            // will retry on the next save
          }
        }
      }
      vault.current = v;
      await AsyncStorage.setItem(vaultKey(acct.id), JSON.stringify(v)).catch(() => {});
      setAccount(acct);
      setInitialState(restored);
      setPhase("ready");
      return { ok: true };
    },
    [fetchRow, upload],
  );

  // Restore a session when the app opens, and follow auth events.
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!alive) return;
      if (!user) return setPhase((p) => (p === "recovery" ? p : "signed-out"));
      const acct = toAccount(user);
      setAccount(acct);
      const saved = await AsyncStorage.getItem(vaultKey(user.id)).catch(() => null);
      if (!saved) {
        // Google accounts unlock with a backup passphrase: choose one, or enter the existing one?
        if (acct.provider === "google") {
          const row = await fetchRow(user.id).catch(() => null);
          if (alive) setHasBackup(!!row);
        }
        return setPhase((p) => (p === "recovery" ? p : "unlock"));
      }
      vault.current = JSON.parse(saved) as Vault;
      // Use whichever copy is newer: the cloud's (e.g. changes from another phone) or this phone's
      // (e.g. changes made just before the app was closed). Offline: this phone's copy.
      try {
        const row = await fetchRow(user.id);
        if (row && row.salt === vault.current.salt) {
          const cloud = openBackup(vault.current.key, row.blob);
          const local = await AsyncStorage.getItem(stateKey(user.id)).catch(() => null);
          if (cloudIsNewer(local ? JSON.parse(local) : null, cloud)) setInitialState(cloud);
        }
      } catch {
        // offline or not decryptable: use the local copy
      }
      if (alive) setPhase((p) => (p === "recovery" ? p : "ready"));
    })();
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        if (session?.user) setAccount(toAccount(session.user));
        setPhase("recovery");
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchRow]);

  const flush = useCallback(async () => {
    const p = pending.current;
    if (!p || !account || !vault.current) return;
    clearTimeout(p.timer);
    pending.current = null;
    try {
      await upload(account.id, vault.current, p.state);
    } catch {
      setBackup("error");
    }
  }, [account, upload]);

  // Leaving the page: try to save right away instead of waiting for the timer.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const value = useMemo<Ctx>(
    () => ({
      enabled,
      phase,
      account,
      initialState,
      backup,
      hasBackup,
      settings,
      resendConfirmation: async (email) => {
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase()!.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: redirect } });
        return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
      },
      signInWithGoogle: async () => {
        if (typeof window === "undefined") return { ok: false, error: "Google sign-in works in the web app." };
        const { error } = await supabase()!.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin, queryParams: { prompt: "select_account" } },
        });
        // On success the browser leaves for Google and comes back signed in.
        return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
      },
      signUp: async (email, password) => {
        const sb = supabase()!;
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } });
        if (error) return { ok: false, error: friendlyAuthError(error.message) };
        if (!data.session || !data.user) {
          return { ok: false, code: "confirm-email", error: "Almost there! We sent you an email — tap the link in it, then log in here." };
        }
        return openVault(toAccount(data.user, email.trim()), password, true);
      },
      signIn: async (email, password) => {
        const { data, error } = await supabase()!.auth.signInWithPassword({ email: email.trim(), password });
        if (error || !data.user) return { ok: false, error: friendlyAuthError(error?.message) };
        return openVault(toAccount(data.user, email.trim()), password);
      },
      unlock: async (password) => {
        if (!account) return { ok: false, error: "Please log in again." };
        // Google accounts: the backup passphrase itself is the check (it must open the existing backup).
        if (account.provider === "google") return openVault(account, password, hasBackup === false);
        // Check the password with Supabase first, so a typo can't create a backup we can't open later.
        const { error } = await supabase()!.auth.signInWithPassword({ email: account.email, password });
        if (error) return { ok: false, error: friendlyAuthError(error.message) };
        return openVault(account, password);
      },
      startFresh: async (password) => {
        if (!account) return { ok: false, error: "Please log in again." };
        return openVault(account, password, true);
      },
      sendReset: async (email) => {
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase()!.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
        return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
      },
      setNewPassword: async (password) => {
        const { data, error } = await supabase()!.auth.updateUser({ password });
        if (error || !data.user) return { ok: false, error: friendlyAuthError(error?.message) };
        // The old backup was locked with the old password; re-lock what this phone has with the new one.
        return openVault(toAccount(data.user), password, true);
      },
      signOut: async () => {
        await flush();
        const uid = account?.id;
        await supabase()!.auth.signOut().catch(() => {});
        if (uid) {
          // One person per phone: leave nothing of theirs behind.
          await AsyncStorage.multiRemove([vaultKey(uid), stateKey(uid)]).catch(() => {});
        }
        vault.current = null;
        setAccount(null);
        setInitialState(null);
        setBackup("idle");
        setHasBackup(null);
        setPhase("signed-out");
      },
      saveBackup: (state) => {
        if (!account || !vault.current) return;
        if (pending.current) clearTimeout(pending.current.timer);
        const v = vault.current;
        const uid = account.id;
        pending.current = {
          state,
          timer: setTimeout(() => {
            pending.current = null;
            upload(uid, v, state).catch(() => setBackup("error"));
          }, SAVE_DELAY_MS),
        };
      },
    }),
    [enabled, phase, account, initialState, backup, hasBackup, settings, openVault, flush, upload],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}
