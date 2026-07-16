# MapAble ContinuityOS

**Short name:** ContinuityOS  
**Full name:** MapAble Life Events and Service Recovery Operating System

Participant-controlled planning, dependency, continuity, failure-response and service-recovery layer for the MapAble ecosystem.

## Foundational rule

AURA interprets, retrieves, compares, explains, simulates and proposes.  
**The participant decides.**  
RightsOS authorises information use.  
Deterministic MapAble services validate and execute.  
Human specialists retain clinical, legal, safeguarding and emergency authority.

## Architecture

Hybrid control plane (Option D):

- `CareOSMission` remains mission source of truth
- ContinuityOS owns life-event registry, dependency projection, failure classification, playbooks, recovery cases/receipts
- Existing Care / Transport / Jobs / Home / Equipment / Calendar / Messaging services remain operational writers
- Incidents and complaints remain canonical

## Operating modes

| Mode | Behaviour |
|------|-----------|
| `demo` | Synthetic fixtures; no service execution |
| `shadow` | Monitors / calculates / prepares; does not contact or change services |
| `supervised` | Selected playbooks; human coordinator; approved service execution |
| `production` | Event-type and failure-class rollout with monitoring and rollback |

Default: `MAPABLE_CONTINUITY_MODE=shadow` with master flag off.

## Docs in this folder

- [CURRENT_STATE.md](./CURRENT_STATE.md) — Wave 0 reconciliation
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CANONICAL_DOMAIN_MAP.md](./CANONICAL_DOMAIN_MAP.md)
- [LIFE_EVENT_TAXONOMY.md](./LIFE_EVENT_TAXONOMY.md)
- [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md)
- [RESILIENCE_PLANNING.md](./RESILIENCE_PLANNING.md)
- [SERVICE_FAILURES.md](./SERVICE_FAILURES.md)
- [RECOVERY_ORCHESTRATION.md](./RECOVERY_ORCHESTRATION.md)
- [HANDOFF_PROTOCOL.md](./HANDOFF_PROTOCOL.md)
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md)
- [ROLLBACK.md](./ROLLBACK.md)

## Code

- `lib/continuity-os/` — config, taxonomy, projection, resilience, failure, recovery, handoff, receipts
- `data/continuity-os/` — versioned life-event types and playbooks
- `app/life-events/`, `app/recovery/` — participant UI
- `app/api/life-events/`, `app/api/recovery/` — APIs
- `tests/continuity-os/` — unit tests

## Non-goals

Not a project-management tool, CareOS replacement, incident/complaint system, emergency dispatch, clinical or legal engine, provider-assignment robot, participant risk score, or model-controlled executor.
