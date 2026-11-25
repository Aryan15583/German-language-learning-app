import { CheckCircle2, Download, Smartphone, MoreVertical, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstall } from "../web/install";
import { isNativeApp } from "../web/native";
import { Button, Card } from "./ui";

/** Profile → "Download the app": one button where the browser allows it, simple steps where it doesn't. */
export function InstallCard() {
  const { canPrompt, installed, platform, install } = useInstall();
  const [note, setNote] = useState("");
  if (isNativeApp()) return null; // inside the Android app there's nothing to install

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

export const APK_URL = "https://github.com/Aryan15583/German-language-learning-app/releases/download/android/zwei-herzen.apk";

/**
 * Extra, like Spotify: the website keeps working as it is; Android phones can also get the real app.
 * Shown only on Android browsers (inside the app it says you're already using it).
 */
export function AndroidAppCard() {
  const { platform } = useInstall();
  // Only show the download once the app has really been published on GitHub.
  const [published, setPublished] = useState(false);
  useEffect(() => {
    if (platform !== "android" || isNativeApp()) return;
    let alive = true;
    fetch("https://api.github.com/repos/Aryan15583/German-language-learning-app/releases/tags/android", { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((rel: { assets?: { name: string }[] } | null) => alive && setPublished(!!rel?.assets?.some((a) => a.name === "zwei-herzen.apk")))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [platform]);
  if (isNativeApp()) {
    return (
      <Card className="mt-4">
        <p className="flex items-center gap-2 font-semibold text-good">
          <CheckCircle2 size={18} /> You’re using the Zwei Herzen Android app. 💞
        </p>
        <p className="mt-1 text-sm text-muted">Same account and chats as the website. It updates by itself.</p>
      </Card>
    );
  }
  if (platform !== "android" || !published) return null;
  return (
    <Card className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Smartphone size={20} className="text-plum" /> Also available: the Android app
      </h2>
      <p className="text-sm text-muted">Prefer a real app? It opens without Chrome — same account, same chats. The website keeps working too.</p>
      <Button size="lg" variant="soft" className="mt-3" href={APK_URL}>
        <Download size={20} /> Get the Android app
      </Button>
      <ol className="mt-4 flex flex-col gap-2 text-sm text-ink">
        <Step n={1}>
          Open <b>zwei-herzen.apk</b> when it has downloaded.
        </Step>
        <Step n={2}>
          If Android asks, allow <b>“Install unknown apps”</b> once.
        </Step>
        <Step n={3}>
          Tap <b>Install</b>, then <b>Open</b>, and log in with the same email.
        </Step>
      </ol>
    </Card>
  );
}
