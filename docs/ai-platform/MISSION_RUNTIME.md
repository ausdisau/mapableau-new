# MapAble Mission Runtime

Participant-controlled cross-domain mission planning for My MapAble. The Mission
Runtime orchestrates canonical agents, authorised evidence, continuity checks, and
deterministic compilation into a readable plan with approval-gated action proposals.

**This is not autonomous execution.** The runtime recommends and proposes; participants
and authorised humans approve; deterministic services execute only after existing contracts.

## Position in the stack

```
My MapAble (Life Intent / participant goal)
        │
        ▼
POST /api/ai/missions/plan
        │
        ▼
Mission Runtime (lib/ai/platform/missions/)
        │
        ├── routeMissionDomains (deterministic)
        ├── selectMapAbleAgents (canonical registry)
        ├── evaluateSafeguardingGate
        ├── buildMissionEvidenceBundle
        ├── buildMissionGraph
        ├── analyseMissionContinuity
        └── compileMissionPlan
        │
        ▼
MapAbleMissionPlan + participant presentation
        │
        ├── Recommendations (WHAT / WHY / EVIDENCE / UNCERTAINTY / WHO DECIDES)
        ├── Action proposals (draft-only, approval-bound)
        ├── Human review items
        └── nonAiPath
```

## Lifecycle

1. **Start** — Participant supplies objective (text or LifeIntent). Feature flag must be on.
2. **Route** — Deterministic domain router infers `transport`, `care`, `jobs`, `access`, `payments`. LLM does not control permissions.
3. **Activate** — `selectMapAbleAgents` activates orchestrator + participant authority + relevant specialists.
4. **Safeguarding** — If indicators present, normal flow halts where required; human review item created.
5. **Evidence** — Authorised evidence loaded into `EvidenceBundle`; conflicts preserved; inference never marked verified.
6. **Graph** — Cross-domain mission nodes with distinct statuses (`confirmed`, `missing`, `not_authorised`, `consent_required`, …).
7. **Continuity** — Dependency gaps surfaced (e.g. interview without transport, support timing conflict).
8. **Compile** — Deterministic plan with recommendations and structured action proposals.
9. **Present** — Participant-readable summary in My MapAble Mission View.
10. **Replan** — Participant may reject recommendations, add/remove domains, decline profile use; no silent execution.

## Contracts

| Type | Location |
|------|----------|
| `MapAbleMissionRequest` | `lib/ai/platform/missions/types.ts` |
| `MapAbleMissionRuntimeContext` | extends `MapAbleMissionContext` |
| `MapAbleMissionPlan` | compiled output |
| `MissionRoutingResult` | router output |
| `EvidenceBundle` | evidence engine output |
| `MissionContinuityAlert` | continuity engine output |

Request sources: `participant_text`, `life_intent`, `care`, `transport`, `jobs`, `access`, `support_coordinator`.

Do not require diagnosis. Do not infer disability from wording.

## Agent activation

Uses Prompt 00 canonical registry only (`lib/ai/platform/agents/`).

| Situation | Typical agents |
|-----------|----------------|
| Any participant mission | `mission_orchestrator`, `participant_authority` |
| External/system evidence | `evidence_intelligence` |
| Domain specialists | `access_mobility`, `support_participation`, `work_participation` |
| Cross-domain / dependencies | `continuity_assurance` |
| Financial task only | `finance_administration` |

Specialists activate lazily by routed domains. Finance is rejected when mention is incidental only.

## Evidence

`buildMissionEvidenceBundle` uses existing platform retrieval patterns. Categories:

- `verified`, `participant_supplied`, `system_supplied`, `inferred`, `conflicting`, `stale`, `missing`

Model inference is never represented as verified evidence. Conflicting sources are both retained.

## Continuity

`analyseMissionContinuity` generalises Continuity Radar concepts for cross-domain missions.
High-impact conflicts route to human review; the runtime does not autonomously resolve them.

## Action proposals

Structured proposals only (no execute endpoint in Prompt 01):

- `prepare_transport_request`, `prepare_care_request`, `prepare_provider_message`, `prepare_adjustment_request`, `request_human_coordination`

