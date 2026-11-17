// The Supabase client for accounts and the encrypted backup.
// Only exists when the site was built with EXPO_PUBLIC_RELAY_URL / EXPO_PUBLIC_RELAY_KEY.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { relayConfig } from "../core/lib/relay";

let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const cfg = relayConfig();
  client = cfg
    ? createClient(cfg.url, cfg.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
  return client;
}

export const accountsEnabled = () => relayConfig() !== null;

export type AuthSettings = { google: boolean; signupOpen: boolean };

/** Which sign-in options the Supabase project allows, so the app only shows ones that work. */
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
