# Cross-provider portability

**Status:** Wave 9 Phase 32 — federation without cross-tenant data leakage.

Federation membership on an `Organisation` grants governance and discovery rights — it does **not** grant access to participant data. Cross-provider portability requires:

1. Participant-activated vault.
2. Active `ConsentDirective` for the recipient category.
3. `discloseParticipantData` with minimisation and receipt.
4. Pairwise subject identifier for the receiving entity.

External interoperability requires conformance (`pnpm federation:conformance`) before production credential or FHIR flows activate.

## Tenant boundary

Wave 8 `Organisation.id` tenant isolation is unchanged. All cross-tenant participant data crosses only via the disclosure gateway.

## See also

- [Portable export / import](./portable-export-import.md)
- [Disclosure gateway](./disclosure-gateway.md)
- [Wave 9 architecture](./wave-9-architecture-and-gap-analysis.md) §5

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
