# Security

Zwei Herzen ♡ Until Berlin is a private, personal app. This page explains how it is protected.

## How the app is built
- **No accounts, no AI, no secret API keys.** The web app is static files on Vercel, and progress lives on each device.
- **End-to-end encryption between partners.** Everything one phone sends to the other (messages, secrets, words, duel scores, progress) is encrypted on the phone with XChaCha20-Poly1305 (`@noble/ciphers`, audited, no dependencies). Only the two phones have the key.
- **Pairing by 6-character code.** Codes use letters and digits without look-alikes and expire after 24 hours. Both phones turn the code into a key with slow PBKDF2-SHA256 (200,000 rounds). The joining phone's first message carries a **fresh random 256-bit key**, which is used for everything after that, so the short code only ever protects that one message.
- **Zero-knowledge relay (optional).** For in-app delivery, encrypted messages are dropped into a Supabase "mailbox" (`supabase/migrations/0001_relay.sql`):
  - Mailbox names are SHA-256 hashes of the couple key, so they can't be guessed or listed.
  - Clients have **no table access at all**. They can only call two functions: drop a message, and read a mailbox by its exact name.
  - Inputs are validated, sending is rate-limited (30/min per mailbox), reads are paged, and messages are **deleted after 30 days**. The functions pin `search_path` so they can't be hijacked.
  - Security tests for all of this run on a real Postgres in CI. In an end-to-end test, the relay held 6 messages and none contained any readable word or name.
- **Strict validation of everything received.** Decrypted messages are checked for type, length, control characters, couple ID, timestamps, valid exam IDs and score ranges. Anything forged or tampered with is rejected with a friendly error.
- **PIN lock.** PINs are stored only as salted PBKDF2-SHA256 hashes (120,000 rounds) and checked in constant time. A forgotten PIN can't be recovered; the only way out is to reset the device's data.
- **Links fallback.** Without the relay, messages travel as links whose secret part sits after `#`, which browsers never send to any server. The app wipes it from the address bar and history after reading it.
- **No third-party scripts, trackers, fonts or analytics.** Every script and style is served from the app's own domain.
- **No raw HTML rendering.** All text (including names you type) is rendered by React Native as plain text, so it cannot inject scripts. There is no `eval` or `dangerouslySetInnerHTML` in the codebase.
- **Saved data is validated on load** (`migrate()` in `src/state/logic.ts`): unexpected or corrupted values fall back to safe defaults instead of crashing.
- **Crash screen** (`ErrorBoundary` in `src/app/_layout.tsx`): unexpected errors show a friendly retry screen rather than a blank page.

## Browser security headers (`vercel.json`)
| Header | Protects against |
|---|---|
| `Content-Security-Policy` (scripts only from this site, network only to this site and Supabase, no plugins, no framing, no form posts) | Cross-site scripting and data exfiltration |
| `Strict-Transport-Security` (2 years, preload) | Downgrade to insecure HTTP |
| `X-Frame-Options: DENY`, `frame-ancestors 'none'` | Clickjacking (embedding the app in another site) |
| `X-Content-Type-Options: nosniff` | MIME-type confusion |
| `Referrer-Policy: no-referrer` | Leaking the app's URL to other sites |
| `Permissions-Policy` (camera, mic, location, payment… all off) | Abuse of device features |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin` | Cross-origin attacks on the window and its files |
| `X-Robots-Tag: noindex` + `robots.txt` | The private app showing up in search engines |

The full app was tested end to end in a browser with these exact headers applied, with no blocked content.

## Automated checks (GitHub)
- **CI** (`.github/workflows/ci.yml`): lint, typecheck, 183 tests, relay SQL security tests on Postgres 16, `npm audit` (fails on high/critical issues in shipped dependencies) and a production build on every push.
- **CodeQL** (`.github/workflows/codeql.yml`): GitHub's code security scanner on every push to `main`, every PR and weekly.
- **Dependabot** (`.github/dependabot.yml`): weekly pull requests for dependency updates.

## Known, accepted advisories
`npm audit` reports 3 moderate advisories in `minimatch` (a slow regular expression) inside `@expo/fingerprint`, a **build-time Expo tool**. It is not part of the app that ships to browsers. npm's suggested fix downgrades Expo to an older major version, which is worse, so this is tracked until Expo updates the dependency (Dependabot will propose it).

## Keeping it private
The headers stop search engines from indexing the site, but anyone with the link can still open it. For a truly private link, turn on **Vercel → Project → Settings → Deployment Protection** (Vercel Authentication, or Password Protection on paid plans).

## Reporting
Found a problem? Open a private security advisory on the GitHub repository.
