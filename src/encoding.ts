const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function utf8(value: string): Uint8Array {
  return encoder.encode(value);
}

export function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64urlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeCompact(value: unknown): string {
  return "iqr1." + base64urlEncode(utf8(JSON.stringify(value)));
}

export function decodeCompact<T>(value: string): T {
  if (!value.startsWith("iqr1.")) throw new Error("Unsupported IQR compact payload");
  return JSON.parse(decoder.decode(base64urlDecode(value.slice(5)))) as T;
}