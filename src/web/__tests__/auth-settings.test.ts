import { parseAuthSettings } from "../supabase";
import { friendlyAuthError } from "../account";

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
    ["Email not confirmed", "This account isn’t confirmed yet."],
    ["Unsupported provider: provider is not enabled", "Google sign-in isn’t switched on yet."],
    ["Signups not allowed for this instance", "New sign-ups are closed for this app."],
  ])("%s", (raw, nice) => expect(friendlyAuthError(raw)).toBe(nice));
});

describe("never stuck loading", () => {
  it("gives up on a hanging request after the time limit", async () => {
    const { withTimeout } = await import("../account");
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow("timeout");
    await expect(withTimeout(Promise.resolve(5), 20)).resolves.toBe(5);
  });
});
