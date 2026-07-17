# Tenant context

**Status:** Wave 8 Phase 32 — runtime context propagation. Not GA.

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

## Active tenant selection

Authenticated users may belong to multiple organisations. The **active tenant** (`/api/me/active-tenant`) determines which `organisationId` scopes API reads and writes for provider surfaces.

Rules:

1. Active tenant must be in the user's `OrganisationMembership` (or equivalent delegated authority).
2. Switching tenant clears in-memory caches that could leak cross-tenant data.
3. Platform admin sessions do **not** inherit an ambient tenant — admins must select scope or use break-glass.
4. Hub operators viewing spoke data require an explicit `DelegatedTenantAuthority` or break-glass session — not merely a parent link.

## Request propagation

Every server handler that touches participant data must resolve `organisationId` from:

1. Authenticated membership scope, or
2. Explicit route parameter validated against membership, or
3. Active break-glass session with audited `forceOrgIds`.

Missing or ambiguous context **fails closed** (deny, not default-to-first-org).

## UI surfaces

- `/provider/admin/organisation` — tenant metadata (read-only where status forbids edit).
- Platform consoles never assume a default tenant.

## See also

- [Tenant model](./tenant-model.md)
- [Tenant data isolation](./tenant-data-isolation.md)
- [Break-glass (Phase 32)](./phase-32-break-glass.md)
