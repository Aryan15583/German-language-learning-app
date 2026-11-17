// The Supabase client, used for accounts (sign up / log in) and the encrypted backup.
// Only exists when the app was built with EXPO_PUBLIC_RELAY_URL / EXPO_PUBLIC_RELAY_KEY.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { relayConfig } from "./relay";
import "./url-polyfill";

let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const cfg = relayConfig();
  client = cfg
    ? createClient(cfg.url, cfg.key, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          // Email confirmation and password-reset links come back to the web app.
          detectSessionInUrl: Platform.OS === "web",
        },
      })
    : null;
  return client;
}

/** Accounts are on whenever the app knows its Supabase project. */
export const accountsEnabled = () => relayConfig() !== null;

export type AuthSettings = { google: boolean; signupOpen: boolean };

/**
 * Supabase's public sign-in settings: which providers are switched on and whether
 * new sign-ups are allowed. Used to only show options that will actually work.
 */
export async function fetchAuthSettings(fetchImpl: typeof fetch = fetch): Promise<AuthSettings | null> {
  const cfg = relayConfig();
  if (!cfg) return null;
  try {
    const res = await fetchImpl(`${cfg.url}/auth/v1/settings`, { headers: { apikey: cfg.key } });
    if (!res.ok) return null;
    return parseAuthSettings(await res.json());
  } catch {
    return null;
  }
}

export function parseAuthSettings(json: unknown): AuthSettings {
  const j = (json ?? {}) as { external?: { google?: unknown }; disable_signup?: unknown };
  return { google: j.external?.google === true, signupOpen: j.disable_signup !== true };
}
