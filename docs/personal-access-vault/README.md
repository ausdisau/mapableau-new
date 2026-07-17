# MapAble Personal Access Vault

Short name: **MapAble Vault**

Participant-controlled information, portability, privacy and capability layer for the MapAble ecosystem. The Vault **minimises copying**: it stores references, field manifests, capabilities, policy contracts, provenance, versions and receipts. Canonical MapAble systems keep authoritative operational records.

## Principles

- Not a second identity, consent, Access Passport, or AURA Memory store
- Essential MapAble services remain usable without advanced Vault features
- Encryption is custodial unless participant-held keys are proven accessible — never claim end-to-end falsely
- Deletion and recipient attestation have honest technical limits
- Server-side feature flags only; browser parameters cannot enable enforcement

## Operating modes

| Mode | Behaviour |
| ---- | --------- |
| `demo` | Synthetic fixtures only |
| `shadow` | Index and simulate; no sharing change |
| `supervised` | Selected categories with officer review |
| `production` | Category-by-category activation |

## Docs in this folder

- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CANONICAL_DATA_ROUTING.md](./CANONICAL_DATA_ROUTING.md)
- [ITEM_TAXONOMY.md](./ITEM_TAXONOMY.md)
- [ENCRYPTION.md](./ENCRYPTION.md)
- [KEY_MANAGEMENT.md](./KEY_MANAGEMENT.md)
- [DEVICE_TRUST.md](./DEVICE_TRUST.md)
- [RECOVERY.md](./RECOVERY.md)
- [OFFLINE.md](./OFFLINE.md)
- [SYNC_AND_CONFLICTS.md](./SYNC_AND_CONFLICTS.md)
- [CAPABILITY_LEASES.md](./CAPABILITY_LEASES.md)
- [SELECTIVE_DISCLOSURE.md](./SELECTIVE_DISCLOSURE.md)
- [PORTABILITY.md](./PORTABILITY.md)
- [DELETION_AND_REVOCATION.md](./DELETION_AND_REVOCATION.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [PRIVACY_IMPACT.md](./PRIVACY_IMPACT.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md)
- [ROLLBACK.md](./ROLLBACK.md)

## Code

- `lib/vault/` — config, router, taxonomy, registry, nutrition labels, ledger, devices, capabilities, disclosure, recovery, portability
- `app/vault/` — participant UI
- `app/api/vault/` — APIs
- `data/vault/` — purpose/field registries for shadow disclosure

## Related (not the same product)

- Civic personal data vault: `/data-vault`, `PersonalDataVaultRequest`, `lib/personal-data-vault/`
- Consent: `ConsentRecord`, `/dashboard/consent`
- RightsOS / Capsules (unmerged branches): compose with Vault; do not duplicate
