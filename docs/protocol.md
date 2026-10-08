# IQR Profile

IQR is a profile, not a new cryptographic primitive.

## Online payload

Prefer a compact HTTPS URL:

`https://<trusted-verifier>/q/<opaque-id>`

The opaque identifier must not encode personal data.

## Offline payload

A compact signed credential may be carried directly using CBOR/COSE so verification can happen locally.

## Verification order

1. Parse safely.
2. Validate transport/origin policy.
3. Resolve the identifier.
4. Obtain credential/proof.
5. Verify proof.
6. Verify document hash where applicable.
7. Check credential status.
8. Evaluate time constraints.
9. Return a structured result.
10. Expose actions only after verification.
