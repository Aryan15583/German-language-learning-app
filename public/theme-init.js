// Applies light/dark before the page paints, so there is no white flash.
// (A file, not an inline script, so the strict Content-Security-Policy still holds.)
(function () {
  var pref = "system";
  try {
    pref = localStorage.getItem("zh-theme") || "system";
  } catch (e) {}
  var dark = pref === "dark" || (pref === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();
