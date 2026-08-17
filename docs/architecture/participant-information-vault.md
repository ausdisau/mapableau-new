# Participants Information Vault

**Status:** in development, flag off  
**Public claim:** none — not production-ready  
**Flag (default OFF):** `MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED`

This is a participant-owned **collection and sharing layer** over existing `Document` records. Landing this code does not make a production vault, encrypted locker, or national personal-data store.

## What this is

A participant can list artefacts they chose to keep in the vault, upload a file (when ObjectStore document flags are on), and share or revoke access with a purpose and expiry.

## What this is not

| Other surface | Relationship |
| --- | --- |
| `/data-vault` DSAR (`PersonalDataVaultRequest`) | Export, portability, and deletion **requests** with human review. Keep using that path. Do not duplicate it here. |
| `Document` + `ObjectStore` | File and byte sources of truth. The vault **joins** to `Document`; it does not store bytes. |
| Access Passport (Epic 02) | Functional access-needs profile. The vault must not show or edit passport data. |
| PR #281 PersonalVault / VaultDevice | Unlanded client-side encryption and device registry. **Deferred.** Do not import RightsOS vault DDL. |

## Architecture

```
Participant UI (/vault)
        |
        v
lib/privacy/participant-vault   (collection, share, revoke)
        |
        +-- Document                 (file SoT)
        +-- StoredAsset / ObjectStore (bytes, when document ObjectStore flags are on)
        +-- DocumentAccessGrant      (purpose-bound share)
        +-- ConsentRecord            (read-check when a matching grant already exists)
```

Canonical owners: see [DOMAIN_OWNERSHIP.md](../remediation/DOMAIN_OWNERSHIP.md).

## Flags

- `MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED=false` — vault APIs and `/vault` UI
- Vault **uploads** also require the care-document ObjectStore triple gate (`MAPABLE_OBJECT_STORAGE_ENABLED`, `MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED`, `DOCUMENT_STORAGE_MODE=object_store`) so Vercel ephemeral disk is not treated as a vault. If ObjectStore is off, the UI still lists items and shows that uploads are unavailable.

## Security

- Server builds storage keys; clients cannot supply bucket or path.
- Organisation-private care files cannot enter this vault.
- Share/revoke is owner-only. Recipients download through authorised `Document` read (`canAccessDocument`, including active `DocumentAccessGrant`).
- Rate limits are process-local (`lib/api/ip-rate-limit.ts`) and not multi-instance safe.
- Audit actions omit filenames as PII: `vault.item_added`, `vault.share_granted`, `vault.share_revoked`, `vault.item_removed`.

## Production blockers

- Malware scanning is a hook, not a production antivirus.
- No client-side encryption or VaultDevice registry.
- DSAR bundles remain JSON in Neon, not object storage.
- Do not enable flags in production without a human release review.
