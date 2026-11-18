// Applies light/dark before the page paints, so there is no white flash.
// (A file, not an inline script, so the strict Content-Security-Policy still holds.)
(function () {
  var pref = "system";
  try {
    pref = localStorage.getItem("zh-theme") || "system";
  } catch (e) {}
  var dark = pref === "dark" || (pref === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  // My colour (blue or pink) for the two of us.
  try {
    var prefs = JSON.parse(localStorage.getItem("zh-prefs") || "{}");
    document.documentElement.classList.toggle("me-blue", prefs && prefs.myColor === "blue");
  } catch (e) {}
})();
