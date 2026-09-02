# MapAble Agentic Nerve Centre

Canonical consolidation of MapAble AI agents, CareOS network activation, authority
display labels, safeguarding escalation, and Convergence OS preflight checks.

**Positioning:** Agents reason about missions. Capabilities define what an agent can
use. Policy and authority gates determine what is permissible. Participants and
authorised humans approve high-impact actions. Deterministic services execute actions.
AI must never become the system of record or authorisation authority.

## Architecture

```
Participant-approved objective
        │
        ▼
selectMapAbleAgents (deterministic)
        │
        ├── Safeguarding gate (halt → human review)
        ├── Eight operational agents
        │         │
        │         ▼
        │   Capability registry → models / prompts / tools
        │         │
        │         ▼
        │   AuthorityCeiling + kill switches + consent
        │         │
        │         ▼
        │   Structured proposal → human/participant approval
        │         │
        │         ▼
        │   Deterministic service → audit
        │
        └── CareOS adapter (deprecated) → legacy activation shape
```

| Concern | Canonical location |
|---------|-------------------|
| Agents | `lib/ai/platform/agents/` |
| Capabilities | `lib/ai/platform/capabilities/` |
| Authority | `lib/ai/platform/types/authority.ts` |
| Kill switches | `lib/ai/platform/policies/kill-switches.ts` |
| Human review | `lib/ai/platform/human-review/` |
| Safeguarding | `lib/ai/platform/policies/safeguarding-gate.ts` (gate, not agent) |
| Mission graph | existing `lib/ai/platform/graph/` + CareOS `intelligence/network/mission-graph.ts` |
| CareOS activation | `intelligence/network/agent-registry.ts` (adapter) |

Do **not** create a second model registry, tool registry, prompt registry, approval
mechanism, authority taxonomy, mission graph, or kill-switch implementation.

## Eight canonical operational agents

1. `mission_orchestrator` — coordinates specialists; never executes domain actions
2. `participant_authority` — consent, preferences, AAC, non-AI paths; never infers consent/capacity
3. `evidence_intelligence` — authorised evidence with provenance; never converts inference to fact
4. `access_mobility` — access + transport analysis; cannot confirm/dispatch transport
5. `support_participation` — care/support analysis; cannot assign workers or accept agreements
6. `work_participation` — jobs reasoning; no automatic disability disclosure
7. `continuity_assurance` — dependency/failure detection; routes exceptions to humans
8. `finance_administration` — invoice/funding explanation; cannot approve/pay/alter funding

Robotics is **research_only** (not in this list). Safeguarding is a **human escalation gate**.

## Agent vs capability

- **Agent** = bounded operational role with domains, handoffs, prohibited actions, evaluation suite.
- **Capability** = registered unit of AI/deterministic work (model, prompt, tools, flag, kill switch).
- Chain: **Agent → Capability → Model/Prompt/Tools**.
- Manifests must not duplicate model/prompt/tool configuration.

## Authority system

Source of truth: `AuthorityCeiling` in `lib/ai/platform/types/authority.ts`.

| Ceiling | CareOS **display** label (derived only) |
|---------|----------------------------------------|
| `READ_ONLY_EXPLAIN` | `L0_INFORMATION` |
| `DRAFT_ONLY` | `L1_DRAFT` |
| `SUGGEST_WITH_HUMAN_REVIEW` | `L2_RECOMMEND` |
| `SUGGEST_WITH_PARTICIPANT_APPROVAL` | `L2_RECOMMEND` |
| `DETERMINISTIC_EXECUTE_VIA_SERVICE` | `L3_CONFIRMED_ACTION` |
| `NO_OPERATIONAL_AUTHORITY` | `PROHIBITED` |

Never derive global authority from display labels. Helper:
`authorityCeilingToCareOsDisplayLabel`.

Handoff effective authority:

`min(missionAuthority, sourceAgent, targetAgent, capabilityAuthority)`

Receiving agents cannot increase authority. Human-only workflows cannot be handed to agents.

## Mission lifecycle

1. Participant (or authorised human) supplies an approved objective.
2. `selectMapAbleAgents` activates orchestrator + participant authority and relevant specialists.
3. Specialists read minimum necessary `MapAbleMissionContext` / handoffs.
4. Suggestions become structured proposals.
5. Authority/policy validation → participant/human approval when required.
6. Signed/bound approval → deterministic service → audit.
7. Non-AI paths remain available via agent fallbacks (`non_ai_path` / `human`).

## Consent rules

- Consent scopes are declared on manifests and capabilities.
- Missing scopes are reported; they are never inferred from behaviour.
- `work_participation` requires explicit `disability_disclosure` before any disclosure path.
- Participant authority prohibits `infer_consent_from_behaviour` and `infer_capacity_from_communication_style`.

## Human-review rules

- Capability `humanReviewRequired` / `participantApprovalRequired` remain binding.
- Approval bindings must be complete (`assertApprovalBindingComplete`).
- Suggestion ≠ approval (`isProposalApproved` only for `"approved"`).

## Safeguarding boundary

`evaluateSafeguardingGate`:

- **May:** detect safeguarded workflow, halt AI, create human-review item, preserve evidence, explain continuation.
- **Must not:** decide abuse, substantiate/dismiss, decide reportability, authorise restrictive practices, close incidents/complaints.

CareOS still emits legacy id `safeguarding` as `human_only` via the adapter.

## Deterministic execution

