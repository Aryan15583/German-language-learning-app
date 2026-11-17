// 🤫 Hidden easter egg. Opened by tapping the ♡ in the title five times.
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const MESSAGE = "For my Baiko";
const HEARTS = ["💕", "💖", "💗", "❤️", "💞", "♡", "💓"];

export default function Baiko() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const done = typed.length >= MESSAGE.length;

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(MESSAGE.slice(0, i));
      if (i >= MESSAGE.length) clearInterval(t);
    }, 140);
    return () => clearInterval(t);
  }, []);

  const close = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="For my Baiko. Tap to close."
      onClick={(e) => {
        // Let her select the text without closing the card.
        if (window.getSelection()?.toString()) return;
        if ((e.target as HTMLElement).closest("[data-card]")) return;
        close();
      }}
      onKeyDown={(e) => e.key === "Escape" && close()}
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#2b0a18]/90 p-6"
    >
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="baiko-heart absolute bottom-[-40px]"
          style={{
            left: `${(i * 47) % 100}%`,
            fontSize: 18 + ((i * 13) % 22),
            animationDuration: `${4.2 + ((i * 733) % 3200) / 1000}s`,
            animationDelay: `${((i * 380) % 3600) / 1000}s`,
          }}
        >
          {HEARTS[i % HEARTS.length]}
        </span>
      ))}
      <div aria-hidden className="baiko-glow absolute h-80 w-80 rounded-full bg-[#ff7a9c]" />
      <div data-card className="baiko-card relative w-full max-w-sm cursor-auto rounded-[28px] bg-[#fff7f5] px-7 py-8 text-center shadow-[0_20px_60px_rgba(226,85,122,0.5)]">
        <p className={done ? "baiko-beat text-6xl" : "text-6xl"}>💖</p>
        <h1 className="mt-2 font-script text-5xl font-bold text-[#e2557a]">
          {typed}
          <span className={done ? "opacity-0" : "animate-pulse"}>|</span>
        </h1>
        <div className={done ? "anim-fade-up" : "opacity-0"}>
          <p className="mt-3 text-xl font-bold text-ink">माझ्या बायकोसाठी 💞</p>
          {/* Hidden in the card's own white: it only shows when she selects the text. */}
          <p className="mt-1 font-bold text-[#fff7f5] select-text">Shreya, I love you ♡</p>
          <p className="mt-2 italic text-muted">Mit all meiner Liebe — bis Berlin und weiter.</p>
          <p className="mt-4 text-xs tracking-widest text-[#b8a6ad]">Zwei Herzen ♡ Until Berlin</p>
        </div>
      </div>
      <p className={done ? "absolute bottom-10 text-xs text-[#fbe1e8] anim-fade-up" : "hidden"}>tap anywhere to close</p>
    </div>
  );
}
