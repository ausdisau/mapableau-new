# Data provenance

**Status:** Wave 9 Phase 32 — provenance tagging for portable and disclosed data.

Every external egress carries provenance: which directive authorised it, which receipt was minted, which fields were minimised, and which source system contributed each package field.

## Artefacts

| Artefact | Role |
|----------|------|
| `ConsentDirective` | Authority for future sharing |
| `ConsentReceipt` | Participant-auditable hash-chained receipt per directive version |
| `ConsentUseEvent` | Records each actual data use |
| `DisclosureManifest` | Single evidence trail for external egress (see [disclosure gateway](./disclosure-gateway.md)) |

FHIR `Provenance` mapping is available as a pure function; outbound FHIR is shell-only unless explicitly activated (see [FHIR consent mapping](./fhir-consent-mapping.md)).

## Implementation

- `lib/consent-v2/receipts.ts`, `lib/consent-v2/usage.ts`
- `lib/data-federation/disclosure-gateway.ts`
- `lib/interoperability/fhir/provenance-mapper.ts`

## See also

- [Consent receipts](./consent-receipts.md)
- [Wave 9 consent v2](./wave-9-consent-v2.md)

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
