# Device Trust

`VaultDevice` is distinct from login `TrustedDevice` / passkeys.

Enrolment: authenticate → step-up → register device public key → select offline categories → server policy → device-scoped capabilities → audit.

Lost device: mark lost → revoke capabilities → block sync → rotate wraps if required → explain remote wipe limits → ledger.

Flag: `MAPABLE_VAULT_DEVICE_TRUST_ENABLED`.
