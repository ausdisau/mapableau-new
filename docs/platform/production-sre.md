# Production SRE

**Status:** Wave 8 Phase 32 — internal SRE practices. Not certification.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.** Missing SLO data is not green.
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Service catalogue

`ServiceCatalogueEntry` classifies internal services by criticality (`critical`, `high`, `medium`, `low`). Critical and high services have defined error budgets and escalation paths.

## SLOs and error budgets

`TenantOperationalHealth` stores per-tenant snapshots (availability, error rate, integration health). Snapshots are point-in-time — not a certification.

- Degraded integration health → fail-closed for that integration key.
- Error budget exhaustion → release ring promotion blocked pending human review.

## Operations

- UI: `/admin/platform/sre`
- Resilience test (design intent): `pnpm platform:test-resilience`
- Incident linkage: [incident response](../assurance/incident-response.md)

## Regional note

Single region `au-southeast` for Wave 8. See [multi-region readiness](./multi-region-readiness.md).

## See also

- [Tenant observability](./tenant-observability.md)
- [Status communications](./status-communications.md)
- [Service management](./service-management.md)
