# Personal Access Vault

The Personal Access Vault is a participant-controlled index of sensitive assets. It does not replace programme-specific records; it provides a portable, minimised view that the participant can export or share through RightsOS capsules and leases.

## Principles

- **Participant sovereignty:** Only the participant (or an authorised delegate via Decision Room) can add, remove, or export vault items.
- **Encryption at rest:** Vault payloads are encrypted before persistence. MapAble stores ciphertext and metadata only.
- **Minimisation:** The vault index lists asset types and field manifests — not full clinical or billing records unless explicitly placed there by the participant.
- **No silent sync:** Programme systems do not auto-populate the vault without an explicit participant action.

## Data model

| Model | Purpose |
| ----- | ------- |
| `PersonalVault` | One vault per participant |
| `PersonalVaultItem` | Indexed asset with encrypted payload reference |
| `VaultDevice` | Registered device for local decryption |
| `VaultExport` | Audit record of portability exports |

## Operations

1. **Register device** — binds a WebAuthn or passkey-capable device for local key unwrap.
2. **Add item** — participant selects an asset type and permitted fields; payload encrypted client-side where supported.
3. **Export manifest** — generates a portable JSON manifest without decrypting third-party programme data.
4. **Recovery** — assisted recovery path with human verification; break-glass support documented in pilot runbook.

## Feature flag

`MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED=true` (requires `MAPABLE_RIGHTSOS_ENABLED=true`)

## Scenario G (pilot)

Taylor exports a vault manifest before changing support coordinators. Recovery is tested with a second registered device and assisted recovery fallback.

## Related

- [ACCESS_CAPSULES.md](./ACCESS_CAPSULES.md) — time-limited disclosure from vault selections
- [THREAT_MODEL.md](./THREAT_MODEL.md) — vault breach mitigations
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) — recovery walkthrough
