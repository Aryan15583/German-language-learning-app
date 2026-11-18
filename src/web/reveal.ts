// Slow, soft "rise into place" for cards as they scroll into view.
// Pure CSS transitions + IntersectionObserver: no library, works with the strict CSP.
import { useLayoutEffect, type RefObject } from "react";

const SELECTOR = ".card-premium, [data-reveal]";
const STAGGER_MS = 90;
const MAX_STAGGER = 5;

export function useReveal(root: RefObject<HTMLElement | null>, enabled: boolean, routeKey: string) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let batch = 0;
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const t = e.target as HTMLElement;
          io.unobserve(t);
          t.style.transitionDelay = `${Math.min(batch++, MAX_STAGGER) * STAGGER_MS}ms`;
          t.classList.add("is-in");
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => (batch = 0));
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    // Once settled, remove our classes so hover effects work normally again.
    const settle = (ev: TransitionEvent) => {
      const t = ev.target as HTMLElement;
      if (ev.propertyName !== "transform" || !t.classList.contains("is-in")) return;
      t.classList.remove("reveal", "is-in");
      t.style.transitionDelay = "";
    };

    const scan = () => {
      for (const n of el.querySelectorAll<HTMLElement>(SELECTOR)) {
        if (n.dataset.revealed) continue;
        // Nested cards move with their parent.
        if (n.parentElement?.closest(SELECTOR)) {
          n.dataset.revealed = "1";
          continue;
        }
        n.dataset.revealed = "1";
        n.classList.add("reveal");
        io.observe(n);
      }
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });
    el.addEventListener("transitionend", settle);
    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(frame);
      el.removeEventListener("transitionend", settle);
    };
  }, [root, enabled, routeKey]);
}