Agents never write bookings, payments, assignments, or claims unless an existing
deterministic service contract permits the operation **and** required approvals are present.

## Feature flags and kill switches

- Per-capability `featureFlag` env must be `"true"` to enable (fail closed).
- Kill switches: global `MAPABLE_AI_GLOBAL_KILL_SWITCH`, per-capability in-process switches.
- Disabled/killed capabilities make dependent agents unavailable or degraded; non-AI fallback remains.

## Fallback behaviour

Every operational agent declares `fallbackAgentId`: another agent, `human`, or `non_ai_path`.

## Evaluation requirements

Every operational agent declares `evaluationSuite`. Registry validation fails closed without it.
Convergence OS preflight flags missing evaluation coverage for proposed agents/capabilities.

## Migration from CareOS registry

`intelligence/network/agent-registry.ts` is a **deprecated adapter**:

- Keeps `selectCareOSAgentNetwork(...)` and `CareOSAgentActivation` shape.
- Implements selection via `selectMapAbleAgents` with `relaxCapabilityFlags: true`.
- Maps legacy ids (`manager`, `care_coordination`, …) onto the eight canonical agents.
- Keeps `safeguarding` → `human_only`, `robotics` → `research_only`.

New call sites should use `selectMapAbleAgents` directly.

## Adding a future agent or capability

1. Prefer a new **capability** in `capabilities/seed.ts` over a new agent.
2. Operational agents remain **eight maximum** unless a human-approved architecture change expands the set.
3. Run Convergence OS agent preflight (`evaluateAgentRegistryPreflight` / `evaluateStopConditions`).
4. Stop on: duplicate capability/role, authority expansion, sensitive pathway, privacy ambiguity, missing rollback, missing evaluation.
5. AI may draft. Humans approve. GitHub/CI execute. No auto-merge.

## Phase 2 (not in this change)

- Persistent agent manifests in the database (would require Prisma migration).
- Jobs-specific capability keys for `work_participation` (currently shares read-only retrieval).
- Optional retirement of CareOS legacy agent ids once all callers migrate.

## Mission Runtime (Prompt 01)

Cross-domain participant mission planning is implemented in `lib/ai/platform/missions/`.
See [MISSION_RUNTIME.md](./MISSION_RUNTIME.md).

```
My MapAble → Mission Runtime → selectMapAbleAgents → evidence + graph + continuity → MissionPlan
```

- APIs: `POST /api/ai/missions/plan`, `GET /api/ai/missions/:missionId/preview`, `POST .../replan`
- Feature flag: `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED` (default **false**)
- Action proposals remain approval-gated; execution via Governed Action Kernel
- In-memory plan store until Prompt 02A evaluates durable persistence

## Governed Action Kernel (Prompt 02)

Approval-bound deterministic execution for Phase 02 request/communication/preference actions.
See [GOVERNED_ACTION_KERNEL.md](./GOVERNED_ACTION_KERNEL.md).

```
Mission proposal → Action Kernel proposal → approve (payloadHash+nonce) → execute → audit
```

- APIs: `POST /api/ai/actions/proposals`, `.../approve`, `.../reject`, `.../execute`
- Flags: `MAPABLE_ACTION_KERNEL_ENABLED` + per-action flags + kill switch (all default **false**)
- No authority expansion; no worker assign / confirm transport / pay / disclose

## Mission Watch (Prompt 06)

Deterministic proactive watches feed recovery events and in-app alerts.
Never auto-executes. See [MISSION_WATCH.md](./MISSION_WATCH.md).

## Adaptive Recovery Engine (Prompt 03)

Automatic reassessment without automatic redecision. See
[ADAPTIVE_RECOVERY_ENGINE.md](./ADAPTIVE_RECOVERY_ENGINE.md).

```
Mission events → triggers → impact → materiality → candidate plan → participant options
                                                              │
                                                              ▼
                                              Action Kernel prepare (Prompt 02)
```

- APIs: `POST .../events`, `POST .../reassess`, `GET .../recovery`, `POST .../recovery/:id/select`
- Flags: `MAPABLE_ADAPTIVE_RECOVERY_ENABLED` (+ proactive / model-assist / kill switch), all default **false**
- Selecting an alternative updates candidate plan and may prepare Action Kernel proposals; never auto-executes


## Governed Connector Gateway (Prompt 09)

Single boundary for external reads/writes. See [CONNECTOR_GATEWAY.md](./CONNECTOR_GATEWAY.md).

```
Agent/Mission → Action Proposal → Action Kernel → Connector Gateway → External
External Source → Connector Gateway → Context Fabric–compatible records
```

- Implementation: `lib/ai/platform/connector-gateway/`
- Flags: `MAPABLE_CONNECTOR_GATEWAY_ENABLED` + per-connector flags + kill switches (all default **false**)
- Agents never receive raw credentials; writes require Prompt 02 approved envelopes
- External content is DATA only (prompt-injection quarantined)

## Admin surfaces

- `GET /api/ai/agents`, `GET /api/ai/agents/:id`, `POST /api/ai/agents/activation-preview` (admin, read-only preview).
- `/admin/ai/agents` — WCAG-oriented governance table.

## Context Fabric (Prompt 04)

Perception layer for authorised operational context. Agents and Mission Runtime may
`queryMissionContext` when `MAPABLE_CONTEXT_FABRIC_ENABLED=true`. Domain events route
selectively; not every event reaches every agent. See [CONTEXT_FABRIC.md](./CONTEXT_FABRIC.md).
