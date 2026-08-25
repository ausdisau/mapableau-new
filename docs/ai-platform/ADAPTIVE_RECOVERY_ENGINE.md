# Adaptive Planning & Recovery Engine (Prompt 03)

MapAble may **automatically reassess** when circumstances change. MapAble may **not**
automatically redecide for the participant.

Recovery sits on the Mission Runtime (Prompt 01) and integrates operational proposals
through the Governed Action Kernel (Prompt 02) — prepare only, never silent execute.

## Core rule

| Allowed automatically | Never automatic |
|----------------------|-----------------|
| Evidence refresh | Worker assign |
| Dependency recompute | Transport book |
| Continuity analysis | Payment |
| Alternative generation | Disclosure / consent change |
| Mission status change | Employer contact |
| Notification prep | Clinical / safeguarding decisions |

## Action Kernel integration

Selecting a recovery alternative:

1. Updates the **candidate plan** version
2. Identifies required approvals / reapprovals
3. Calls `prepareKernelProposalFromMission` when Action Kernel is enabled
4. Does **not** call `executeApprovedAction`

## Feature flags (fail-closed)

| Flag | Default |
|------|---------|
| `MAPABLE_ADAPTIVE_RECOVERY_ENABLED` | `false` |
| `MAPABLE_PROACTIVE_REASSESSMENT_ENABLED` | `false` |
| `MAPABLE_RECOVERY_MODEL_ASSIST_ENABLED` | `false` |
| `MAPABLE_RECOVERY_KILL_SWITCH` | `false` |

Requires `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED=true`.

## APIs

| Method | Path |
|--------|------|
| POST | `/api/ai/missions/:missionId/events` |
| POST | `/api/ai/missions/:missionId/reassess` |
| GET | `/api/ai/missions/:missionId/recovery` |
| POST | `/api/ai/missions/:missionId/recovery/:alternativeId/select` |

## Persistence

In-memory store (events, plan versions, recovery state) mirroring Prompt 01.
Durable versioning with retention/privacy requires **Prompt 03A** Prisma migration —
not faked for production claims.

## Module

`lib/ai/platform/recovery/` — types, events, triggers, impact, materiality, planner,
alternatives, temporal, policy, presentation, store, index.


## Context Fabric event routing (Prompt 04)

When `MAPABLE_CONTEXT_FABRIC_ENABLED` and `MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED` are true,
mission-linked domain events may be mapped into `ingestMissionEvent`. Model-inference
sources never assert verified recovery failures. Irrelevant missions do not receive events.
See [CONTEXT_FABRIC.md](./CONTEXT_FABRIC.md).

