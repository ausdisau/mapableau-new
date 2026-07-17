# Accessibility passport

**Status:** Wave 9 Phase 32 — functional preferences summary. Not a diagnosis.

The access passport compiles participant-chosen functional preferences ("prefers written communication", "needs step-free entry"). **Accessibility preferences are not diagnoses** — prohibited claims about diagnosis, NDIS eligibility, medical treatment, or disability status are refused at `lib/access-passport/claims.ts`.

Self-asserted portable claims are not verified clinical facts unless separately attested by an authorised issuer.

Full detail: [wave-9-access-passport.md](./wave-9-access-passport.md).

## See also

- [Emergency access](./emergency-access.md)
- [Data package catalogue](./data-package-catalogue.md)

## Implementation

- `lib/access-passport/profile.ts`, `claims.ts`, `presentation.ts`

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
