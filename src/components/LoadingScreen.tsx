import { HeartPlane } from "./ui";

/**
 * Shown while the app starts (and baked into the page itself, so it's never a bare "Loading…").
 * `failed`: the network didn't answer in time — say so kindly and offer to try again.
 */
export function LoadingScreen({ failed }: { failed?: boolean }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center" role="status" aria-live="polite">
      <div className="flex max-w-sm flex-col items-center">
        <HeartPlane className="h-10 w-28 text-rose" />
        <p className="mt-2 font-script text-5xl font-bold leading-tight text-plum">
          Zwei Herzen ♡<br />
          Until Berlin
        </p>
        <p className="mt-2 text-muted">Two hearts learning German together, all the way to Berlin. 💞</p>
        {failed ? (
          <>
            <p className="mt-6 font-semibold text-ink">Oops! We can’t reach the internet right now. ❤️</p>
            <p className="mt-1 text-sm text-muted">Check your connection, then try again.</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-4 rounded-full px-6 py-3 font-semibold text-white">
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 h-9 w-9 animate-spin rounded-full border-4 border-rose-soft border-t-plum" />
            <span className="sr-only">Loading…</span>
          </>
        )}
      </div>
    </div>
  );
}
