// Registers the offline service worker (kept as a file so the strict CSP needs no inline scripts).
// Not inside the Android app: its files are built in already.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    var c = window.Capacitor;
    if (window.androidBridge || (c && c.isNativePlatform && c.isNativePlatform())) return;
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}
