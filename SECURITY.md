# Security

Zusammen is a private, personal app. This page explains how it is protected.

## How the app is built
- **No server, no accounts, no API keys.** The web app is static files on Vercel. Nothing is sent anywhere: progress lives only in the browser's local storage on each device.
- **No third-party scripts, trackers, fonts or analytics.** Every script and style is served from the app's own domain.
- **No raw HTML rendering.** All text (including names you type) is rendered by React Native as plain text, so it cannot inject scripts. There is no `eval` or `dangerouslySetInnerHTML` in the codebase.
- **Saved data is validated on load** (`migrate()` in `src/state/logic.ts`): unexpected or corrupted values fall back to safe defaults instead of crashing.
- **Crash screen** (`ErrorBoundary` in `src/app/_layout.tsx`): unexpected errors show a friendly retry screen rather than a blank page.

## Browser security headers (`vercel.json`)
| Header | Protects against |
|---|---|
| `Content-Security-Policy` (scripts only from this site, no plugins, no framing, no form posts) | Cross-site scripting and data exfiltration |
| `Strict-Transport-Security` (2 years, preload) | Downgrade to insecure HTTP |
| `X-Frame-Options: DENY`, `frame-ancestors 'none'` | Clickjacking (embedding the app in another site) |
| `X-Content-Type-Options: nosniff` | MIME-type confusion |
| `Referrer-Policy: no-referrer` | Leaking the app's URL to other sites |
| `Permissions-Policy` (camera, mic, location, payment… all off) | Abuse of device features |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin` | Cross-origin attacks on the window and its files |
| `X-Robots-Tag: noindex` + `robots.txt` | The private app showing up in search engines |

The full app was tested end to end in a browser with these exact headers applied, with no blocked content.

## Automated checks (GitHub)
- **CI** (`.github/workflows/ci.yml`): lint, typecheck, 121 tests, `npm audit` (fails on high/critical issues in shipped dependencies) and a production build on every push.
- **CodeQL** (`.github/workflows/codeql.yml`): GitHub's code security scanner on every push to `main`, every PR and weekly.
- **Dependabot** (`.github/dependabot.yml`): weekly pull requests for dependency updates.

## Known, accepted advisories
`npm audit` reports 3 moderate advisories in `minimatch` (a slow regular expression) inside `@expo/fingerprint`, a **build-time Expo tool**. It is not part of the app that ships to browsers. npm's suggested fix downgrades Expo to an older major version, which is worse, so this is tracked until Expo updates the dependency (Dependabot will propose it).

## Keeping it private
The headers stop search engines from indexing the site, but anyone with the link can still open it. For a truly private link, turn on **Vercel → Project → Settings → Deployment Protection** (Vercel Authentication, or Password Protection on paid plans).

## Reporting
Found a problem? Open a private security advisory on the GitHub repository.
