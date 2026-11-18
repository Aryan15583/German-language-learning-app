import "@fontsource-variable/inter";
import "@fontsource/dancing-script/700.css";
import "../styles/globals.css";
// Listen for the browser's "install app" offer from the very first moment.
import "../web/install";
import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthScreen } from "../components/AuthScreen";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Lock } from "../components/Lock";
import { Setup } from "../components/Setup";
import { LoadingScreen } from "../components/LoadingScreen";
import { AccountProvider, stateKey, useAccount } from "../web/account";
import { ProgressProvider, useProgress } from "../web/progress";

function Ready({ children }: { children: React.ReactNode }) {
  const { ready, locked, state, accountMode } = useProgress();
  if (!ready) return <LoadingScreen />;
  const needsSetup = accountMode ? !state.partners[0].name : !state.partners[0].name || !state.partners[1].name;
  if (needsSetup) return <Setup />;
  // Locked: show only the PIN screen, so nothing private is on the page behind it.
  if (locked) return <Lock />;
  return <>{children}</>;
}

/** Signed out → login. Signed in (or no accounts set up) → that person's progress. */
function Gate({ children }: { children: React.ReactNode }) {
  const acct = useAccount();
  if (acct.phase === "loading") return <LoadingScreen />;
  if (acct.phase === "error") return <LoadingScreen failed />;
  if (acct.phase !== "off" && acct.phase !== "ready") return <AuthScreen />;
  const uid = acct.account?.id;
  return (
    <ProgressProvider
      key={uid ?? "local"}
      storageKey={uid ? stateKey(uid) : undefined}
      initial={acct.initialState}
      onChange={uid ? acct.saveBackup : undefined}
      accountMode={!!uid}
    >
      <Ready>{children}</Ready>
    </ProgressProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Zwei Herzen ♡ Until Berlin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ErrorBoundary>
        <AccountProvider>
          <Gate>
            <Component {...pageProps} />
          </Gate>
        </AccountProvider>
      </ErrorBoundary>
    </>
  );
}
