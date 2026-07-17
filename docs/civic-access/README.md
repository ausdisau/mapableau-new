# MapAble Civic Access Infrastructure

**Short name:** MapAble Civic  
**Wave:** 1 — Civic Asset Registry and Static Accessibility Projection  
**Status:** Flag-gated foundation (defaults off)

MapAble Civic is the city, regional and public-infrastructure accessibility intelligence layer for the MapAble ecosystem. It models **environments, services, dependencies and public responsibilities**. It never scores the worth, capability, complexity or deservingness of people.

## What Wave 1 delivers

- Canonical asset references that **link to** `AccessPlace` (no duplicated place rows)
- Source + version + licence registry
- Asset ownership / jurisdiction / public-private classification fields
- Static accessibility projection (unknown / stale / disputed preserved)
- Read-only internal admin views under `/admin/civic`
- Audit events via `AuditEvent`
- Harbour precinct synthetic pilot seed
- Server-side feature flags (production dark)

## Explicit non-goals (Wave 1)

- Public Observatory
- Live incident federation
- Infrastructure simulation
- Participant journey access
- Universal accessibility scores
- Legal compliance certificates
- Physical-device actions

## Quick links

| Doc | Purpose |
| --- | --- |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Wave 0 repository reconciliation |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Hybrid control plane target |
| [ASSET_REGISTRY.md](./ASSET_REGISTRY.md) | Asset taxonomy and APIs |
| [CIVIC_ACCESS_TWIN.md](./CIVIC_ACCESS_TWIN.md) | Twin roadmap (Wave 2+) |
| [WHOLE_JOURNEY_GRAPH.md](./WHOLE_JOURNEY_GRAPH.md) | Journey graph roadmap |
| [PUBLIC_OBSERVATORY.md](./PUBLIC_OBSERVATORY.md) | Observatory (disabled) |
| [INCIDENT_NETWORK.md](./INCIDENT_NETWORK.md) | Incident federation (disabled) |
| [RELIABILITY.md](./RELIABILITY.md) | Asset reliability (≠ worker reliability) |
| [INFRASTRUCTURE_SIMULATOR.md](./INFRASTRUCTURE_SIMULATOR.md) | Equity simulator (disabled) |
| [PARTICIPATORY_PLANNING.md](./PARTICIPATORY_PLANNING.md) | Consultation roadmap |
| [PROCUREMENT.md](./PROCUREMENT.md) | Procurement compiler roadmap |
| [REGIONAL_OPERATIONS.md](./REGIONAL_OPERATIONS.md) | Hub-and-spoke roadmap |
| [EMERGENCY_CONTINUITY.md](./EMERGENCY_CONTINUITY.md) | Continuity info (not dispatch) |
| [OPEN_DATA.md](./OPEN_DATA.md) | Public APIs roadmap |
| [COMMUNITY_GOVERNANCE.md](./COMMUNITY_GOVERNANCE.md) | Mapping + First Nations pathway |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Security threats |
| [PRIVACY.md](./PRIVACY.md) | Privacy classifications |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG 2.2 AA plan |
| [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) | Harbour precinct pilot |
| [ROLLBACK.md](./ROLLBACK.md) | Kill switches and rollback |

## Enable locally

```bash
MAPABLE_CIVIC_ENABLED=true
MAPABLE_CIVIC_MODE=shadow
MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED=true
MAPABLE_CIVIC_USE_MEMORY=true
```

Admin: `/admin/civic`  
APIs: `/api/civic/assets`, `/api/civic/assets/[id]/access`, `/api/civic/pilot/seed`

## Code

- `lib/civic-access/` — domain services
- `app/api/civic/` — authenticated APIs
- `app/admin/civic/` — internal UI
- `prisma` models `CivicAsset*`, `CivicSource*`
- `tests/civic-access/`
