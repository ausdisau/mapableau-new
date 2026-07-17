# Threat model — Participant Wallet (Wave 9)

Status: Wave 9. Non-regulator. Amber disclaimer applies.

## Assets

- Opaque wallet key references (`WalletKeyReference`) — never contain raw
  private key bytes.
- Device bindings (`WalletDevice`) — the set of hardware that can operate
  the wallet.
- Recovery policy and recovery events.

## Adversaries

- **Compromised device.** An attacker obtains an active device.
- **Compromised staff account.** A MapAble operator tries to seize a
  participant's wallet.
- **Impersonation via recovery.** An attacker tries the recovery flow.
- **AI-driven mistake.** An AI agent tries to activate a wallet or approve
  recovery without a human.

## Controls

- **Never auto-activate.** `activateWallet` requires participant action.
- **Opaque key refs only.** Raw key bytes are outside application storage.
- **Device revocation** is separate from wallet destruction. Losing a
  device does not destroy history.
- **High-risk recovery** (operator-assisted, guardian-shard, offline paper
  kit) requires a human `reviewerId`. AI reviewers are refused.
- **Audit every event.** Recovery requests / approvals write audit rows.

## Residual risk

- Endpoint key material still lives in the participant's device secure
  element / KMS. Wave 9 does not attest to those platforms.
- Guardian quorum trust depends on the participant choosing sensible
  guardians.

## References

- `lib/wallet/accounts.ts`, `lib/wallet/recovery.ts`, `lib/wallet/devices.ts`
