# Status communications

**Status:** Wave 8 Phase 32 — incident and maintenance comms. Not public SLA certification.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.** Status pages show service state, not participant data.
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.** "Operational" requires positive health signal.
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Communication tiers

| Severity | Audience | Channel |
|----------|----------|---------|
| P1 — critical service down | Tenant admins + platform on-call | Immediate notification + status page |
| P2 — degraded | Tenant admins | Status page + email |
| P3 — maintenance | Tenant admins | Scheduled notice |

## Content rules

- Describe affected **services** and **regions**, not participant identities.
- State whether integrations are fail-closed for affected tenants.
- Link to [incident response](../assurance/incident-response.md) for internal runbooks.
- Post-incident summaries are advisory — not regulatory filings.

## Honest status

Unknown component health displays as **unknown** or **degraded** — never assumed healthy.

## See also

- [Production SRE](./production-sre.md)
- [Service management](./service-management.md)
