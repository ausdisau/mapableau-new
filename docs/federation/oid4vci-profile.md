# OID4VCI profile

**Status:** Wave 9 Phase 32 — issuance shell. Simulator unless federation activated.

OpenID for Verifiable Credential Issuance adapter ships as a **shell**. Well-known issuer metadata advertises the simulator profile. Production issuance is refused unless `FEDERATION_ACTIVATION=true` and conformance has passed.

## Flow

1. Participant activates vault and opts into external issuance.
2. Platform creates `CredentialIssuanceOffer` (never silent auto-mint).
3. Participant accepts from wallet UI.
4. `IssuedCredential` is created (`simulator=true` by default).

`refuseProductionIssuance(ctx)` enforces the activation gate.

## See also

- [OID4VP profile](./oid4vp-profile.md)
- [MapAble VC profile](./mapable-vc-profile.md)
- [Wave 9 interoperability](./wave-9-interoperability.md)

## Implementation

- `lib/federation-conformance/oid4vci.ts`
- `lib/credentials/issuance.ts`

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
