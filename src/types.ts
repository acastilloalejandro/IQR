export type IqrStatus = "valid" | "suspended" | "revoked" | "expired" | "unknown";
export type VerificationStatus = "verified" | "invalid" | "revoked" | "suspended" | "expired" | "unknown";

export interface PublicKeyJwk {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
}

export interface IqrProof {
  type: "Ed25519Signature2020";
  created: string;
  verificationMethod: string;
  proofPurpose: "assertionMethod";
  publicKeyJwk: PublicKeyJwk;
  proofValue: string;
}

export interface IqrCredential {
  id: string;
  type: string;
  issuer: string;
  documentHash: string;
  version: string;
  issuedAt?: string;
  expiresAt?: string;
  status?: IqrStatus;
  audience?: string;
  nonce?: string;
  claims?: Record<string, unknown>;
  proof: IqrProof;
}

export interface VerificationChecks {
  issuer: boolean;
  signature: boolean;
  integrity: boolean;
  status: boolean;
  expiry: boolean;
  audience: boolean;
  nonce: boolean;
}

export interface VerificationResult {
  status: VerificationStatus;
  checks: VerificationChecks;
  reasons: string[];
  warnings: string[];
  credential: IqrCredential;
}

export interface VerifyOptions {
  expectedAudience?: string;
  expectedNonce?: string;
  documentBytes?: Uint8Array;
  now?: Date;
  allowInlinePublicKey?: boolean;
  trustedIssuers?: Record<string, PublicKeyJwk>;
  statusProvider?: (credential: IqrCredential) => Promise<IqrStatus | null>;
}