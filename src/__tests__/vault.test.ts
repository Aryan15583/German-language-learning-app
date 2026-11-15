import { deriveVaultKey, emailProblem, newSalt, openBackup, passwordProblem, sealBackup } from "../lib/vault";

describe("vault", () => {
  const salt = newSalt();

  it("derives the same key from the same password and salt", () => {
    expect(deriveVaultKey("liebe-berlin", salt, 1000)).toBe(deriveVaultKey("liebe-berlin", salt, 1000));
  });

  it("derives different keys for different passwords or salts", () => {
    const k = deriveVaultKey("liebe-berlin", salt, 1000);
    expect(deriveVaultKey("liebe-berlin!", salt, 1000)).not.toBe(k);
    expect(deriveVaultKey("liebe-berlin", newSalt(), 1000)).not.toBe(k);
  });

  it("round-trips a backup and hides its contents", () => {
    const key = deriveVaultKey("liebe-berlin", salt, 1000);
    const state = { partners: [{ name: "Shreya", xp: 120 }], chat: [{ text: "Ich liebe dich" }] };
    const blob = sealBackup(key, state);
    expect(blob).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(blob).not.toMatch(/Shreya|liebe/i);
    expect(openBackup(key, blob)).toEqual(state);
  });

  it("can't be opened with a wrong password", () => {
    const blob = sealBackup(deriveVaultKey("liebe-berlin", salt, 1000), { a: 1 });
    expect(() => openBackup(deriveVaultKey("wrong-password", salt, 1000), blob)).toThrow();
  });

  it("salts are random and match the database rule", () => {
    const a = newSalt();
    expect(a).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(newSalt()).not.toBe(a);
  });
});

describe("account input checks", () => {
  it.each([
    ["short", "Use at least 8 characters."],
    ["12345678", "Mix in some letters, not only numbers."],
    ["x".repeat(129), "That's a bit long — 128 characters max."],
  ])("rejects %s", (pw, why) => expect(passwordProblem(pw)).toBe(why));

  it("accepts a decent password", () => expect(passwordProblem("zwei-herzen-2026")).toBeNull());

  it("checks email shape", () => {
    expect(emailProblem("shreya@example.com")).toBeNull();
    expect(emailProblem(" shreya@example.com ")).toBeNull();
    expect(emailProblem("shreya@")).not.toBeNull();
    expect(emailProblem("no spaces@example.com")).not.toBeNull();
  });
});
