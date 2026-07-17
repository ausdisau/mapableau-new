# Feature entitlements

**Status:** Wave 8 Phase 32 — per-tenant feature grants. Enforced at runtime gate.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.** Environment flags alone do not enable features.
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Runtime gate (all must hold)

1. Feature key on `KNOWN_FEATURE_KEYS` allowlist.
2. Corresponding `process.env.*` flag enabled.
3. `TenantFeatureEntitlement` for the org is `active` and not expired.
4. For `production` environment: `GeneralAvailabilityAssessment.decision === approved` (executive signed).

Bypassing any layer — including "just for development" — is forbidden.

## TenantFeatureEntitlement

Per-organisation grant with `featureKey`, `status`, `expiresAt`, and approver metadata. Inactive or expired entitlements deny even when the env flag is on.

Audit: `pnpm platform:evaluate-entitlements`.

API: `GET /api/provider/entitlements`. UI: `/provider/admin/entitlements`.

## See also

- [Release rings](./release-rings.md)
- [General availability readiness](./general-availability-readiness.md)
- [Wave 8 runtime gate](./phase-32-runtime-gate.md)
