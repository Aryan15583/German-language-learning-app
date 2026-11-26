import type { CapacitorConfig } from "@capacitor/cli";

// The Android app (see android/ and .github/workflows/android.yml).
// A real, self-contained app: all screens are built into the app (from out/), nothing is loaded
// from the website and Chrome is never opened. Updates come through Google Play.
const config: CapacitorConfig = {
  appId: "app.zweiherzen.android",
  appName: "Zwei Herzen",
  webDir: "out",
  server: {
    androidScheme: "https",
    hostname: "app.zweiherzen",
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
