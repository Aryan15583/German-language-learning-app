// "Update" button: is there a newer version of the website?
// Website and installed web app only (the Android app updates through Google Play): each deploy
// has a new Next.js build id. Compare ours with the one the server has now.

/** The build id of the version on screen. */
export function currentBuildId(): string | null {
  if (typeof window === "undefined") return null;
  const id = (window as unknown as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
  return typeof id === "string" && id ? id : null;
}

/** The build id the server has now (null when offline). */
export async function serverBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/?zh-check=${Date.now()}`, { cache: "no-store", headers: { Accept: "text/html" } });
    if (!res.ok) return null;
    const m = (await res.text()).match(/"buildId"\s*:\s*"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export type WebUpdate = "new" | "latest" | "offline";

export async function checkWebUpdate(): Promise<WebUpdate> {
  const [mine, theirs] = [currentBuildId(), await serverBuildId()];
  if (!theirs) return "offline";
  return mine && mine !== theirs ? "new" : "latest";
}

/** Get the newest files and reload. Saved data (chats, progress, settings) stays on the phone. */
export async function applyWebUpdate() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    // no service worker: a reload is enough
  }
  window.location.reload();
}
