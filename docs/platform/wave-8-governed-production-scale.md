# Wave 8 — Governed multi-organisation production scale

**Status:** Wave 8 implementation notes. Companion to
`docs/platform/wave-8-architecture-and-risk-plan.md`.

## Non-negotiable disclaimers

- Wave 8 does NOT activate general availability (GA), production tenants, or
 real NDIA submission.
- Feature flags and environment variables are NOT entitlements or approvals.
- AI must not approve onboarding, GA, regulatory interpretation, or
 break-glass.
- No SOC 2, ISO 27001, or NDIS digital platform certifications are claimed.
- The `Organisation.id` remains the tenant security and accountability
 boundary. Existing `Tenant` / `TenantMembership` / `EnterpriseProviderWorkspace`
 remain optional grouping only.

## What Wave 8 adds

- Tenant lifecycle fields on `Organisation` (`tenantKey`, `tenantType`,
 `tenantStatus`, `operatingModel`, `dataIsolationMode`, timestamps).
- `TenantStatusTransition` audit trail.
- `TenantEncryptionProfile` — design intent only, does NOT prove KMS custody.
- `TenantFederation` + `FederationMembership` — governance grouping, NOT data
 access.
- `DelegatedTenantAuthority` — narrow, approved, time-bound rights.
- `TenantOnboardingCase`, `TenantPolicyProfile`, `TenantFeatureEntitlement`,
 `TenantQuotaProfile`, `TenantOperationalHealth`.
- `ProductionRelease` + `ReleaseDeployment` with rings.
- `ServiceCatalogueEntry` for critical/high services.
- `GeneralAvailabilityAssessment` — advisory until a named executive signs.
- `BreakGlassSession` — required for any platform admin cross-tenant read.
- `RegulatorySource` + `RegulatoryChangeCase` — humans decide, not AI.

## The Wave 8 runtime gate

A feature is only enabled for a tenant when ALL of these hold:

1. The feature key is on the `KNOWN_FEATURE_KEYS` allowlist.
2. The corresponding environment flag is enabled (`process.env.*`).
3. `TenantFeatureEntitlement` for the tenant is `active` and not expired.
4. For `production` environment, `GeneralAvailabilityAssessment.decision` for
 the tenant is `approved` (executive signed).

Bypassing any of these — including "just for development" — is forbidden.

## Critical refactors

- `lib/api/phase3-scope.ts` — removed silent admin bypass. `platformScopedWhere`
 fails closed unless the caller explicitly passes `forceOrgIds`, or an active
 `BreakGlassSession` is in force.
- `lib/care/access-control.ts` — same treatment for participant-sensitive care
 operations. No ambient admin bypass.
- `lib/integrations/integration-feature-policy.ts` — `FAIL_CLOSED_INTEGRATION_KEYS`
 expanded to include payment (`stripe`), accounting (`xero`), regulator
 sandbox (`ndia`), and identity (`keycloak`). Criticality classification
 added.
- Vehicles / drivers list endpoints now scope by `getUserOrganisationIds`.

## Break-glass

- Every cross-tenant read by a platform admin requires a `BreakGlassSession`.
- Reason must be 20+ chars. Expiry capped at 8 hours. Self-approval is denied.
- Every request/approval/revoke generates an `AuditEvent`.

## Regulatory change cases

- `RegulatoryChangeCase` cannot be closed by an AI actor. A named human
 reviewer + impact assessment (>= 40 chars) is required.

## Continuous assurance

- `evaluateContinuousAssurance(organisationId)` returns a lightweight snapshot
 for a tenant based on Wave 6 assurance tables.
- Snapshot is NOT a certification report.

## Analytics and observability privacy

- `lib/analytics/privacy` rejects rows containing NDIS numbers or complaint
 free text.
- `lib/analytics/aggregation` refuses cohorts smaller than 10.
- `lib/observability/privacy` redacts risky keys before logging.

## Regional posture

- Single region: `au-southeast`.
- Active-active multi-region: NOT enabled. Wave 8 does not claim otherwise.
- `lib/resilience/*` documents intent; no live cross-region failover is a
 Wave 8 capability.

## Scripts

All scripts write reports to `artifacts/tenancy/` or `artifacts/platform/` and
accept `--dry-run`.

- `pnpm tenancy:audit-ownership`
- `pnpm tenancy:audit-isolation`
- `pnpm tenancy:audit-admin-bypass`
- `pnpm tenancy:audit-unscoped-queries`
- `pnpm tenancy:audit-cache`
- `pnpm tenancy:audit-queues`
- `pnpm tenancy:audit-files`
- `pnpm tenancy:audit-encryption`
- `pnpm platform:evaluate-entitlements`
- `pnpm platform:evaluate-assurance`
- `pnpm platform:test-release-rings`
- `pnpm platform:audit-capacity`
- `pnpm platform:test-resilience`
- `pnpm platform:assess-ga`

## APIs

Platform:
- `GET/POST /api/platform/tenants`
- `GET/POST /api/platform/releases`
- `GET/POST /api/platform/ga-readiness`
- `GET /api/platform/continuous-assurance`

Tenant:
- `GET /api/me/tenants`
- `GET/PUT /api/me/active-tenant`
- `GET /api/provider/entitlements`
- `GET /api/provider/policies`
- `GET /api/provider/quotas`
- `GET /api/provider/usage`

## UI pages

Platform:
- `/admin/platform/tenants` and `/admin/platform/tenants/[tenantId]`
- `/admin/platform/releases`, `/admin/platform/release-rings`
- `/admin/platform/capacity`
- `/admin/platform/continuous-assurance`
- `/admin/platform/ga-readiness`
- `/admin/platform/federations`
- `/admin/platform/sre`

Tenant:
- `/provider/admin/organisation`
- `/provider/admin/entitlements`
- `/provider/admin/policies`
- `/provider/admin/quotas`
- `/provider/admin/assurance`

Each page carries an amber disclaimer that env ≠ entitlement ≠ assurance ≠ GA.

## What is NOT in Wave 8

- Live NDIA submission client.
- Production GA activation of any tenant.
- Active-active multi-region.
- Cryptographic KMS custody claims.
- Any certification claim (SOC 2, ISO 27001, NDIS digital platform).
