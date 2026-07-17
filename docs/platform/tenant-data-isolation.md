# Tenant data isolation

**Status:** Wave 8 Phase 32 — isolation posture documentation. Not live dedicated-DB claims.

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

## Isolation modes

`Organisation.dataIsolationMode` records the **declared** posture:

| Mode | Meaning | Wave 8 status |
|------|---------|---------------|
| `shared_schema_strict` | Shared Postgres; mandatory `organisationId` on every query | **Default and enforced** |
| `dedicated_schema` | Separate schema per tenant | Design intent only |
| `dedicated_database` | Separate database per tenant | Design intent only |

Recording `dedicated_*` does not imply the capability is live. Auditors are told the honest current mode.

## Query-layer enforcement

- `lib/api/phase3-scope.ts` — `platformScopedWhere` fails closed for unscoped admin traffic.
- `lib/care/access-control.ts` — same for participant-sensitive care operations.
- Vehicles, drivers, and list endpoints scope via `getUserOrganisationIds`.
- Unscoped queries are audit findings (`pnpm tenancy:audit-unscoped-queries`).

RLS is **not** deployed — see [tenant RLS readiness](../security/tenant-rls.md). Application scoping remains mandatory.

## Cache and queues

Tenant-prefixed keys and queue names use `tenantKey` where external systems require namespacing. Cross-tenant cache bleed is a severity-1 defect. Audit: `pnpm tenancy:audit-cache`, `pnpm tenancy:audit-queues`.

## See also

- [Tenant encryption](./tenant-encryption.md)
- [Tenant file isolation](./tenant-file-isolation.md)
- [Noisy neighbour controls](./noisy-neighbour-controls.md)
