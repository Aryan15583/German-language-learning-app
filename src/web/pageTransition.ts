// Native-app-like page changes: the old page fades out while the new one floats in
// (View Transitions API — Chrome on Android and desktop). Other browsers just switch pages.
import Router from "next/router";
import { useEffect } from "react";
import { getPrefs } from "./prefs";

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };

export function usePageTransitions() {
  useEffect(() => {
    const doc = document as VTDocument;
    if (!doc.startViewTransition) return;
    let finish: (() => void) | null = null;
    const done = () => {
      finish?.();
      finish = null;
    };
    const start = (url: string, { shallow }: { shallow: boolean }) => {
      if (shallow || finish || !getPrefs().animations) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      if (url.split("?")[0] === window.location.pathname) return; // same page (e.g. chat settings)
      document.documentElement.classList.add("vt-on");
      const vt = doc.startViewTransition!(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
            setTimeout(done, 2500); // never hold the screen if a page is slow
          }),
      );
      vt.finished.finally(() => document.documentElement.classList.remove("vt-on")).catch(() => {});
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", done);
    Router.events.on("routeChangeError", done);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", done);
      Router.events.off("routeChangeError", done);
      done();
    };
  }, []);
}
