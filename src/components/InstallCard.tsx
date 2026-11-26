import { CheckCircle2, Download, Smartphone, MoreVertical, RefreshCw, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstall } from "../web/install";
import { applyWebUpdate, checkWebUpdate, latestAndroidBuild, type WebUpdate } from "../web/appUpdate";
import { isNativeApp, nativeAppBuild } from "../web/native";
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
        <>
          <p className="flex items-center gap-2 text-good">
            <CheckCircle2 size={18} /> Installed — you’re using the app. 💞
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <UpdateButton />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Put Zwei Herzen on your home screen: its own icon, full screen, and it works offline. Free — no app store needed.</p>
          {canPrompt ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                onClick={async () => {
                  const r = await install();
                  setNote(r === "accepted" ? "Installed! Look for the ♡ icon on your home screen." : r === "dismissed" ? "No problem — you can install it any time." : "");
                }}
              >
                <Download size={20} /> Download the app
              </Button>
              <UpdateButton />
            </div>
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
          {canPrompt ? null : (
            <div className="mt-3 flex flex-wrap gap-2">
              <UpdateButton />
            </div>
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
  if (isNativeApp()) return <NativeAppCard />;
  if (platform !== "android" || !published) return null;
  return (
    <Card className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Smartphone size={20} className="text-plum" /> Also available: the Android app
      </h2>
      <p className="text-sm text-muted">Prefer a real app? It opens without Chrome — same account, same chats. The website keeps working too.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="lg" variant="soft" href={APK_URL}>
          <Download size={20} /> Get the Android app
        </Button>
        <Button size="lg" variant="ghost" className="ring-1 ring-inset ring-rose-soft/60" href={APK_URL}>
          <RefreshCw size={18} /> Update the app
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Already have it? “Update the app” gets the newest version — install it over the old one; your chats and progress stay.</p>
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

/** Inside the Android app: its version, an Update button for the app itself, and one for the content. */
function NativeAppCard() {
  const [mine, setMine] = useState<number | null>(null);
  const [latest, setLatest] = useState<number | null | "checking">("checking");
  const check = () => {
    setLatest("checking");
    latestAndroidBuild().then(setLatest);
  };
  useEffect(() => {
    nativeAppBuild().then(setMine).catch(() => {});
    latestAndroidBuild().then(setLatest);
  }, []);
  const newer = typeof latest === "number" && mine !== null && latest > mine;
  return (
    <Card className="mt-4">
      <p className="flex items-center gap-2 font-semibold text-good">
        <CheckCircle2 size={18} /> You’re using the Zwei Herzen Android app. 💞
      </p>
      <p className="mt-1 text-sm text-muted">
        Same account and chats as the website. New features arrive by themselves{mine !== null ? ` · App build ${mine}` : ""}.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {newer ? (
          <Button size="md" href={APK_URL}>
            <Download size={18} /> Update the app (build {latest})
          </Button>
        ) : (
          <Button size="md" variant="soft" onClick={check} disabled={latest === "checking"}>
            <RefreshCw size={16} className={latest === "checking" ? "animate-spin" : ""} />
            {latest === "checking" ? "Checking…" : latest === null ? "Couldn’t check — try again" : "App is up to date ✓"}
          </Button>
        )}
        <UpdateButton />
      </div>
      {newer ? <p className="mt-2 text-xs text-muted">Opens the download in your browser. Tap the file, then Install — it installs over this one and your chats and progress stay.</p> : null}
    </Card>
  );
}

/** Website / installed web app: is a newer version out? One tap gets it (saved data stays). */
export function UpdateButton() {
  const [state, setState] = useState<WebUpdate | "checking" | "updating">("checking");
  const check = () => {
    setState("checking");
    checkWebUpdate().then(setState);
  };
  useEffect(() => {
    let alive = true;
    checkWebUpdate().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);
  if (state === "new" || state === "updating")
    return (
      <Button
        size="md"
        disabled={state === "updating"}
        onClick={() => {
          setState("updating");
          applyWebUpdate();
        }}
      >
        <RefreshCw size={16} className={state === "updating" ? "animate-spin" : ""} /> {state === "updating" ? "Updating…" : "Update available — update now"}
      </Button>
    );
  return (
    <Button size="md" variant="ghost" className="ring-1 ring-inset ring-rose-soft/60" onClick={check} disabled={state === "checking"}>
      <RefreshCw size={16} className={state === "checking" ? "animate-spin" : ""} />
      {state === "checking" ? "Checking for updates…" : state === "offline" ? "Offline — check again" : "Up to date ✓ · Check again"}
    </Button>
  );
}
