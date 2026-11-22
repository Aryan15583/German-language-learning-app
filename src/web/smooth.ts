// Buttery smooth scrolling (Lenis), like bidverify.vercel.app — tuned a little softer.
// Mouse wheels and touchpads glide; phones keep their own native touch scrolling.
import Lenis from "lenis";
import { useEffect, useRef } from "react";

/** Exponential ease-out: fast start, long gentle finish. */
const easeOutExpo = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function useSmoothScroll(enabled: boolean, routeKey: string) {
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({
      duration: 1.4,
      easing: easeOutExpo,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      // Inner scroll areas (sidebar, menus, pop-ups, text boxes) scroll on their own.
      prevent: (node: HTMLElement) => !!node.closest?.(".desk-scroll, [data-lenis-prevent], [role=dialog], [role=menu], textarea"),
    });
    lenis.current = l;
    let id = 0;
    const raf = (t: number) => {
      l.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      l.destroy();
      lenis.current = null;
    };
  }, [enabled]);

  // A new page starts at the top, without gliding there.
  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true });
  }, [routeKey]);
}

/** The same smooth scrolling inside a scroll box (the chat list): `wrapper` scrolls, `content` is its inner element. */
export function useSmoothScrollIn(wrapper: { current: HTMLElement | null }, content: { current: HTMLElement | null }, enabled: boolean) {
  useEffect(() => {
    const w = wrapper.current;
    const c = content.current;
    if (!enabled || !w || !c) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ wrapper: w, content: c, duration: 1.2, easing: easeOutExpo, smoothWheel: true, wheelMultiplier: 0.9 });
    let id = 0;
    const raf = (t: number) => {
      l.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      l.destroy();
    };
  }, [wrapper, content, enabled]);
}
