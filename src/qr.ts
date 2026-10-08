import QRCode from "qrcode";
import { decodeCompact, encodeCompact } from "./encoding.js";
import type { IqrCredential } from "./types.js";

export function onlineQrPayload(id: string, verifierBaseUrl: string): string {
  return verifierBaseUrl.replace(/\/$/, "") + "/q/" + encodeURIComponent(id);
}

export function offlineQrPayload(credential: IqrCredential): string {
  return encodeCompact(credential);
}

export async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 3,
    width: 640
  });
}

export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 3,
    width: 640
  });
}

export function parseQrPayload(payload: string):
  | { mode: "offline"; credential: IqrCredential }
  | { mode: "online"; url: URL } {
  if (payload.startsWith("iqr1.")) {
    return { mode: "offline", credential: decodeCompact<IqrCredential>(payload) };
  }
  return { mode: "online", url: new URL(payload) };
}