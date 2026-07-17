# Portable export and import

**Status:** Wave 9 Phase 32 — participant-controlled portability. Not bulk tenant export.

Participants may export portable packages and promoted `PortableClaim` rows for use outside MapAble. Export flows require an active vault, matching consent directive, and disclosure gateway passage.

## Classification

```bash
pnpm federation:classify-portable-data --dry-run
```

Classifies `ParticipantDataPackage` rows and flags sensitive categories that must not leave the platform without explicit participant action.

## Import

Inbound portable data is treated as **self-asserted** until verified by a trusted issuer. Import does not automatically grant providers access — a new directive is required.

## See also

- [Cross-provider portability](./cross-provider-portability.md)
- [Data package catalogue](./data-package-catalogue.md)

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
