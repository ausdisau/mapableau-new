# Tenant suspension and offboarding

**Status:** Wave 8 Phase 32 — lifecycle terminal states. Fail-closed by default.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy at time of write.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed** — suspended tenants deny integrations immediately.
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Suspension (`suspended`)

Triggers (human-initiated):

- Assurance regression or incident
- Billing or contract breach
- Regulatory hold

Effects:

- `tenantStatus` → `suspended`; `TenantStatusTransition` recorded.
- Active entitlements treated as inactive at runtime gate.
- New participant enrolments and claims deny.
- Existing read access for org members may remain for continuity (policy-configurable); writes fail closed.

## Offboarding (`offboarded`)

Terminal state. Requires executive approval for production tenants.

Effects:

- All entitlements revoked.
- Integrations fail closed.
- Data retention follows privacy policy and legal hold — **deletion is not automatic**.
- Export window may be offered per contract; break-glass may be required for platform-assisted export.

## Re-activation

Returning from `suspended` requires a new human approval and entitlement review — not a flag toggle.

## See also

- [Tenant model](./tenant-model.md)
- [Service management](./service-management.md)
