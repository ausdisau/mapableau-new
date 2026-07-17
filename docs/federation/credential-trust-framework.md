# Credential trust framework

**Status:** Wave 9 Phase 32 — issuer/verifier trust registry. Not government trust anchor.

`CredentialTrustRegistryEntry` records which entities may issue or verify which schema keys. Trust is human-established — AI cannot add registry entries.

## Rules

- Every production credential flow requires a matching trust entry for issuer and verifier.
- MapAble is a platform issuer only; it is not a government or NDIS trust anchor.
- Simulator mode is the default until `FEDERATION_ACTIVATION=true` and conformance passes.

## Related

- [Credential schema registry](./credential-schema-registry.md)
- [Federation conformance](./federation-conformance.md)
- [Wave 9 credentials](./wave-9-credentials.md)

## Implementation

- `lib/credentials/trust.ts`
- `lib/federation-conformance/*`

## Threat model

[docs/security/credential-federation-threat-model.md](../security/credential-federation-threat-model.md)

## Non-negotiable disclaimers

- **Participant controls future sharing.** Withdrawal limits future use; it cannot erase all previously lawful processing.
- **Consent ≠ legal authority; relationship ≠ authority.** Delegates do not impersonate participants.
- **Self-asserted ≠ verified.**
- **MapAble credentials are not government credentials.** A generated credential does not prove government eligibility.
- **Accessibility preferences are not diagnoses.**
- **Selective disclosure minimises data.** A credential ≠ an access token.
- **DIDs are optional;** no public blockchain is required.
- **Wallet recovery must remain accessible** (with human safeguards for high-risk methods).
- **External interoperability requires conformance.** FHIR mapping may be lossy.
- **No AI may** grant consent, sign credentials, approve delegation, complete high-risk recovery, approve emergency access, or establish issuer trust.
