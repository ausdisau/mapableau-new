# Data package catalogue

**Status:** Wave 9 Phase 32 — participant-visible catalogue metadata. Not clinical records.

`ParticipantDataPackage` rows are high-level catalogue entries (e.g. accessibility preferences, service history summary). Each package stores metadata and a content hash — not PHI or free-text health data in the package row itself.

## Categories (illustrative)

| Key / category | Purpose |
|----------------|---------|
| `access_preferences` | Functional communication and access notes for the access passport |
| `service_history_summary` | Aggregated, participant-visible service engagement summary |
| `portable_claims` | Participant-promoted `PortableClaim` statements |

Packages roll up structured data from source systems so the participant can review what MapAble holds before sharing.

## Implementation

- `lib/access-vault/packages.ts`
- Classifier: `pnpm federation:classify-portable-data` (see [migration runbook](./wave-9-migration-runbook.md))

## See also

- [Data provenance](./data-provenance.md)
- [Portable export / import](./portable-export-import.md)
- [Wave 9 access passport](./wave-9-access-passport.md)

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
