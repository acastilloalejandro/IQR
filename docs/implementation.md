# IQR Implementation

IQR is a reference implementation for verifiable QR documents.

## Included

- SHA-256 document hashing.
- Deterministic canonical JSON signing input.
- Ed25519 signatures.
- Trusted issuer registry.
- Development-only inline public-key mode.
- Online HTTPS QR payloads.
- Offline compact payloads.
- SVG and Data URI QR generation.
- HTTP and memory resolvers.
- Structured verification results.
- Expiry, audience and nonce checks.
- External status provider hook.
- CLI and browser verifier.
- Unit tests and CI.

## Trust boundary

A mathematically valid signature is not sufficient to establish trust. Production deployments must define an issuer trust policy.

Inline public-key mode is intended for demos and test vectors.

The offline profile currently uses compact JSON. CBOR/COSE should be added as an adapter only after independent test vectors and interoperability validation exist.
