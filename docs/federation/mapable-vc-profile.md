# MapAble VC profile

**Status:** Wave 9 Phase 32 — W3C VC Data Model 2.0 syntactic profile. Simulator by default.

MapAble credentials use W3C VC Data Model 2.0 envelope semantics (context, type, issuer, credentialSubject, proof placeholder). Syntactic validation lives in `lib/federation-conformance/vc-data-model.ts`; signature verification is out of scope for Wave 9 shells.

## Profile constraints

- Issuer is always the MapAble platform (or a registered federation partner with a trust entry).
- `credentialSubject` uses pairwise identifiers — never raw `User.id`, email, or NDIS number (see [pairwise identifiers](./pairwise-identifiers.md)).
- Default `simulator=true` on `IssuedCredential` until federation activation.
- Presentations are selective — see [selective disclosure](./selective-disclosure.md).

## OID profiles

- Issuance: [oid4vci-profile.md](./oid4vci-profile.md)
- Presentation: [oid4vp-profile.md](./oid4vp-profile.md)

## See also

- [Wave 9 credentials](./wave-9-credentials.md)
- [Wave 9 interoperability](./wave-9-interoperability.md)

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
