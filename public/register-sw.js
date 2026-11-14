// Registers the offline service worker (kept as a file so the strict CSP needs no inline scripts).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}
