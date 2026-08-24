# MapAble AI Platform — Current State

Positioning: *An evidence-aware, participant-controlled copilot for complete disability-support journeys.*

## On main (foundation registry)

| Capability key | Backend | Maturity | Flag default |
|---|---|---|---|
| search.nl_interpreter | hybrid | production_supported | on when keys present |
| search.access_needs_interpreter | hybrid | production_supported | on with interpreter |
| provider_finder.reply_generator | model_backed | controlled_pilot | SEARCH_AGENT off |
| agent.disability_services | model_backed | experimental | off |
| agent.booking_services | model_backed | experimental | off |
| case.deterministic_engine | deterministic | deterministic | case AI on, autorun off |
| case.extractive_summary | deterministic | deterministic | case AI |
| billing.copilot | deterministic | deterministic | on |
| matching.care_rules | deterministic | deterministic | on |
| matching.ai_overlay | deterministic | experimental | AI_MATCHING off |
| accesscast.forecast | deterministic | synthetic_only | off |
| access_intelligence_next.preflight | deterministic | synthetic_only | off |
| mission.copilot | deterministic | controlled_pilot | MAPABLE_MISSION_COPILOT off |
| case.copilot | deterministic | controlled_pilot | MAPABLE_CASE_COPILOT off |
| billing.evidence_copilot | deterministic | controlled_pilot | MAPABLE_BILLING_EVIDENCE_COPILOT off |
| intake.document_classify | deterministic | synthetic_only | MAPABLE_AI_INTAKE off |
| intake.field_extract | deterministic | synthetic_only | MAPABLE_AI_INTAKE off |
| mission.evidence_graph | deterministic | controlled_pilot | MAPABLE_MISSION_GRAPH off |
| mission.semantic_retrieval | deterministic | controlled_pilot | MAPABLE_SEMANTIC_RETRIEVAL off |
| edge.visit_pack_summary | deterministic | controlled_pilot | MAPABLE_EDGE_AI off |
| edge.what_changed_explain | deterministic | controlled_pilot | MAPABLE_EDGE_AI off |
| agent.aura_harness | deterministic | experimental | MAPABLE_AURA_HARNESS off |
| agent.aura_recognise | deterministic | experimental | rides AURA harness flag |
| understanding.contextual | model_backed | experimental | MAPABLE_UNDERSTANDING off |
| navigator.provider_search.interpret | hybrid | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED off |
| navigator.provider_search.reply | model_backed | experimental | MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED off |
| navigator.provider_search.match | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED (+ MATCHING) off |
| navigator.provider_search.draft_service_request | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENVELOPES off |
| navigator.provider_search.escalate | deterministic | experimental | MAPABLE_NAVIGATOR_PILOT_ENABLED off |

### Relational Intelligence (registered, not live)

All relational keys default **false**. Production enablement remains blocked until Phase 08 GO.

| Capability key | Backend | Maturity | Flag default |
|---|---|---|---|
| relational.interpret | hybrid | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED off |
| relational.clarify | model_backed | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED off |
| relational.explain | deterministic | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED off |
| relational.draft | deterministic | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT off |
| access.search.read | deterministic | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH off |
| human.help.request | deterministic | experimental | MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP off |

Communication Passport SoT for relational UX: `lib/support/communication-passport` (see `lib/ai/relational/communication-passport.ts`).
Provider Finder chat now routes through `assertProviderFinderChatAllowed` (deterministic fallback when `SEARCH_AGENT_ENABLED` off).

Navigator pilot surfaces (Decision Passport, governed memory, matching) also require
`MAPABLE_NAVIGATOR_PILOT_PASSPORT` / `_MEMORY` / `_MATCHING` (all default false).
See [NAVIGATOR_ASSURANCE.md](./NAVIGATOR_ASSURANCE.md).

## Agentic Nerve Centre (foundation consolidation)

Canonical operational agent registry: `lib/ai/platform/agents/` (exactly eight operational
agents). CareOS `selectCareOSAgentNetwork` is a deprecated compatibility adapter.
Safeguarding is a human escalation gate (not an operational agent). Robotics remains
research-only and is excluded from the operational registry.

This consolidation does **not** expand AI operational authority, enable autonomous writes,
or change public production claims. See [AGENTIC_NERVE_CENTRE.md](./AGENTIC_NERVE_CENTRE.md).

Admin: `/admin/ai/agents`. APIs (admin): `GET /api/ai/agents`, `GET /api/ai/agents/:id`,
`POST /api/ai/agents/activation-preview` (read-only preview).

## Mission Runtime (Prompt 01 — not production-live)

Participant-facing cross-domain mission planning when `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED=true`.
Implementation: `lib/ai/platform/missions/`. My MapAble integration via Life Intent **Build mission**.
See [MISSION_RUNTIME.md](./MISSION_RUNTIME.md).

| Surface | Status |
|---------|--------|
| Mission APIs | Implemented, flag-gated |
| My MapAble Mission View | Implemented, flag-gated |
| Durable mission persistence | Deferred (in-memory store; Prompt 02A if required) |
| Action proposal execution | Prompt 02 Governed Action Kernel (flag-gated) |

