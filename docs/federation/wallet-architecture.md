# Wallet architecture

**Status:** Wave 9 Phase 32 — participant wallet scaffold. Not a government digital ID wallet.

The `ParticipantWallet` holds opaque key references, device bindings, and recovery policy metadata. Raw private key bytes are never stored in application storage.

## Components

| Component | Role |
|-----------|------|
| `WalletKeyReference` | Opaque pointer to key material (KMS / device secure element) |
| `WalletDevice` | Trust-scored device bindings; revocable without destroying wallet |
| `WalletRecoveryPolicy` | Participant-configured recovery methods |
| `WalletRecoveryEvent` | Audited recovery attempts |

Activation is participant-initiated only (`activateWallet`). DIDs are optional; no public blockchain is required.

Full detail: [wave-9-wallet.md](./wave-9-wallet.md). Recovery: [wallet-recovery.md](./wallet-recovery.md).

## Implementation

- `lib/wallet/accounts.ts`, `storage.ts`, `keys.ts`, `devices.ts`, `backup.ts`

## Threat model

[docs/security/wallet-threat-model.md](../security/wallet-threat-model.md)

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
