// Read German aloud with the browser's built-in voices (no server, no AI).
export function speakGerman(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  u.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("de"));
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
