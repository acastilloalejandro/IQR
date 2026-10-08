import { canonicalize } from "./canonical.js";
import { utf8 } from "./encoding.js";

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", input.buffer);
  return new Uint8Array(digest);
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