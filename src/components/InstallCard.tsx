import { CheckCircle2, Download, Smartphone, MoreVertical, RefreshCw, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useInstall } from "../web/install";
import { applyWebUpdate, checkWebUpdate, type WebUpdate } from "../web/appUpdate";
import { isNativeApp, nativeAppVersion, openPlayStore } from "../web/native";
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

/** The app's Google Play page. Set PLAY_LIVE once the app is published there. */
export const PLAY_URL = "https://play.google.com/store/apps/details?id=app.zweiherzen.android";
const PLAY_LIVE = false;

/**
 * The Android app is separate from the website and only comes from Google Play.
 * Website (Android phones): a "Get it on Google Play" link once it's published.
 * Inside the app: its version, and updates through Google Play.
 */
export function AndroidAppCard() {
  const { platform } = useInstall();
  if (isNativeApp()) return <NativeAppCard />;
  if (platform !== "android" || !PLAY_LIVE) return null;
  return (
    <Card className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <Smartphone size={20} className="text-plum" /> Also available: the Android app
      </h2>
      <p className="text-sm text-muted">A real app from Google Play — same account, same chats. The website keeps working too.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-4 text-lg font-semibold text-white">
          <Download size={20} /> Get it on Google Play
        </a>
      </div>
    </Card>
  );
}

/** Inside the Android app: its version, and updates through Google Play. */
function NativeAppCard() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    nativeAppVersion().then(setVersion).catch(() => {});
  }, []);
  return (
    <Card className="mt-4">
      <p className="flex items-center gap-2 font-semibold text-good">
        <CheckCircle2 size={18} /> You’re using the Zwei Herzen app. 💞
      </p>
      <p className="mt-1 text-sm text-muted">Same account and chats as the website{version ? ` · Version ${version}` : ""}.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="md" variant="soft" onClick={() => openPlayStore()}>
          <RefreshCw size={16} /> Check for updates
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Opens Google Play. Updates also install by themselves there.</p>
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
