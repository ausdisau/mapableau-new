# Canonical Data Routing

Frozen routing is implemented in `lib/vault/taxonomy.ts` and `lib/vault/router.ts`.

| Item type | Canonical domain | Treatment |
| --------- | ---------------- | --------- |
| accessibility_profile | accessibility_profile | reference_only |
| access_passport | access_passport | reference_only |
| aura_memory_card | aura_memory | reference_only |
| careos_mission | careos_mission | reference_only |
| visit_plan | visit_plan | reference_only |
| offline_visit_pack | careos_mission | reference_only |
| equipment_passport | equipment_passport | reference_only |
| consent_record | consent_record | metadata_only |
| rights_policy | rights_os | metadata_only |
| worker_trust_credential | credential | reference_only |
| document | document | reference_only |
| trusted_contact | vault_native | encrypted_original (Wave 6+) |
| emergency_subset | vault_native | local_only |
| recovery_configuration | vault_native | encrypted_original |
| portable_export_package | vault_native | encrypted_original |
| imported_unrouted | vault_native | not_permitted until review |

**Rule:** AI and clients cannot choose or override `canonicalDomain`. Conflicting suggestions return `not_permitted` + human review.
