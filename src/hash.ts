import { canonicalize } from "./canonical.js";
import { utf8 } from "./encoding.js";

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await sha256(bytes);
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashDocument(bytes: Uint8Array): Promise<string> {
  return "sha256:" + await sha256Hex(bytes);
}

export async function hashCanonical(value: unknown): Promise<string> {
  return hashDocument(utf8(canonicalize(value)));
}