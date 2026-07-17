# Participant access vault

**Status:** Wave 9 Phase 32 — design intent. Not government / not regulator-approved.

The `ParticipantAccessVault` is the participant's sovereignty control plane. It configures privacy defaults, external issuance opt-in, and recovery-policy version. It does **not** auto-activate — the participant must explicitly activate before any external disclosure or credential issuance is available.

## Behaviour

- `getOrDraftVault` creates a `draft` vault on first access; activation is a separate participant action.
- `externalIssuanceOptIn` gates credential offers and OID4VCI flows.
- Actual data lives in `ParticipantDataPackage`, credentials, and upstream domain models — the vault is a pointer, not a datastore.

## Implementation

- `lib/access-vault/vault.ts`
- UI: `/participant/vault`

## See also

- [Data package catalogue](./data-package-catalogue.md)
- [Wave 9 pack overview](./wave-9-participant-access-federation.md)
- [Wave 9 wallet](./wave-9-wallet.md)

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
