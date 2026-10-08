# IQR

**IQR — Intelligent / Integrity QR infrastructure**

A reference implementation for verifiable QR codes connecting physical documents and objects to trustworthy digital verification.

## What is implemented

IQR now provides:

- SHA-256 document hashing.
- Deterministic canonical JSON for signing.
- Ed25519 signing and verification.
- Trusted issuer registry support.
- Development-only inline public-key verification.
- Online HTTPS QR payloads.
- Offline compact QR payloads.
- SVG and Data URI QR generation.
- HTTP and memory resolvers.
- Expiry, audience and nonce validation.
- External status-provider integration.
- Structured verification results.
- TypeScript SDK.
- CLI reference implementation.
- Browser verifier.
- Automated build, test and web-build CI.

## Architecture

```
physical document
      │
      ├── SHA-256 hash
      ├── issuer
      ├── version / time
      └── credential + proof
               │
               ▼
          QR / NFC carrier
               │
       ┌───────┴────────┐
       ▼                ▼
   online URL       offline payload
       │                │
       ▼                ▼
     resolver       local parser
       │                │
       └───────┬────────┘
               ▼
        cryptographic check
               │
        issuer / integrity
        status / expiry
        audience / nonce
               │
               ▼
        structured result
               │
               ▼
             action
```

## Quick start

`npm install`

`npm run build`

`npm test`

Create a demo credential:

`npm run cli -- create-demo demo-credential.json`

Generate an SVG QR:

`npm run cli -- qr-offline demo-credential.json iqr.svg`

Verify a credential:

`npm run cli -- verify demo-credential.json`

Launch the browser verifier:

`npm run dev:web`

## Design rule

The QR is a **carrier**, not the trust root.

IQR deliberately keeps trust policy, cryptographic verification, document integrity and status resolution as separate layers.

## Production boundary

The current offline carrier is compact JSON. It is not presented as a COSE/CBOR implementation.

Inline public keys are for demonstrations and test vectors. Production deployments should pin issuer keys through a controlled trust registry.

A production resolver should also implement a real revocation or suspension source and explicit privacy/logging policy.

## Standards direction

The architecture is designed to map cleanly toward W3C Verifiable Credentials, W3C Data Integrity, Bitstring Status List, OpenID4VC, CBOR/COSE, QR Code and NFC profiles without creating a competing cryptographic standard.

## Repository status

**v0.2.0 — executable reference implementation.**
