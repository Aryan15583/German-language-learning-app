import { useRouter } from "next/router";
import { stepHref } from "../core/lib/path";

/** Where the big Start button goes. */
export const hrefOf = stepHref;

/** The ?id= of the current page, or null until the router has read the address. */
export function useId(): string | null {
  const router = useRouter();
  if (!router.isReady) return null;
  const id = router.query.id;
  return typeof id === "string" ? id : "";
}
