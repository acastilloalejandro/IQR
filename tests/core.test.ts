import { describe, expect, it } from "vitest";
import { generateKeyPair, signCredential, verifyCredentialSignature } from "../src/crypto.js";
import { hashDocument } from "../src/hash.js";
import { offlineQrPayload, parseQrPayload } from "../src/qr.js";
import { verifyCredential } from "../src/verify.js";
import type { IqrCredential } from "../src/types.js";

describe("IQR core", () => {
  it("hashes with SHA-256", async () => {
    expect(await hashDocument(new TextEncoder().encode("hello"))).toBe(
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });

  it("signs and verifies", async () => {
    const keys = await generateKeyPair();
    const credential = await signCredential(
      {
        id: "test-1",
        type: "ContractCredential",
        issuer: "did:example:test",
        documentHash: await hashDocument(new TextEncoder().encode("document")),
        version: "1.0.0",
        status: "valid"
      },
      keys.secretKey,
      "did:example:test#key-1"
    );
    expect(await verifyCredentialSignature(credential)).toBe(true);
    credential.version = "2.0.0";
    expect(await verifyCredentialSignature(credential)).toBe(false);
  });

  it("round-trips an offline payload", async () => {
    const keys = await generateKeyPair();
    const credential: IqrCredential = await signCredential(
      {
        id: "test-qr",
        type: "CertificateCredential",
        issuer: "did:example:test",
        documentHash: await hashDocument(new TextEncoder().encode("certificate")),
        version: "1.0"
      },
      keys.secretKey,
      "did:example:test#key-1"
    );
    const parsed = parseQrPayload(offlineQrPayload(credential));
    expect(parsed.mode).toBe("offline");
    if (parsed.mode === "offline") expect(parsed.credential.id).toBe("test-qr");
  });

  it("rejects unknown issuers by default", async () => {
    const keys = await generateKeyPair();
    const credential = await signCredential(
      {
        id: "test-trust",
        type: "ContractCredential",
        issuer: "did:example:test",
        documentHash: await hashDocument(new TextEncoder().encode("document")),
        version: "1.0.0",
        status: "valid"
      },
      keys.secretKey,
      "did:example:test#key-1"
    );
    const result = await verifyCredential(credential);
    expect(result.status).toBe("invalid");
    expect(result.checks.issuer).toBe(false);
  });
});