import { randomBytes, createHash } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A short code a person can read aloud without ambiguity. */
export function readableCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** A long opaque segment for URLs that stand in for a password. */
export function urlSecret(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
