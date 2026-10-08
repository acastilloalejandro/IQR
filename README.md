# IQR

**IQR — Intelligent / Integrity QR infrastructure**

A standards-oriented foundation for verifiable QR codes that connect physical documents and objects with trustworthy digital verification.

## Vision

IQR treats the QR code as a **carrier**, not as the trust system itself:

`physical artifact → QR/NFC → resolver → credential → cryptographic verification → status → action`

The design prioritizes interoperability, privacy, integrity, offline capability, and cryptographic agility.

## Architecture

```
Document / Object
      │
      ├── documentHash (SHA-256)
      ├── issuer
      ├── version
      ├── timestamps
      └── credential / proof
             │
             ▼
       QR / NFC carrier
             │
             ▼
          Resolver
        ┌────┼────┐
        ▼    ▼    ▼
      Issuer Hash Status
        │    │    │
        └────┼────┘
             ▼
        Verification
             │
             ▼
   Authentic · Intact · Current
```

## Compatibility targets

- W3C Verifiable Credentials
- W3C Data Integrity
- Bitstring Status List
- OpenID for Verifiable Credentials
- CBOR / COSE for compact payloads
- ISO/IEC 18004 QR Code
- NFC / ISO 14443
- HTTPS and standard web clients

IQR should not become a competing closed protocol. It defines a practical profile and implementation architecture around open standards.

## Security principles

1. Never place secrets or unnecessary personal data in a QR.
2. Treat the QR as untrusted input until verification succeeds.
3. Verify issuer authenticity and document integrity independently.
4. Support revocation / suspension / expiry.
5. Prevent replay where an operation is security-sensitive.
6. Keep cryptographic algorithms replaceable.
7. Prefer selective disclosure where the credential model supports it.
8. Provide clear failure states instead of a binary “looks legitimate” UI.

## Repository status

Early architecture / reference implementation.

See `docs/` and `spec/` for the evolving profile.
