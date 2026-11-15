// Zero-knowledge cloud backup: progress is encrypted on the phone with a key
// derived from the account password, so the server only ever stores ciphertext.
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { fromBase64Url, open, randomBytes, seal, toBase64Url } from "./crypto";

export const VAULT_ITERATIONS = 200_000;

/** A new random salt for an account (stored next to the backup; not secret). */
export const newSalt = () => toBase64Url(randomBytes(16));

/** Turn the password into the backup key. Slow on purpose, to make guessing expensive. */
export function deriveVaultKey(password: string, salt: string, iterations = VAULT_ITERATIONS): string {
  const key = pbkdf2(sha256, new TextEncoder().encode(password), fromBase64Url(salt), { c: iterations, dkLen: 32 });
  return toBase64Url(key);
}

export const sealBackup = (key: string, state: unknown) => seal(key, { v: 1, state });

/** Returns the saved state, or throws if the key is wrong (e.g. password was reset). */
export function openBackup(key: string, blob: string): unknown {
  const data = open(key, blob) as { v?: number; state?: unknown };
  if (!data || data.v !== 1) throw new Error("Unsupported backup");
  return data.state;
}

export const MIN_PASSWORD = 8;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (/^\d+$/.test(password)) return "Mix in some letters, not only numbers.";
  if (password.length > 128) return "That's a bit long — 128 characters max.";
  return null;
}

export const emailProblem = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "That doesn't look like an email address.";
