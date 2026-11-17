import { useRouter } from "next/router";
import type { NextStep } from "../core/lib/path";

/** Where the big Start button goes (static export: one page per screen, the item in ?id=). */
export function hrefOf(step: NextStep): string {
  switch (step.kind) {
    case "learn":
    case "review":
      return `/lesson?id=${step.unit.id}`;
    case "quiz":
      return `/quiz?id=${step.unit.id}`;
    case "test":
      return `/exam?id=${step.level.id}`;
  }
}

/** The ?id= of the current page, or null until the router has read the address. */
export function useId(): string | null {
  const router = useRouter();
  if (!router.isReady) return null;
  const id = router.query.id;
  return typeof id === "string" ? id : "";
}
