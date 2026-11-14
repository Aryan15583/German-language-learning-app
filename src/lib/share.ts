// Getting things to the partner when the relay isn't set up: share a link,
// or copy it. Also reads secret fragments (#…) and wipes them from the address bar.
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { Platform, Share } from "react-native";

export const FALLBACK_URL = "https://zwei-herzen-until-berlin.vercel.app";

export function appBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.origin;
  const configured = (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl;
  return configured ?? FALLBACK_URL;
}

export const messageLink = (sealed: string) => `${appBaseUrl()}/inbox#${sealed}`;

/** Open the share sheet (or copy on browsers without one). */
export async function shareText(text: string): Promise<"shared" | "copied" | "cancelled"> {
  if (Platform.OS === "web") {
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ text });
        return "shared";
      } catch {
        // user cancelled, or share blocked: fall back to copying
      }
    }
    await Clipboard.setStringAsync(text);
    return "copied";
  }
  const res = await Share.share({ message: text });
  return res.action === Share.sharedAction ? "shared" : "cancelled";
}

/** Read the secret part of the current URL and remove it from the address bar and history. */
export function takeFragment(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) window.history.replaceState(null, "", window.location.pathname);
  return hash;
}
