# Proactive Mission Watch + Temporal Planner (Prompt 06)

MapAble may **notice**, **reassess**, **explain**, and **recommend**.
MapAble may **not** silently execute operational actions.

```
Context Fabric (optional, Prompt 04)
        │
        ▼
Mission Watch Scheduler (deterministic)
        │
        ▼
Watch Rules (deadline / readiness / evidence / …)
        │
        ├── In-app alerts (participant-controlled)
        └── Prompt 03 Recovery events (reassess / alternatives)
                │
                └── Prompt 02 Action Kernel (only if participant later approves)
```

## Core rule

| Allowed | Forbidden |
|---------|-----------|
| Mission event | Approved operational action |
| Reassessment recommendation | Booking / payment / messaging |
| In-app alert | Uncontrolled email / SMS |
| Recovery alternatives | Clinical monitoring |
| Participant snooze / disable optional | Hidden surveillance loops |

## Watch types (only)

- `deadline`
- `departure_readiness`
- `service_confirmation`
- `approval_expiry`
- `evidence_freshness`
- `dependency_health`
- `human_review_wait`
- `participant_requested_reminder`

Clinical monitoring categories are explicitly rejected.

## Temporal engine

All timing arithmetic is deterministic. Default mission timezone is
`Australia/Sydney`. Prompt 03 recovery temporal helpers are reused.
No LLM date calculations for execution logic.

## Attention budget

Fingerprints suppress duplicate alerts for unchanged conditions. Participants
may snooze non-critical watches and disable optional watches.

## Feature flags (fail-closed)

| Flag | Default |
|------|---------|
| `MAPABLE_MISSION_WATCH_ENABLED` | `false` |
| `MAPABLE_PROACTIVE_PLANNING_ENABLED` | `false` |
| `MAPABLE_MISSION_WATCH_KILL_SWITCH` | `false` |
| `MAPABLE_PROACTIVE_AI_KILL_SWITCH` | `false` |

`MAPABLE_PROACTIVE_AI_KILL_SWITCH` disables AI-assisted planning only.
Deterministic watch evaluation continues when the master watch flag is on.

Requires `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED=true`.

## APIs

| Method | Path |
|--------|------|
| GET / POST | `/api/ai/missions/:missionId/watches` |
| POST | `/api/ai/missions/:missionId/watches/tick` |
| POST | `/api/ai/missions/:missionId/watches/:watchId/snooze` |
| POST | `/api/ai/missions/:missionId/watches/:watchId/disable` |
| POST | `/api/ai/missions/:missionId/watches/:watchId/action` |

## My MapAble UI

Sections: Upcoming, Needs attention, Waiting on, Recently changed.
Controls: snooze, disable optional, request human help, reassess now,
open evidence, take no action. WCAG 2.2 AA; no auto-advancing.

## Notifications

In-app first. External only via Governed Action Kernel if later approved.
Mission Watch never writes email or SMS itself.

## Persistence

In-memory store matching Prompts 01–05. Durable persistence requires
**Prompt 06A** Prisma migration — not claimed for production.

## Module

`lib/ai/platform/mission-watch/` + `lib/config/mission-watch.ts`.
