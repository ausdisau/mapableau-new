# Service management

**Status:** Wave 8 Phase 32 — internal service lifecycle. Not ITIL certification.

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

## ServiceCatalogueEntry

Each catalogued service records:

- Name, owner team, criticality tier
- Dependencies (integration keys, data stores)
- Change window and rollback procedure reference
- Linked `ProductionRelease` ring requirement

## Change linkage

Production changes flow through [release rings](./release-rings.md). Emergency changes still require post-hoc ring documentation and human approval — AI cannot approve.

## Tenant impact

Planned maintenance uses [status communications](./status-communications.md). Per-tenant maintenance does not imply fleet-wide entitlement change.

## See also

- [Production SRE](./production-sre.md)
- [Tenant suspension and offboarding](./tenant-suspension-and-offboarding.md)
