# Tenant observability

**Status:** Wave 8 Phase 32 — privacy-safe tenant telemetry.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.** Logs and metrics must not expose cross-tenant participant payloads without break-glass.
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.** Absence of telemetry ≠ pass.
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Privacy redaction

`lib/observability/privacy` redacts risky keys (NDIS numbers, complaint free text, credentials) before logging. Platform-wide log search requires scoped session.

## Tenant-scoped views

- Metrics tagged with `tenantKey` and `organisationId` for partition.
- Platform dashboards aggregate only above minimum cohort thresholds (see [platform analytics boundary](./platform-analytics-boundary.md)).
- `TenantOperationalHealth` surfaces integration and SLO status per org.

## What we do not log

- Full participant records in application logs.
- Payment card data or secrets.
- Cross-tenant bulk exports without audit trail.

## See also

- [Production SRE](./production-sre.md)
- [Continuous assurance](./continuous-assurance.md)
