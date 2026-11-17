import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Two hearts learning German together, all the way to Berlin." />
        <meta name="theme-color" content="#8b2f55" />
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Zwei Herzen" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Files, not inline code, so the strict security policy needs no exceptions. */}
        {/* Runs before the page paints (light/dark), so it must not be deferred. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- tiny, and it prevents a white flash in dark mode */}
        <script src="/theme-init.js" />
        <script src="/register-sw.js" defer />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
