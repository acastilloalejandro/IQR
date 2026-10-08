import * as ed from "@noble/ed25519";
import { base64urlDecode, base64urlEncode, utf8 } from "./encoding.js";
import { canonicalize } from "./canonical.js";
import type { IqrCredential, IqrProof, PublicKeyJwk } from "./types.js";

export interface Ed25519KeyPair {
  secretKey: Uint8Array;
  publicKey: Uint8Array;
}

export async function generateKeyPair(): Promise<Ed25519KeyPair> {
  const secretKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(secretKey);
  return { secretKey, publicKey };
}

export function publicKeyJwk(publicKey: Uint8Array): PublicKeyJwk {
  return { kty: "OKP", crv: "Ed25519", x: base64urlEncode(publicKey) };
}

export function publicKeyFromJwk(jwk: PublicKeyJwk): Uint8Array {
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519") throw new Error("Unsupported public key");
  return base64urlDecode(jwk.x);
}

function signingView(credential: IqrCredential): IqrCredential {
  const clone = JSON.parse(JSON.stringify(credential)) as IqrCredential;
  clone.proof.proofValue = "";
  return clone;
}

export async function signCredential(
  credential: Omit<IqrCredential, "proof">,
  secretKey: Uint8Array,
  verificationMethod: string
): Promise<IqrCredential> {
  const publicKey = await ed.getPublicKeyAsync(secretKey);
  const proof: IqrProof = {
    type: "Ed25519Signature2020",
    created: new Date().toISOString(),
    verificationMethod,
    proofPurpose: "assertionMethod",
    publicKeyJwk: publicKeyJwk(publicKey),
    proofValue: ""
  };
  const unsigned = { ...credential, proof };
  const signature = await ed.signAsync(utf8(canonicalize(signingView(unsigned))), secretKey);
  proof.proofValue = base64urlEncode(signature);
  return { ...credential, proof };
}

export async function verifyCredentialSignature(
  credential: IqrCredential,
  publicKey?: Uint8Array
): Promise<boolean> {
  const key = publicKey ?? publicKeyFromJwk(credential.proof.publicKeyJwk);
  const signature = base64urlDecode(credential.proof.proofValue);
  return ed.verifyAsync(signature, utf8(canonicalize(signingView(credential))), key);
}