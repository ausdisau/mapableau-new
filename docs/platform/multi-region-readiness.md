# Multi-region readiness

**Status:** Wave 8 Phase 32 — design intent only. **Active-active multi-region is NOT enabled.**

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

| Capability | Wave 8 status |
|------------|---------------|
| Primary region | `au-southeast` |
| Active-active failover | **Not enabled** |
| Cross-region replication | Design docs in `lib/resilience/regions/` only |
| Data residency | `dataRegion` defaults to `au` on Organisation |

`lib/resilience/*` documents intent. No live cross-region failover is a Wave 8 capability.

## Future readiness checklist (not claims)

- Tenant-pinned data residency metadata
- Replication lag monitoring
- Region-aware break-glass audit
- Fail-closed default during partition

## See also

- [Phase 32 regional posture](./phase-32-regional-posture.md)
- [Production SRE](./production-sre.md)
- [Disaster recovery](../assurance/disaster-recovery.md)
