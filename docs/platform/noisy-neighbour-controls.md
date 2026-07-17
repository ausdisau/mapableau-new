# Noisy neighbour controls

**Status:** Wave 8 Phase 32 — fair-share and isolation under load.

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

## Controls

1. **Per-tenant rate limits** — from `TenantQuotaProfile`; shared schema does not imply shared rate budget.
2. **Queue fairness** — job queues prefixed by `tenantKey`; single-tenant flood cannot starve others beyond configured headroom.
3. **Cache namespacing** — keys include `organisationId`; audit: `pnpm tenancy:audit-cache`.
4. **Connection pool guards** — long-running queries tagged; abusive patterns trigger tenant-scoped throttle.
5. **Integration circuit breakers** — unhealthy tenant integration does not disable fleet-wide integration (fail closed per tenant).

## Detection

Capacity audit and operational health snapshots flag tenants exceeding 80% of quota sustained. Human review — not auto-suspension.

## See also

- [Capacity and quotas](./capacity-and-quotas.md)
- [Tenant data isolation](./tenant-data-isolation.md)
