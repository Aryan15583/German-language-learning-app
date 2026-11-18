// Safe pairing (v2). The 6-letter code only *authenticates* the pairing: the chat key itself comes
// from an X25519 key exchange, so someone who sees the code later (e.g. in a WhatsApp history)
// can't work out the key — they'd only ever see public keys.
import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { fromBase64Url, toBase64Url } from "./crypto";

export const PAIR_PROTO = 2;

export type DhPair = { secret: string; pub: string };

export function newDhPair(): DhPair {
  const secret = x25519.utils.randomSecretKey();
  return { secret: toBase64Url(secret), pub: toBase64Url(x25519.getPublicKey(secret)) };
}

export const isDhPub = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9_-]{43}$/.test(x) && fromBase64Url(x).length === 32;

/**
 * The couple key both phones arrive at. Mixes in the code key, so a man-in-the-middle also
 * needs the code at pairing time; and the safety code below catches even that.
 */
export function coupleKeyFromDh(mySecret: string, theirPub: string, codeKey: string, creatorPub: string, joinerPub: string): string {
  const shared = x25519.getSharedSecret(fromBase64Url(mySecret), fromBase64Url(theirPub));
  if (shared.every((b) => b === 0)) throw new Error("bad key");
  const info = new TextEncoder().encode(`zh-couple-v2|${creatorPub}|${joinerPub}`);
  return toBase64Url(hkdf(sha256, shared, fromBase64Url(codeKey), info, 32));
}

/** 12 digits both phones show; if they match, nobody sat in the middle of your pairing. */
export function safetyCode(coupleKey: string): string {
  const h = sha256(new TextEncoder().encode(`zh-safety-v1|${coupleKey}`));
  let n = 0n;
  for (let i = 0; i < 8; i++) n = (n << 8n) | BigInt(h[i]);
  return (n % 1_000_000_000_000n).toString().padStart(12, "0").replace(/(\d{4})(?=\d)/g, "$1 ");
}
