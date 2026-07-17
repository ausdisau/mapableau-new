# Tenant model

**Status:** Wave 8 Phase 32 — design intent. Not GA, not certification.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.** `Tenant`, `TenantMembership`, and `EnterpriseProviderWorkspace` are optional workspace grouping only.
- **Platform admins do not automatically access participant data.** Cross-tenant reads require break-glass or explicit scope.
- **Hub-and-spoke ≠ unrestricted sharing.** Parent links and federations grant narrow governance rights only.
- **Env ≠ entitlement ≠ assurance ≠ registration.** Schema fields record intent; they are not approvals.
- **Pilot ≠ GA.** Controlled pilot does not authorise production-scale tenancy.
- **Policies are versioned;** historical records retain the policy version in force at write time.
- **Unknown health ≠ healthy.** Missing status or assessment data is not treated as pass.
- **Critical integrations fail closed** when configuration or entitlement is uncertain.
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Authoritative boundary

Every participant, worker, funding, claim, and NDIS-sensitive row is scoped by `organisationId`. Wave 8 extends `Organisation` with lifecycle fields:

| Field | Purpose |
|-------|---------|
| `tenantKey` | Stable slug for logs, queues, and artefact prefixes |
| `tenantType` | Provider, hub, spoke, government partner, etc. |
| `tenantStatus` | Lifecycle state (`draft` → `onboarding` → `active` → `suspended` → `offboarded`) |
| `operatingModel` | Hub-and-spoke, standalone, federation member |
| `dataIsolationMode` | Recorded isolation posture (see [tenant-data-isolation](./tenant-data-isolation.md)) |

`TenantStatusTransition` audits every status change. Status alone does not grant feature access — see [feature-entitlements](./feature-entitlements.md).

## What this is not

- Not a replacement security root (`Tenant.id` is never used for data scoping).
- Not proof of encryption, isolation, or regulatory registration.
- Not an auto-activation path — onboarding is human-governed ([tenant-onboarding](./tenant-onboarding.md)).

## See also

- [Tenancy boundary (Phase 32)](./phase-32-tenancy-boundary.md)
- [Wave 8 overview](./wave-8-governed-production-scale.md)
