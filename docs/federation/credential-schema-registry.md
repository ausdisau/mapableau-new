# Credential schema registry

**Status:** Wave 9 Phase 32 — schema definitions. Not government credential catalogue.

`CredentialSchemaDefinition` defines attribute shapes MapAble is willing to issue. `isGovernment` is always `false`. Prohibited keys refuse creation at write time:

`NDISParticipantCredential`, `NDISWorkerCredential`, `MedicalDiagnosisCredential`, `DisabilityCredential`, `DriverLicenceCredential`, `MedicareCredential`, `PassportCredential`.

## Issuance rule

Every credential is an **offer** first (`CredentialIssuanceOffer`). Silent auto-mint is blocked by `refuseAutoIssue()`.

## Audit

```bash
pnpm federation:audit-credential-eligibility
```

## See also

- [MapAble VC profile](./mapable-vc-profile.md)
- [Wave 9 credentials](./wave-9-credentials.md)

## Implementation

- `lib/credentials/schemas.ts`

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