Each includes payload hash, required consent/approvals, expiry, and information-to-share boundaries.
Execution is handled by the Governed Action Kernel (Prompt 02) — see [GOVERNED_ACTION_KERNEL.md](./GOVERNED_ACTION_KERNEL.md).

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/missions/plan` | Create mission plan |
| GET | `/api/ai/missions/:missionId/preview` | Preview stored plan |
| POST | `/api/ai/missions/:missionId/replan` | Replan after participant changes |
| POST | `/api/ai/missions/:missionId/events` | Ingest recovery event (Prompt 03) |
| POST | `/api/ai/missions/:missionId/reassess` | Manual reassessment (Prompt 03) |
| GET | `/api/ai/missions/:missionId/recovery` | Recovery snapshot (Prompt 03) |
| POST | `/api/ai/missions/:missionId/recovery/:id/select` | Select recovery alternative (Prompt 03) |

Mission APIs do not execute operational actions. Use `/api/ai/actions/proposals/*` for
approval-bound execution (Prompt 02). Recovery select prepares kernel proposals only.
No `/autorun`, `/autobook`, or `/autoassign` endpoints.

## Persistence

Prompt 01 uses an in-memory plan store (`lib/ai/platform/missions/store.ts`). Prompt 02
uses in-memory action proposal/approval/replay stores. Durable secure replay requires
Prompt 02A (Prisma models) if mandated for production multi-instance deployments.

LifeIntent and audit infrastructure remain the canonical durable records for participant goals.

## Feature flags

| Flag | Default | Effect |
|------|---------|--------|
| `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED` | `false` | Master switch; OFF = unchanged My MapAble |
| `MAPABLE_AGENTIC_NERVE_CENTRE_MODEL_ASSISTED` | `false` | Optional model-assisted routing hints only |
| `MAPABLE_ACTION_KERNEL_ENABLED` | `false` | Governed Action Kernel master switch |
| `MAPABLE_ADAPTIVE_RECOVERY_ENABLED` | `false` | Adaptive recovery surfaces |
| `MAPABLE_PROACTIVE_REASSESSMENT_ENABLED` | `false` | Auto-reassess on event ingest |
| `MAPABLE_RECOVERY_MODEL_ASSIST_ENABLED` | `false` | Model phrasing only |
| `MAPABLE_RECOVERY_KILL_SWITCH` | `false` | Disables auto reassessment |

Respects `MAPABLE_AI_GLOBAL_KILL_SWITCH`: deterministic planning remains available when models are killed.
Action kernel also respects `MAPABLE_ACTION_KERNEL_KILL_SWITCH`.

## Telemetry

Events via `captureMissionTelemetry` → `captureAiPlatformTelemetry`:

`mission_started`, `mission_routed`, `agent_activated`, `evidence_loaded`, `evidence_missing`,
`continuity_alert_created`, `recommendation_created`, `participant_rejected_recommendation`,
`human_review_requested`, `mission_replanned`, `non_ai_path_selected`.

Participant content is minimised in telemetry payloads.

## My MapAble integration

When the nerve centre flag is on, Life Intent detail exposes **Build mission** → `MissionView`.
Reuses participant control patterns (profile consent toggle, recommendation rejection, non-AI path).

## Authority

No authority expansion from Prompt 00. Prohibited autonomous actions remain blocked at compile time
and via agent manifests. Employer disability disclosure requires explicit consent scope.

## Tests

`tests/ai-platform/mission-*.test.ts` — routing, evidence, continuity, participant control, runtime scenarios A–J.

## Failure behaviour

| Condition | Behaviour |
|-----------|-----------|
| Flag off | API returns error; My MapAble hides mission UI |
| Global AI kill switch | Deterministic routing/compile still works |
| Safeguarding indicator | Human review path; no AI substantiation |
| Missing consent | `consent_required` / `not_authorised` — never coerced to `missing` |

## Context Fabric integration (Prompt 04)

When `MAPABLE_CONTEXT_FABRIC_ENABLED=true`, mission planning merges authorised fabric
context into the evidence bundle via `mergeFabricContextIntoEvidence`. Inference remains
in the inferred lane; provenance is preserved. See [CONTEXT_FABRIC.md](./CONTEXT_FABRIC.md).

## Agency Memory personalisation (Prompt 05)

When enabled, Mission Runtime may receive **confirmed** Agency Memory via Context
Fabric scoped retrieval. Proposed, revoked, expired, or purpose-mismatched items
are excluded. Pause personalisation / disable AI still allow manual preference
management. See [AGENCY_MEMORY.md](./AGENCY_MEMORY.md).
