# Tenant RLS readiness

**Status:** Wave 8 — Row-Level Security (RLS) is **not deployed**. Application scoping remains mandatory.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Current posture

MapAble NDIS uses **application-layer scoping** (`organisationId` on every query via `phase3-scope`, care access control, and membership checks). Postgres RLS policies are **not** enabled in any environment as of Wave 8.

**Do not claim RLS is deployed.** Documentation, audits, and customer communications must state application scoping as the enforced control.

## RLS readiness (future)

When RLS is evaluated for adoption:

1. Policy templates per table class (participant, worker, claim, audit).
2. `SET app.current_organisation_id` (or equivalent) per connection.
3. Break-glass bypass as explicit, audited role — not default superuser.
4. Dual enforcement period: application scope **and** RLS until parity proven.
5. `pnpm tenancy:audit-isolation` extended to detect RLS drift.

## Why not Wave 8

- Risk of silent behaviour change on 200+ query paths.
- Connection pooler compatibility (PgBouncer transaction mode).
- Break-glass and federation semantics need design before DB-enforced policies.

## See also

- [Tenant data isolation](../platform/tenant-data-isolation.md)
- [Phase 32 tenancy boundary](../platform/phase-32-tenancy-boundary.md)
