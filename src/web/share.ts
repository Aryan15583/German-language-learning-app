// Sharing links when in-app delivery isn't set up, and reading secret #fragments safely.
export const appBaseUrl = () => (typeof window !== "undefined" ? window.location.origin : "https://zwei-herzen-until-berlin.vercel.app");

export const messageLink = (sealed: string) => `${appBaseUrl()}/inbox#${sealed}`;

/** Open the share sheet, or copy to the clipboard where there isn't one. */
export async function shareText(text: string): Promise<"shared" | "copied" | "cancelled"> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ text });
      return "shared";
    } catch {
      // cancelled or blocked: fall back to copying
    }
  }
  try {
    await nav?.clipboard?.writeText(text);
    return "copied";
  } catch {
    return "cancelled";
  }
}

/** Read the secret part of the URL, then wipe it from the address bar and history. */
export function takeFragment(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) window.history.replaceState(null, "", window.location.pathname);
  return hash;
}
