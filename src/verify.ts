import { canonicalize } from "./canonical.js";
import { publicKeyFromJwk, verifyCredentialSignature } from "./crypto.js";
import { hashDocument } from "./hash.js";
import type { IqrCredential, IqrStatus, VerificationResult, VerifyOptions } from "./types.js";

const allowedStatuses = new Set<IqrStatus>(["valid", "suspended", "revoked", "expired", "unknown"]);

export async function verifyCredential(
  credential: IqrCredential,
  options: VerifyOptions = {}
): Promise<VerificationResult> {
  const now = options.now ?? new Date();
  const reasons: string[] = [];
  const warnings: string[] = [];

  const basic = Boolean(credential.id && credential.type && credential.issuer && credential.version && credential.proof);
  if (!basic) {
    return {
      status: "invalid",
      checks: { issuer: false, signature: false, integrity: false, status: false, expiry: false, audience: false, nonce: false },
      reasons: ["Missing required credential fields."],
      warnings,
      credential
    };
  }

  const trustedJwk = options.trustedIssuers?.[credential.issuer];
  const trustedKey = trustedJwk ? publicKeyFromJwk(trustedJwk) : undefined;
  const issuer = Boolean(trustedJwk) || Boolean(options.allowInlinePublicKey);
  if (!issuer) reasons.push("Issuer is not trusted by the configured registry.");

  let signature = false;
  try {
    signature = await verifyCredentialSignature(credential, trustedKey);
  } catch {
    signature = false;
  }
  if (!signature) reasons.push("Cryptographic signature is invalid.");

  let integrity = true;
  if (options.documentBytes) {
    const actual = await hashDocument(options.documentBytes);
    integrity = actual === credential.documentHash;
    if (!integrity) reasons.push("Document hash mismatch.");
  } else {
    warnings.push("No document bytes supplied; document integrity was not independently checked.");
  }

  let status: IqrStatus = credential.status ?? "unknown";
  if (!allowedStatuses.has(status)) status = "unknown";

  if (options.statusProvider) {
    const remote = await options.statusProvider(credential);
    if (remote) status = remote;
  } else if (status === "valid") {
    warnings.push("No external status source was queried; signed status may be stale.");
  }

  if (status === "revoked") reasons.push("Credential is revoked.");
  if (status === "suspended") reasons.push("Credential is suspended.");
  if (status === "expired") reasons.push("Credential status is expired.");

  let expiry = true;
  if (credential.expiresAt) {
    expiry = new Date(credential.expiresAt).getTime() >= now.getTime();
    if (!expiry) reasons.push("Credential has expired.");
  }

  const audience = options.expectedAudience ? credential.audience === options.expectedAudience : true;
  if (!audience) reasons.push("Audience mismatch.");

  const nonce = options.expectedNonce ? credential.nonce === options.expectedNonce : true;
  if (!nonce) reasons.push("Nonce mismatch.");

  const statusOk = status !== "revoked" && status !== "suspended" && status !== "expired";
  const strong = issuer && signature && integrity && statusOk && expiry && audience && nonce;

  let resultStatus: VerificationResult["status"] = "verified";
  if (status === "revoked") resultStatus = "revoked";
  else if (status === "suspended") resultStatus = "suspended";
  else if (status === "expired" || !expiry) resultStatus = "expired";
  else if (!strong) resultStatus = "invalid";
  else if (status === "unknown") resultStatus = "unknown";

  return {
    status: resultStatus,
    checks: { issuer, signature, integrity, status: statusOk, expiry, audience, nonce },
    reasons,
    warnings,
    credential
  };
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(JSON.parse(canonicalize(value)), null, 2);
}