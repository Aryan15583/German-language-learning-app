import { useRouter } from "next/router";
import { useRef } from "react";

const TAPS = 5;
const WINDOW_MS = 2500;

/** Psst: the heart is a door. Five quick taps open a little surprise. */
export function SecretHeart({ className }: { className?: string }) {
  const router = useRouter();
  const taps = useRef<number[]>([]);
  const onHeart = (e: React.MouseEvent) => {
    // Inside the logo link: don't also go home.
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < WINDOW_MS), now];
    if (taps.current.length >= TAPS) {
      taps.current = [];
      router.push("/baiko");
    }
  };
  // No label or hint on purpose: it's a secret.
  return (
    <span onClick={onHeart} data-heart className={`cursor-default select-none ${className ?? ""}`} aria-hidden>
      ♡
    </span>
  );
}

/** The app title for phones. */
export function BrandTitle() {
  return (
    <span className="font-script text-[26px] font-bold leading-none text-plum">
      Zwei Herzen <SecretHeart />
    </span>
  );
}
