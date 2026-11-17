import { useState } from "react";
import { shareText } from "../web/share";
import type { SendResult } from "../web/progress";
import { Button, Card } from "./ui";

/** When a message couldn't go in-app: offer to share it as a secure link instead. */
export function useFallback() {
  const [pending, setPending] = useState<{ link: string; error?: string } | null>(null);
  const [note, setNote] = useState("");
  const handle = (r: SendResult) => {
    if (r.delivered) setPending(null);
    else setPending({ link: r.link, error: r.error });
  };
  const view = pending ? (
    <Card className="my-3 border-rose-soft">
      <p className="font-bold text-ink">{pending.error ? `⚠️ ${pending.error}` : "📨 Send it to your partner"}</p>
      <p className="my-1.5 text-sm text-muted">
        {pending.error ? "Share it as a secure link instead:" : "In-app delivery isn’t set up yet, so share this secure link with your partner:"}
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={async () => {
            const r = await shareText(`💌 Zwei Herzen ♡ — open this to read it:\n${pending.link}`);
            setNote(r === "copied" ? "Link copied — paste it to your partner." : "");
            if (r !== "cancelled") setPending(null);
          }}
        >
          Share link
        </Button>
        <Button variant="soft" onClick={() => setPending(null)}>
          Later
        </Button>
      </div>
    </Card>
  ) : note ? (
    <p className="my-2 text-center text-sm text-muted">{note}</p>
  ) : null;
  return { handle, view };
}
