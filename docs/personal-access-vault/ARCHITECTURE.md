# Architecture — Hybrid Capability Vault

**Target:** Option C — Hybrid Capability Vault  
**Initial:** shadow / reference-only  
**Fallback:** ConsentRecord + VisitPlanShare + civic `/data-vault` with all `MAPABLE_VAULT_*` flags off

## Trust boundaries

1. **Participant device** — optional local subset; offline drafts only
2. **MapAble control plane** — registry, policy, audit; custodial decrypt for vault-native items
3. **Canonical domains** — authoritative writes (AccessibilityProfile, Access Passport, AURA Memory, CareOSMission, ConsentRecord, Document)
4. **Recipient organisation** — Capsule / disclosure view only
5. **Partner KMS** (Wave 6+) — DEK wrapping; Australian residency preferred

## Pillars (one control plane)

Canonical Router → Item Registry → (optional) Encrypted Store → Device Trust → Capability Broker → Selective Disclosure → Capsules → Delegation → Recovery → Portability → Deletion → Ledger

## Data flow

```
Canonical record
  → classify (taxonomy)
  → route (deterministic)
  → index reference / vault-native envelope
  → attach provenance + policy
  → Nutrition Label visible to participant
  → short-lived capability (when enabled)
  → minimal view / Capsule
  → receipt → expire/revoke → export/archive/delete → tombstone
```

See `lib/vault/router.ts` and `lib/vault/taxonomy.ts`.
