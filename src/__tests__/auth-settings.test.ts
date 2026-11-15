import { parseAuthSettings } from "../lib/supabase";
import { friendlyAuthError } from "../state/account";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("auth settings", () => {
  it("reads whether Google is on and sign-ups are open", () => {
    expect(parseAuthSettings({ external: { google: true, email: true }, disable_signup: false })).toEqual({ google: true, signupOpen: true });
    expect(parseAuthSettings({ external: { google: false }, disable_signup: true })).toEqual({ google: false, signupOpen: false });
  });

  it("is cautious with missing or odd data", () => {
    expect(parseAuthSettings(null)).toEqual({ google: false, signupOpen: true });
    expect(parseAuthSettings({ external: { google: "yes" } })).toEqual({ google: false, signupOpen: true });
  });
});

describe("friendly auth errors", () => {
  it.each([
    ["Invalid login credentials", "Wrong email or password."],
    ["Email not confirmed", "Please confirm your email first — check your inbox (and spam)."],
    ["Unsupported provider: provider is not enabled", "Google sign-in isn’t switched on yet."],
    ["Signups not allowed for this instance", "New sign-ups are closed for this app."],
  ])("%s", (raw, nice) => expect(friendlyAuthError(raw)).toBe(nice));
});
