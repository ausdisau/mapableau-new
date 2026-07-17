# Wallet recovery

**Status:** Wave 9 Phase 32 — recovery flows. High-risk methods require human review.

Recovery must remain accessible to the participant while resisting impersonation. Supported methods include passkey backup, quorum-guardian, offline paper kit, and operator-assisted flows.

## Risk tiers

| Method | Review |
|--------|--------|
| Passkey backup | Participant-only |
| Guardian quorum | Participant + guardians |
| Offline paper kit | Human reviewer for activation |
| Operator-assisted | Human `reviewerId` required; AI reviewers refused |

Every recovery attempt writes a `WalletRecoveryEvent`. AI cannot complete high-risk recovery or approve recovery on behalf of the participant.

## Test script

```bash
pnpm federation:test-wallet-recovery
```

## See also

- [Wallet architecture](./wallet-architecture.md)
- [Wave 9 wallet](./wave-9-wallet.md)

## Implementation

- `lib/wallet/recovery.ts`

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
