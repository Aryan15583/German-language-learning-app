// Inside the Android app (Capacitor): native notifications (Firebase), the phone's back button,
// and saving to the gallery. On the website none of this runs.
import { Capacitor } from "@capacitor/core";

export const isNativeApp = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

let tokenPromise: Promise<string | null> | null = null;
let listenersReady = false;

/** Ask for notification permission and get this phone's Firebase token (null if not allowed). */
export async function nativePushToken(ask: boolean): Promise<string | null> {
  if (!isNativeApp()) return null;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    if (!ask) return null;
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") return null;
  tokenPromise ??= new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), 15_000);
    PushNotifications.addListener("registration", (t) => {
      clearTimeout(timer);
      resolve(t.value);
    });
    PushNotifications.addListener("registrationError", () => {
      clearTimeout(timer);
      resolve(null);
    });
    PushNotifications.register().catch(() => resolve(null));
  }).then((t) => {
    if (!t) tokenPromise = null; // try again next time
    return t;
  });
  return tokenPromise;
}

export async function nativePushOff() {
  if (!isNativeApp()) return;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.unregister().catch(() => {});
  tokenPromise = null;
}

/** Show a notification now (app open in the background). */
export async function nativeNotify(title: string, body: string, url = "/messages") {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;
  await LocalNotifications.schedule({
    notifications: [{ id: Math.floor(Date.now() % 2_000_000_000), title, body, channelId: "messages", smallIcon: "ic_stat_heart", extra: { url } }],
  });
}

/** One-time setup in the app: notification channel, tapping a notification, the back button. */
export async function initNativeApp(navigate: (url: string) => void) {
  if (!isNativeApp() || listenersReady) return;
  listenersReady = true;
  const [{ PushNotifications }, { LocalNotifications }, { App }] = await Promise.all([
    import("@capacitor/push-notifications"),
    import("@capacitor/local-notifications"),
    import("@capacitor/app"),
  ]);
  const channel = { id: "messages", name: "Messages", description: "New messages from your partner", importance: 5 as const, visibility: 1 as const, lights: true, lightColor: "#8b2f55", vibration: true };
  await PushNotifications.createChannel(channel).catch(() => {});
  await LocalNotifications.createChannel(channel).catch(() => {});
  await PushNotifications.createChannel({ id: "reminders", name: "Daily reminder", description: "Zeit für Deutsch!", importance: 4, visibility: 1 }).catch(() => {});
  const open = (url: unknown) => navigate(typeof url === "string" && url.startsWith("/") ? url : "/messages");
  PushNotifications.addListener("pushNotificationActionPerformed", (a) => open(a.notification.data?.url));
  LocalNotifications.addListener("localNotificationActionPerformed", (a) => open(a.notification.extra?.url));
  // Phone's back button: go back inside the app; on the first screen, leave it like other apps.
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) window.history.back();
    else App.minimizeApp().catch(() => {});
  });
}

/** Save files to the phone's gallery, in a "Zwei Herzen" album. */
export async function nativeSaveToGallery(files: { blob: Blob; mime: string; name: string }[]): Promise<number> {
  const { Media } = await import("@capacitor-community/media");
  const album = "Zwei Herzen";
  const { path } = await Media.getAlbumsPath();
  const find = async () => (await Media.getAlbums()).albums.find((a) => a.name === album && (!path || a.identifier.startsWith(path)));
  let target = await find();
  if (!target) {
    await Media.createAlbum({ name: album });
    target = await find();
  }
  let saved = 0;
  for (const f of files) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(f.blob);
    });
    const opts = { path: dataUrl, albumIdentifier: target?.identifier, fileName: f.name.replace(/\.[^.]+$/, "") };
    if (f.mime.startsWith("video/")) await Media.saveVideo(opts);
    else await Media.savePhoto(opts);
    saved++;
  }
  return saved;
}
