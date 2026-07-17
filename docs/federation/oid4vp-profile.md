# OID4VP profile

**Status:** Wave 9 Phase 32 — presentation shell. Participant review required.

OpenID for Verifiable Presentations adapter mirrors the issuance shell. Verifier-initiated `CredentialPresentationRequest` flows require participant review before a `CredentialPresentation` is minted.

## Flow

1. Verifier submits presentation request (must be in trust registry).
2. Participant reviews requested claims in wallet UI.
3. Gateway applies selective disclosure and writes `DisclosureManifest`.
4. Presentation is minted with minimised `disclosedClaims` only.

`refuseProductionPresentation(ctx)` blocks production until `FEDERATION_ACTIVATION=true`.

A credential presentation is **not** an OAuth access token — it is a one-time, purpose-bound disclosure artefact.

## See also

- [OID4VCI profile](./oid4vci-profile.md)
- [Selective disclosure](./selective-disclosure.md)
- [Disclosure gateway](./disclosure-gateway.md)

## Implementation

- `lib/federation-conformance/oid4vp.ts`
- `lib/credentials/presentation.ts`

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
