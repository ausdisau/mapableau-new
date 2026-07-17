# FHIR consent mapping

**Status:** Wave 9 Phase 32 — pure mapper shell. No live outbound FHIR.

`ConsentDirective` maps to FHIR `Consent` and `DisclosureManifest` maps to FHIR `Provenance` via pure functions. **FHIR mapping may be lossy** — not every MapAble field has a FHIR equivalent.

Outbound FHIR calls are refused unless `FEDERATION_FHIR_OUTBOUND_ENABLED=true` and a signed conformance record exists (`fhir-adapter-shell.ts`).

## Mappers

- `lib/interoperability/fhir/consent-mapper.ts`
- `lib/interoperability/fhir/provenance-mapper.ts`
- `lib/interoperability/fhir/fhir-adapter-shell.ts`

## See also

- [Wave 9 interoperability](./wave-9-interoperability.md)
- [Data provenance](./data-provenance.md)
- [Federation conformance](./federation-conformance.md)

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
