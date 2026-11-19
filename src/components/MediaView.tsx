import { Download, Play, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MediaRef } from "../core/lib/link";
import { clock, mediaUrl, MediaError } from "../web/media";
import { cx } from "./ui";

/** A photo, video or voice message inside a chat bubble. Decrypted on this phone only. */
export function MediaView({ media }: { media: MediaRef }) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "expired">("idle");
  const [full, setFull] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      setUrl(await mediaUrl(media));
      setState("idle");
    } catch (e) {
      setState(e instanceof MediaError && e.message === "expired" ? "expired" : "error");
    }
  }, [media]);

  // Photos up to 5 MB load by themselves; videos and voice load when you tap them.
  useEffect(() => {
    if (media.type !== "image" || media.size > 5 * 1048576) return;
    let alive = true;
    mediaUrl(media)
      .then((u) => alive && setUrl(u))
      .catch((e) => alive && setState(e instanceof MediaError && e.message === "expired" ? "expired" : "error"));
    return () => {
      alive = false;
    };
  }, [media]);

  const ratio = media.w && media.h ? `${media.w} / ${media.h}` : media.type === "audio" ? undefined : "4 / 3";
  const failed = state === "expired" ? "Expired — files are kept for 30 days." : state === "error" ? "Couldn’t load. Tap to try again." : null;

  if (media.type === "audio") {
    return (
      <div className="flex min-w-56 items-center gap-2">
        {url ? (
          <audio src={url} controls autoPlay className="h-10 w-full max-w-64" />
        ) : (
          <button type="button" onClick={load} disabled={state === "loading" || state === "expired"} className="flex w-full items-center gap-3 rounded-2xl bg-surface/70 px-3 py-2 text-left">
            <span className="btn-primary grid h-9 w-9 shrink-0 place-items-center rounded-full text-white">
              <Play size={16} fill="currentColor" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">🎤 Voice message</span>
              <span className="block text-xs text-muted">{state === "loading" ? "Loading…" : failed ?? clock(media.dur)}</span>
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (url ? setFull(true) : load())}
        disabled={state === "loading" || state === "expired"}
        aria-label={media.type === "image" ? "Open photo" : "Play video"}
        className="relative block w-64 max-w-full overflow-hidden rounded-2xl bg-line/40"
        style={{ aspectRatio: ratio }}
      >
        {media.thumb && (!url || media.type === "video") ? (
          // eslint-disable-next-line @next/next/no-img-element -- a tiny inline preview
          <img src={media.thumb} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
        ) : null}
        {url && media.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- decrypted on this phone
          <img src={url} alt="Photo" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {media.type === "video" || !url ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className={cx("grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white", state === "loading" && "animate-pulse")}>
              {state === "loading" ? "…" : media.type === "video" ? <Play size={20} fill="currentColor" /> : "📷"}
            </span>
          </span>
        ) : null}
        {media.type === "video" && media.dur !== undefined ? <span className="absolute bottom-1.5 right-2 rounded-full bg-black/50 px-1.5 text-[11px] text-white">{clock(media.dur)}</span> : null}
        {failed ? <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[11px] text-white">{failed}</span> : null}
      </button>
      {full && url ? (
        <div role="dialog" aria-label={media.type === "image" ? "Photo" : "Video"} className="fixed inset-0 z-50 flex flex-col bg-black/90 anim-fade-up" onClick={() => setFull(false)}>
          <div className="flex justify-end gap-2 p-3">
            <a
              href={url}
              download={`zwei-herzen-${media.path.slice(0, 8)}.${media.mime.split("/")[1].replace("quicktime", "mov").replace("jpeg", "jpg")}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              <Download size={16} /> Save
            </a>
            <button type="button" aria-label="Close" onClick={() => setFull(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <X size={20} />
            </button>
          </div>
          <div className="grid flex-1 place-items-center p-3" onClick={(e) => e.stopPropagation()}>
            {media.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- decrypted on this phone
              <img src={url} alt="Photo" className="max-h-full max-w-full rounded-lg object-contain" />
            ) : (
              <video src={url} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg" />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