## Governed Action Kernel (Prompt 02 — not production-live)

Approval-bound execution for Phase 02 request/communication/preference actions when
`MAPABLE_ACTION_KERNEL_ENABLED=true`. Implementation: `lib/ai/platform/actions/`.
My MapAble Action Review via Mission View. See [GOVERNED_ACTION_KERNEL.md](./GOVERNED_ACTION_KERNEL.md).

| Surface | Status |
|---------|--------|
| Action proposal / approve / reject / execute APIs | Implemented, flag-gated |
| Approval binding + replay/idempotency | Implemented (in-memory; Prompt 02A for durable) |
| Domain adapters (care, transport, messaging, preference, coordination) | Implemented |
| Authority expansion | None |

## Adaptive Recovery Engine (Prompt 03 — not production-live)

Automatic reassessment without automatic redecision when
`MAPABLE_ADAPTIVE_RECOVERY_ENABLED=true`. Implementation: `lib/ai/platform/recovery/`.
See [ADAPTIVE_RECOVERY_ENGINE.md](./ADAPTIVE_RECOVERY_ENGINE.md).

| Surface | Status |
|---------|--------|
| Event / reassess / recovery APIs | Implemented, flag-gated |
| My MapAble recovery sections | Implemented, flag-gated |
| Action Kernel proposal prep on select | Integrated (no auto-execute) |
| Durable event/version persistence | Deferred (in-memory; Prompt 03A if required) |


## AI Control Plane (Prompt 11 — not production-live)

Reliability + observability + cost control when `MAPABLE_AI_CONTROL_PLANE_ENABLED=true`.
Implementation: `lib/ai/platform/control-plane/`. Admin: `/admin/ai/control-plane`.
Observes system health only — never scores participants. See [CONTROL_PLANE.md](./CONTROL_PLANE.md).

## MapAble-Native Intelligence R&D (Prompt 13 — experimental / Labs only)

MapAble-owned model portfolio + routing + local/open-weight adapters + governed
retrieval policy + training-proposal templates. Does **not** replace the production
gateway. Does **not** auto-promote models. Does **not** expand authority.

| Flag | Default |
|---|---|
| `MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED` | false |
| `MAPABLE_LOCAL_MODEL_ROUTING_ENABLED` | false |

Implementation: `lib/ai/platform/native-intelligence/` (extends
`lib/ai/platform/models/registry.ts`). Labs: `/labs/native-intelligence`.
See [NATIVE_INTELLIGENCE_RND.md](./NATIVE_INTELLIGENCE_RND.md).

| Surface | Status |
|---------|--------|
| Portfolio metadata on canonical registry | Implemented |
| Task router (fail-closed) | Implemented, flag-gated |
| Local/OSS adapter | Experimental stub, Labs/eval gated |
| Governed retrieval seeds | In-memory, provenance required |
| Training proposals | Template + governance gates only |
| Production gateway replacement | **None** |
| Authority expansion | **None** |

## Advanced AI Expansion train (≤ 3)

1. Evidence Intake contracts (`lib/ai/platform/intake/`)
2. Mission Evidence Graph + hybrid retrieval
3. Companion Edge AI broker + ProcessingReceipt

See [ADVANCED_MERGE_TRAIN.md](./ADVANCED_MERGE_TRAIN.md) and [INTAKE.md](./INTAKE.md).

## Still deferred (follow-on checkpoint)

AURA Agent OS mega-branches (`lib/aura/`), VisionAccess multimodal, Quality & Safeguards Copilot, Continuity Copilot, live OCR, embeddings, computer-use.

The in-process **AURA Agentic Risk Harness** (`lib/aura-harness/`) is separate from deferred Agent OS — see [AURA_HARNESS.md](./AURA_HARNESS.md).

**Registry honesty gap (Prompt 0):** Previously `agent.aura_harness` / `agent.aura_recognise` appeared in this table but were absent from `seed.ts`. Phase 1 of the Navigator governed pilot registers those keys plus `navigator.provider_search.*`, with an ARC sidecar (classification only — no runtime authority). See [NAVIGATOR_GOVERNED_PILOT_PHASE_0.md](./NAVIGATOR_GOVERNED_PILOT_PHASE_0.md).

### CareGPT (design only)

| Capability key | Backend | Maturity | Flag default |
|---|---|---|---|
| care.gpt (planned) | hybrid | controlled_pilot | `MAPABLE_CARE_GPT_ENABLED` off — **not registered / not implemented** |

Participant-facing Care conversational surface at `/care/gpt` (planned). Orchestrates Care APIs, Co-Pilot drafts, and care agents; never silent book/assign/bill. Spec: [docs/modules/caregpt.md](../modules/caregpt.md).

## Claim honesty

All ConvergenceOS public claims remain `publicClaimAllowed: false`. `MAPABLE_AI_PUBLIC_CLAIM_ENABLED` defaults false.
