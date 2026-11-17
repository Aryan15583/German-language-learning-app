import { CheckCircle2, Download, MoreVertical, Share, SquarePlus } from "lucide-react";
import { useState } from "react";
import { useInstall } from "../web/install";
import { Button, Card } from "./ui";

/** Profile → "Download the app": one button where the browser allows it, simple steps where it doesn't. */
export function InstallCard() {
  const { canPrompt, installed, platform, install } = useInstall();
  const [note, setNote] = useState("");

  return (
    <Card className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Download size={20} className="text-plum" /> Download the app
      </h2>
      {installed ? (
        <p className="flex items-center gap-2 text-good">
          <CheckCircle2 size={18} /> Installed — you’re using the app. 💞
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">Put Zwei Herzen on your home screen: its own icon, full screen, and it works offline. Free — no app store needed.</p>
          {canPrompt ? (
            <Button
              size="lg"
              className="mt-3"
              onClick={async () => {
                const r = await install();
                setNote(r === "accepted" ? "Installed! Look for the ♡ icon on your home screen." : r === "dismissed" ? "No problem — you can install it any time." : "");
              }}
            >
              <Download size={20} /> Download the app
            </Button>
          ) : platform === "ios" ? (
            <ol className="mt-3 flex flex-col gap-2 text-ink">
              <Step n={1}>
                Open this page in <b>Safari</b>.
              </Step>
              <Step n={2}>
                Tap <Share size={16} className="inline text-plum" /> <b>Share</b> at the bottom.
              </Step>
              <Step n={3}>
                Tap <SquarePlus size={16} className="inline text-plum" /> <b>Add to Home Screen</b>, then <b>Add</b>.
              </Step>
            </ol>
          ) : platform === "android" ? (
            <ol className="mt-3 flex flex-col gap-2 text-ink">
              <Step n={1}>
                Open this page in <b>Chrome</b>.
              </Step>
              <Step n={2}>
                Tap <MoreVertical size={16} className="inline text-plum" /> (top right).
              </Step>
              <Step n={3}>
                Tap <b>Install app</b> (or <b>Add to Home screen</b>).
              </Step>
            </ol>
          ) : (
            <ol className="mt-3 flex flex-col gap-2 text-ink">
              <Step n={1}>
                Open this page in <b>Chrome</b> or <b>Edge</b>.
              </Step>
              <Step n={2}>
                Click the <Download size={16} className="inline text-plum" /> <b>install</b> icon at the right end of the address bar.
              </Step>
              <Step n={3}>
                Click <b>Install</b>. It opens in its own window.
              </Step>
            </ol>
          )}
          {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
        </>
      )}
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum text-sm font-bold text-white">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
