# Wave 9 — Participant Wallet

Status: Wave 9 scaffold. Wallet activation is participant-initiated only.

## What the wallet holds

- Opaque references to key material — MapAble never stores raw private key
  bytes in application storage. See `lib/wallet/storage.ts`.
- Device bindings (`WalletDevice`) — devices are trust-scored and can be
  revoked without destroying the wallet.
- Recovery policy (`WalletRecoveryPolicy`) — participant-configured; the
  wallet supports quorum-guardian, offline paper kit, passkey backup and
  operator-assisted flows.
- Recovery events (`WalletRecoveryEvent`) — every recovery attempt is
  audited. High-risk methods require a human reviewer; AI cannot approve.

## Activation

`activateWallet(participantId)` transitions `provisioning → active`. Wave 9
never auto-activates a wallet — the participant must click through the
`/participant/vault/wallet` UI.

## Files

- `lib/wallet/accounts.ts`
- `lib/wallet/storage.ts`
- `lib/wallet/keys.ts`
- `lib/wallet/recovery.ts`
- `lib/wallet/devices.ts`
- `lib/wallet/backup.ts`

## Threat model

See `docs/security/wallet-threat-model.md`.
