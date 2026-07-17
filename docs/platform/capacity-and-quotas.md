# Capacity and quotas

**Status:** Wave 8 Phase 32 — quota profiles and backpressure.

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

## TenantQuotaProfile

Per-organisation limits on:

| Resource | Example cap |
|----------|-------------|
| API requests / minute | Rate limit tier |
| Concurrent jobs | Queue depth |
| Storage | File quota GB |
| Active participants | Enrollment cap |

Quotas enforce at the runtime gate and API middleware. Exceeding quota returns `429` / structured deny — not silent degradation of other tenants.

## Platform capacity

`/admin/platform/capacity` shows fleet-wide utilisation. Audit: `pnpm platform:audit-capacity`.

API: `GET /api/provider/quotas`, `GET /api/provider/usage`.

## See also

- [Noisy neighbour controls](./noisy-neighbour-controls.md)
- [Feature entitlements](./feature-entitlements.md)
