import type { CapacitorConfig } from "@capacitor/cli";

// The Android app (see android/ and .github/workflows/android.yml).
// It opens the live site in the app's own built-in browser engine (Android System WebView),
// so it updates by itself whenever the site updates — no new APK needed for normal changes.
const config: CapacitorConfig = {
  appId: "app.zweiherzen.android",
  appName: "Zwei Herzen",
  webDir: "out",
  server: {
    url: "https://zwei-herzen-until-berlin.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    backgroundColor: "#fff6f8",
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    LocalNotifications: { smallIcon: "ic_stat_heart", iconColor: "#8b2f55" },
  },
};

export default config;
