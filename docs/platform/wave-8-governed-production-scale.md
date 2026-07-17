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

## Phase 32 documentation index

| Document | Topic |
|----------|-------|
| [tenant-model](./tenant-model.md) | Authoritative `Organisation.id` boundary |
| [tenant-context](./tenant-context.md) | Active tenant propagation |
| [tenant-data-isolation](./tenant-data-isolation.md) | Isolation modes and query enforcement |
| [tenant-encryption](./tenant-encryption.md) | Encryption profile intent (not KMS proof) |
| [tenant-file-isolation](./tenant-file-isolation.md) | Object storage namespacing |
| [hub-and-spoke-governance](./hub-and-spoke-governance.md) | Federation and delegation |
| [tenant-onboarding](./tenant-onboarding.md) | Human-governed onboarding cases |
| [tenant-suspension-and-offboarding](./tenant-suspension-and-offboarding.md) | Suspension and terminal states |
| [tenant-policy-profiles](./tenant-policy-profiles.md) | Versioned per-tenant policies |
| [regulatory-change-management](./regulatory-change-management.md) | Regulatory change cases |
| [feature-entitlements](./feature-entitlements.md) | Per-tenant runtime entitlements |
| [release-rings](./release-rings.md) | Staged deployment rings |
| [production-sre](./production-sre.md) | SRE catalogue and SLOs |
| [tenant-observability](./tenant-observability.md) | Privacy-safe tenant telemetry |
| [capacity-and-quotas](./capacity-and-quotas.md) | Quota profiles |
| [noisy-neighbour-controls](./noisy-neighbour-controls.md) | Fair-share under load |
| [multi-region-readiness](./multi-region-readiness.md) | Regional posture (not active-active) |
| [continuous-assurance](./continuous-assurance.md) | Tenant assurance snapshots |
| [platform-analytics-boundary](./platform-analytics-boundary.md) | Fleet analytics privacy |
| [market-integrity](./market-integrity.md) | Fair access controls |
| [service-management](./service-management.md) | Service catalogue lifecycle |
| [status-communications](./status-communications.md) | Incident and maintenance comms |
| [general-availability-readiness](./general-availability-readiness.md) | Advisory GA assessment |
| [wave-8-migration-runbook](./wave-8-migration-runbook.md) | Backfill and audit sequence |

### Phase 32 implementation notes

| Document | Topic |
|----------|-------|
| [phase-32-tenancy-boundary](./phase-32-tenancy-boundary.md) | Tenancy boundary summary |
| [phase-32-runtime-gate](./phase-32-runtime-gate.md) | Four-layer runtime gate |
| [phase-32-break-glass](./phase-32-break-glass.md) | Break-glass sessions |
| [phase-32-release-rings](./phase-32-release-rings.md) | Ring approval matrix |
| [phase-32-ga-decision](./phase-32-ga-decision.md) | GA decision record |
| [phase-32-regional-posture](./phase-32-regional-posture.md) | Regional design intent |
| [phase-32-market-integrity](./phase-32-market-integrity.md) | Market integrity notes |

### Security

| Document | Topic |
|----------|-------|
| [tenant-rls](../security/tenant-rls.md) | RLS readiness (RLS **not** deployed) |

## What is NOT in Wave 8

- Live NDIA submission client.
- Production GA activation of any tenant.
- Active-active multi-region.
- Cryptographic KMS custody claims.
- Postgres RLS enforcement (application scoping only).
- Any certification claim (SOC 2, ISO 27001, NDIS digital platform).
