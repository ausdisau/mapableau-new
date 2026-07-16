# MapAble ContinuityOS

**Short name:** ContinuityOS  
**Full name:** MapAble Life Events and Service Recovery Operating System

ContinuityOS is the participant-controlled planning, dependency, continuity, failure-response and service-recovery layer for the MapAble ecosystem.

## Foundational rule

- **AURA** interprets, retrieves, compares, explains, simulates and proposes.
- The **participant** decides.
- **RightsOS** authorises information use.
- Deterministic MapAble services validate and execute.
- Human specialists retain clinical, legal, safeguarding and emergency authority.

## Architecture

Hybrid control plane:

- `CareOSMission` remains the mission source of truth.
- ContinuityOS owns life-event taxonomy, dependency projection, failure classification, playbooks, recovery cases and receipts.
- Care, Transport, Jobs, Home, Equipment, Incidents and Complaints remain canonical writers.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [CANONICAL_DOMAIN_MAP.md](./CANONICAL_DOMAIN_MAP.md).

## Operating modes

| Mode | Behaviour |
|------|-----------|
| `demo` | Synthetic people and events; no service execution |
| `shadow` | Calculate impact and prepare options; no contact or domain writes |
| `supervised` | Selected playbooks with human coordinator and approved service actions |
| `production` | Staged event-type / failure-class / organisation / region rollout |

Default: `MAPABLE_CONTINUITY_MODE=shadow` with all enable flags `false`.

## Documentation index

- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CANONICAL_DOMAIN_MAP.md](./CANONICAL_DOMAIN_MAP.md)
- [LIFE_EVENT_TAXONOMY.md](./LIFE_EVENT_TAXONOMY.md)
- [LIFE_EVENT_PLAYBOOKS.md](./LIFE_EVENT_PLAYBOOKS.md)
- [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md)
- [RESILIENCE_PLANNING.md](./RESILIENCE_PLANNING.md)
- [SERVICE_FAILURES.md](./SERVICE_FAILURES.md)
- [RECOVERY_ORCHESTRATION.md](./RECOVERY_ORCHESTRATION.md)
- [HANDOFF_PROTOCOL.md](./HANDOFF_PROTOCOL.md)
- [HUMAN_ASSISTANCE.md](./HUMAN_ASSISTANCE.md)
- [ACCESS_FRICTION.md](./ACCESS_FRICTION.md)
- [FINANCIAL_RECOVERY.md](./FINANCIAL_RECOVERY.md)
- [REGIONAL_CONTINUITY.md](./REGIONAL_CONTINUITY.md)
- [OUTCOME_VERIFICATION.md](./OUTCOME_VERIFICATION.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [PRIVACY.md](./PRIVACY.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md)
- [ROLLBACK.md](./ROLLBACK.md)

## Code paths

- `lib/continuity-os/`
- `app/api/life-events/`
- `app/api/recovery/`
- `app/life-events/`
- `app/recovery/`
- `components/continuity-os/`
- `tests/continuity-os/`
