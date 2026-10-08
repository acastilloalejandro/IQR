# Architecture

IQR treats QR as a carrier, not as the trust system.

## Layers

1. Carrier: QR Code and optional NFC.
2. Resolution: stable opaque identifier.
3. Credential: claims about an object, document, issuer, or event.
4. Proof: cryptographic integrity and issuer authority.
5. Status: valid, suspended, revoked, expired, or unknown.
6. Presentation: minimum information needed by the verifier.
7. Action: privileged actions only after successful verification.

Flow:

physical artifact → QR/NFC → resolver → credential → proof → status → verification → action
