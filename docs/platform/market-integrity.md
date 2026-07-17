# Market integrity

**Status:** Wave 8 Phase 32 — fair access and anti-gaming controls.

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

## Principles

1. **Equal runtime gate** — no tenant bypasses entitlement + assurance + GA checks via hidden flags.
2. **No preferential integration access** — critical integrations use the same fail-closed policy fleet-wide.
3. **Transparent quotas** — `TenantQuotaProfile` limits are visible to the tenant admin.
4. **Anti-gaming** — synthetic load, quota evasion, and cross-tenant enumeration are abuse incidents.

## Hub-and-spoke fairness

Hub operators receive aggregate spoke metrics only where `DelegatedTenantAuthority` explicitly grants it. Hub status does not imply priority queue placement.

## Related Phase 32 detail

See also [phase-32-market-integrity](./phase-32-market-integrity.md) for implementation notes.

## See also

- [Feature entitlements](./feature-entitlements.md)
- [Noisy neighbour controls](./noisy-neighbour-controls.md)
