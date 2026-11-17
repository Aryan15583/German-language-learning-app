import { Mic, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "./ui";

/**
 * Record yourself and play it back next to the real pronunciation.
 * The recording never leaves this device (no upload, no speech service).
 */
export function Recorder({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "recording" | "done" | "denied">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const supported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (!supported) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })));
        setState("done");
      };
      r.start();
      rec.current = r;
      setState("recording");
      // Never record for long by accident.
      setTimeout(() => r.state === "recording" && r.stop(), 8000);
    } catch {
      setState("denied");
    }
  };

  return (
    <div className={cx("flex flex-wrap items-center justify-center gap-2", className)}>
      {state === "recording" ? (
        <button type="button" onClick={() => rec.current?.stop()} className="flex items-center gap-2 rounded-full bg-bad px-4 py-2 font-semibold text-white">
          <Square size={16} fill="currentColor" /> Stop
          <span className="h-2 w-2 animate-ping rounded-full bg-white" />
        </button>
      ) : (
        <button type="button" onClick={start} className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 font-semibold text-plum hover:border-rose">
          <Mic size={16} /> {state === "done" ? "Record again" : "Record myself"}
        </button>
      )}
      {url && state === "done" ? (
        <button type="button" onClick={() => new Audio(url).play().catch(() => {})} className="flex items-center gap-2 rounded-full bg-blush px-4 py-2 font-semibold text-plum">
          <Play size={16} fill="currentColor" /> Hear me
        </button>
      ) : null}
      {state === "denied" ? <span className="text-xs text-muted">Microphone not allowed — just say it out loud.</span> : null}
    </div>
  );
}
