// Slow, soft "rise into place" for cards as they scroll into view.
// Pure CSS transitions + IntersectionObserver: no library, works with the strict CSP.
import { useLayoutEffect, type RefObject } from "react";

// Cards, page titles and anything marked data-reveal rise softly in; data-pop items pop in.
const SELECTOR = ".card-premium, [data-reveal], h1, h1 + p, [data-pop]";
const STAGGER_MS = 90;
const MAX_STAGGER = 6;

export function useReveal(root: RefObject<HTMLElement | null>, enabled: boolean, routeKey: string = "") {
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
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 },
    );

    // Once settled, remove our classes so hover effects work normally again.
    const settle = (ev: TransitionEvent) => {
      const t = ev.target as HTMLElement;
      if (ev.propertyName !== "transform" || !t.classList.contains("is-in")) return;
      t.classList.remove("reveal", "pop", "is-in");
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
        n.classList.add(n.hasAttribute("data-pop") ? "pop" : "reveal");
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

/** Grows a timeline line with scrolling: sets --p (0→1) on the element, from "top at 80%" to "bottom at 90%" of the screen. */
export function useScrollLine(ref: RefObject<HTMLElement | null>, enabled = true) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.8;
      const end = vh * 0.9;
      const p = (start - r.top) / Math.max(1, r.height - (end - start));
      el.style.setProperty("--p", String(Math.max(0, Math.min(1, p))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, enabled]);
}
