# Phase 32 — Runtime gate

`lib/entitlements/runtime-gate.ts` — the ONE sanctioned way to decide if a
Wave 8 feature is live for a tenant.

All must hold:

1. Feature key is on `KNOWN_FEATURE_KEYS`.
2. Env flag enabled (`process.env.<FLAG>` truthy).
3. `TenantFeatureEntitlement` active + not expired.
4. Production environment additionally requires an approved
 `GeneralAvailabilityAssessment` (executive signed).

Env vars alone MUST NEVER enable a feature for a tenant.
