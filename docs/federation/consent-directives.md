# Consent directives

**Status:** Wave 9 Phase 32 — immutable consent layer. Not legal advice.

Wave 9 adds `ConsentDirective` as an append-only layer above legacy `ConsentRecord`. Revocation creates a new `withdrawn` version; history is never mutated in place.

## Lifecycle

`granted → active → withdrawn` (or `expired`). Transitions only via new versions linked by `supersedesId`.

## Coexistence

- Legacy `ConsentRecord` remains for scope-based gates.
- New writes go through `writeConsentDirective`; optional mirror into `ConsentRecord` for compatibility.
- `checkConsent` is hardened to fail closed when grantee is omitted or a withdrawn directive exists.

Full detail: [wave-9-consent-v2.md](./wave-9-consent-v2.md).

## Implementation

- `lib/consent-v2/directives.ts`, `evaluation.ts`, `revocation.ts`, `compat.ts`

## See also

- [Consent receipts](./consent-receipts.md)
- [FHIR consent mapping](./fhir-consent-mapping.md)

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
