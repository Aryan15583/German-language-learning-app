// Tiny, soft feedback sounds made on the fly (no audio files). Can be muted.
const KEY = "zh-sound";
let ctx: AudioContext | null = null;

export const soundOn = () => {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};
export const setSound = (on: boolean) => {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.06) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

function ready() {
  if (typeof window === "undefined" || !soundOn()) return false;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  ctx = ctx ?? new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return true;
}

export function playRight() {
  if (!ready()) return;
  tone(660, 0, 0.12);
  tone(880, 0.1, 0.2);
}
export function playWrong() {
  if (!ready()) return;
  tone(220, 0, 0.22, "triangle", 0.05);
}
export function playDone() {
  if (!ready()) return;
  [523, 659, 784, 1046].forEach((f, k) => tone(f, k * 0.11, 0.25));
}
