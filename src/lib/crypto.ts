// Small, audited primitives for the serverless couple link.
// - XChaCha20-Poly1305 (authenticated encryption) from @noble/ciphers
// - PBKDF2-SHA256 for PIN hashing from @noble/hashes
// Nothing here talks to a network.
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as ExpoCrypto from "expo-crypto";

export const KEY_BYTES = 32;
const NONCE_BYTES = 24;
export const PIN_ITERATIONS = 120_000;

/** Cryptographically secure random bytes on web, native and in tests. */
export function randomBytes(n: number): Uint8Array {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(new Uint8Array(n));
  return ExpoCrypto.getRandomBytes(n);
}

// ---- base64url (no padding), works without Buffer/atob ----
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const LOOKUP = new Map([...ALPHABET].map((ch, i) => [ch, i]));

export function toBase64Url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chunk = [(n >> 18) & 63, (n >> 12) & 63, (n >> 6) & 63, n & 63].map((x) => ALPHABET[x]).join("");
    out += chunk.slice(0, bytes.length - i >= 3 ? 4 : bytes.length - i + 1);
  }
  return out;
}

export function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) throw new Error("Invalid base64url");
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const chars = text.slice(i, i + 4);
    const v = [...chars].map((ch) => LOOKUP.get(ch)!);
    const n = (v[0] << 18) | (v[1] << 12) | ((v[2] ?? 0) << 6) | (v[3] ?? 0);
    out.push((n >> 16) & 255);
    if (chars.length > 2) out.push((n >> 8) & 255);
    if (chars.length > 3) out.push(n & 255);
  }
  return new Uint8Array(out);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export const newKey = () => toBase64Url(randomBytes(KEY_BYTES));
export const newId = (bytes = 12) => toBase64Url(randomBytes(bytes));

function keyBytes(key: string): Uint8Array {
  const k = fromBase64Url(key);
  if (k.length !== KEY_BYTES) throw new Error("Invalid key");
  return k;
}

/** Encrypt a JSON value. Output: base64url(nonce ‖ ciphertext+tag). */
export function seal(key: string, value: unknown): string {
  const nonce = randomBytes(NONCE_BYTES);
  const ct = xchacha20poly1305(keyBytes(key), nonce).encrypt(encoder.encode(JSON.stringify(value)));
  const out = new Uint8Array(nonce.length + ct.length);
  out.set(nonce);
  out.set(ct, nonce.length);
  return toBase64Url(out);
}

/** Decrypt and parse. Throws if the key is wrong or the data was tampered with. */
export function open(key: string, sealed: string): unknown {
  const bytes = fromBase64Url(sealed);
  if (bytes.length < NONCE_BYTES + 16) throw new Error("Too short");
  const pt = xchacha20poly1305(keyBytes(key), bytes.slice(0, NONCE_BYTES)).decrypt(bytes.slice(NONCE_BYTES));
  return JSON.parse(decoder.decode(pt));
}

// ---- PIN lock ----
export type PinHash = { salt: string; hash: string; iterations: number };

export function hashPin(pin: string, iterations = PIN_ITERATIONS, salt = toBase64Url(randomBytes(16))): PinHash {
  const dk = pbkdf2(sha256, encoder.encode(pin), fromBase64Url(salt), { c: iterations, dkLen: 32 });
  return { salt, hash: toBase64Url(dk), iterations };
}

/** Constant-time comparison so the check doesn't leak how many characters matched. */
export function verifyPin(pin: string, stored: PinHash): boolean {
  const candidate = hashPin(pin, stored.iterations, stored.salt).hash;
  if (candidate.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  return diff === 0;
}

export const isValidPin = (pin: string) => /^\d{4,8}$/.test(pin);
