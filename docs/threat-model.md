# Threat model

## Assets

The primary assets are document integrity, issuer authority, credential status and verifier decision context.

## Threats

- QR replacement or tampering.
- Modified documents with an unchanged QR.
- Forged credentials.
- Untrusted issuers.
- Stale or revoked credentials.
- Replay of security-sensitive presentations.
- Leakage of personal data through QR contents or logs.
- Malicious resolver URLs.

## Controls

IQR hashes documents, signs credentials, separates trust policy from cryptographic validity, supports status providers, and supports audience/nonce checks.

Web resolvers must use HTTPS in production and should apply an explicit allowlist of trusted resolver origins. Never turn a server-side resolver into an open proxy.

Inline public-key verification is restricted to development-style use in this reference implementation.
