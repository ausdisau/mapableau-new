# MapAble Sentinel — Convergence Decision

**Date:** 2026-09-14  
**Status:** Architecture correction for draft PR #593  
**Production status:** Not production ready  
**Authority impact:** None

## Decision

MapAble Sentinel must **not** become a second CareOS, a second Agentic Nerve Centre, a second Guardian, a second recovery engine, a second event fabric, a second human-operations queue, or a second action runtime.

Sentinel is a **thin supervisory composition/profile layer** over the existing MapAble AI Platform and canonical domain services.

The canonical authority chain remains:

```text
Canonical domain state/events
  -> Context Fabric / domain evidence
  -> Unified Guardian deterministic policy
  -> Mission Runtime / Recovery / Mission Watch as applicable
  -> participant or authorised human decision where required
  -> Governed Action Kernel
  -> canonical domain service
  -> audit / postcondition evidence
```

Sentinel adds a domain-specific supervisory interpretation of this chain for Care, Transport and Employment. It does not own the underlying business lifecycle.

## Why this correction is required

Repository and sibling-thread review shows that most of the capabilities originally described as Sentinel responsibilities already exist or are being developed elsewhere:

- **Unified Care & Support Guardian** — merged in PR #564 and present on `main`; deterministic purpose, consent, privacy, processing and safeguarding policy.
- **Mission Runtime** — canonical mission planning/routing surface under `lib/ai/platform/missions/`; an active sibling PR #523 continues work on its participant-facing nerve-centre integration.
- **Governed Action Kernel** — canonical execution boundary under `lib/ai/platform/actions/`.
- **Adaptive Recovery** — canonical reassessment/recovery surface under `lib/ai/platform/recovery/`.
- **Context Fabric** — canonical provenance-aware context/event layer under `lib/ai/platform/context-fabric/`.
- **Mission Watch** — canonical temporal/dependency watch surface under `lib/ai/platform/mission-watch/`.
- **Human review** — current `lib/ai/platform/human-review/` contracts on `main`; active sibling PR #530 proposes the fuller Human Operations console.
- **Evaluation / adversarial safety** — current `lib/ai/platform/evaluations/`; active sibling PR #532 proposes a larger Nerve Centre safety lab.
- **Options / matching** — active sibling PR #534 proposes the canonical cross-domain options facade rather than a Sentinel-specific matcher.
- **Participant agency memory** — active sibling PR #528 proposes participant-controlled long-term preference/decision memory.
- **Companion / Ask MapAble** — PRs #562, #568 and #572 are converging the participant-facing assistant surface; Sentinel must expose structured supervisory status to this surface rather than create a parallel assistant.
- **ACSS Phase 0 audit** — active draft PR #567 explicitly concludes that MapAble is not greenfield and should evolve `lib/ai/platform` in place rather than create a parallel ACSS runtime.

## Canonical ownership matrix

| Concern | Canonical owner | Sentinel role |
|---|---|---|
| Identity / tenant | MapAble Core auth / organisation services | consume reference only |
| Consent / authority | canonical consent + authority services | verify/reference; never replace |
| Processing / safeguarding policy | Unified Guardian | adapt decision to supervisory presentation |
| Mission lifecycle | `lib/ai/platform/missions/` | observe relevant mission transitions |
| Domain context / events | Context Fabric + canonical outbox/domain services | subscribe/project; no new event SoR |
| Time/dependency monitoring | Mission Watch | register/use watches; no parallel scheduler |
| Reassessment / recovery | Adaptive Recovery | trigger/format domain profile; no parallel recovery store |
| Options / matching | domain matchers; future Options Engine if merged | consume candidate/evidence results |
| Human review | `human-review`; future Human Operations if merged | request handoff; no queue ownership |
| Execution | Governed Action Kernel | prepare/request proposal only |
| External integrations | Connector Gateway / canonical domain services | no raw connector authority |
| Audit / telemetry | canonical audit + AI telemetry | emit supervisory reason/provenance |
| Participant conversation | Ask MapAble / MapAble Companion | provide structured status/actions |
| Adversarial assurance | existing evaluations; future eval lab if merged | add Sentinel scenarios; no second eval framework |
| Durable orchestration | future platform `WorkflowEngine` abstraction | consume abstraction; do not bind domain logic directly to Temporal |

## Sentinel v1 responsibilities after convergence

Sentinel v1 is reduced to five responsibilities:

1. **Supervisory projection** — turn canonical domain facts + Guardian decisions into a stable domain-neutral supervisory disposition such as continue, verify, pause, participant confirmation, human review, deny or quarantine.
2. **Domain policy profiles** — define which Care, Transport and Employment transitions are consequential enough to require the supervisory projection.
3. **Cross-domain dependency hints** — identify dependencies between canonical mission nodes without owning mission or recovery state.
4. **Accessible explanation contract** — expose facts, possibilities, unknowns, reason codes, evidence references and available participant/human next steps to Companion/UI surfaces.
5. **Evaluation fixtures** — add synthetic Sentinel cases to the existing AI evaluation system and, if later merged, the Nerve Centre adversarial safety lab.

## What PR #593 must no longer build

The following original design elements are now **superseded before merge**:

- a canonical independent `SentinelCase` business lifecycle;
- an independent Sentinel event bus or event system of record;
- an independent recovery engine or continuity store;
- an independent human-review queue;
- independent matching/ranking logic;
- direct domain writes;
- a Sentinel-specific participant assistant/chat surface;
- a separate in-repo security/eval framework;
- direct coupling of domain logic to Temporal-specific Workflow code.

## Treatment of code already added to PR #593

### Keep, with narrowed meaning

- `lib/config/sentinel.ts` — fail-closed feature/profile flags.
- `lib/ai/platform/sentinel/policy-adapter.ts` — useful adapter from Guardian decisions to a Sentinel supervisory disposition.
- shared Sentinel reason/disposition contracts — useful if they remain projections rather than authoritative domain state.

### Refactor before merge

- `lib/ai/platform/sentinel/contracts.ts` — event envelope must become an adapter/projection over canonical `MapAbleDomainEvent` / domain outbox semantics rather than a competing envelope.
- `lib/ai/platform/sentinel/state-machine.ts` — must not become the canonical mission/recovery/human-review lifecycle. Replace with a **projection transition guard** or remove if existing mission/recovery state is sufficient.
- Transport preflight — keep only as composition over canonical Transport eligibility/evidence services and Guardian; never duplicate eligibility logic.

### Defer from PR #593

- direct `@temporalio/*` dependency installation;
- Temporal Worker entry point;
- Sentinel-owned durable workflow histories;
- full participant and human-operations UI.

These should converge with the ACSS durable-workflow phase through a platform-level `WorkflowEngine` interface. Temporal may later be one implementation of that interface after deployment, privacy, replay and data-residency review.

## Cross-thread convergence targets

### ACSS (#567)

Treat Sentinel as a supervisory profile within the evolve-in-place ACSS architecture. Do not create `lib/acss` or another execution plane merely to host Sentinel.

### Companion / Ask MapAble (#562, #568, #572)

Sentinel should return structured participant-safe status objects that Companion can render. Companion remains the conversational surface; Sentinel is not a chatbot.

### Human Operations (#530)

If/when merged, Sentinel's `HUMAN_REVIEW` disposition should enqueue through the canonical Human Operations interface. Until then, use existing human-review contracts without inventing another queue.

### Options Engine (#534)

If/when merged, Transport and Employment Sentinel profiles should consume Options Engine candidate explanations for recovery/choice. Sentinel itself must not rank people, workers, providers, employers or transport options.

### Agency Memory (#528)

If/when merged, Sentinel may read only participant-confirmed preferences relevant to the exact purpose. Model-inferred preferences remain proposed and must not silently affect gating.

### Eval Lab (#532)

Sentinel assurance scenarios should extend the existing evaluation harness. The external AGPL Sentinel security-testing project can remain a separate assurance service using synthetic/de-identified fixtures; it must not become an operational care authority.

## Revised implementation sequence

1. **Converge contracts** with Guardian + Context Fabric + Mission Runtime types.
2. **Refactor state handling** so Sentinel is a projection, not a new lifecycle owner.
3. **Implement Transport supervisory profile** by composing existing eligibility/evidence services; shadow-only first.
4. **Implement Employment supervisory profile** around consent/disclosure/access evidence; no employability scoring or autonomous disclosure.
5. **Add cross-domain mission dependency tests** using existing Mission Runtime + Recovery APIs.
6. **Add Companion-compatible status contract** without new conversational backend.
7. **Add existing-evaluation-harness scenarios** for forged facts, stale evidence, unknown-vs-incompatible, cross-tenant events, bypass attempts and prohibited autonomous actions.
8. **Only after platform durable-workflow convergence:** add a `WorkflowEngine` adapter and evaluate Temporal as an implementation.

## Non-negotiable invariants

- preference != consent;
- model signal != fact;
- credential verified != suitability;
- recommendation != approval;
- recovery alternative != restored continuity;
- unknown remains unknown;
- no automatic worker assignment;
- no automatic transport booking/replacement selection;
- no automatic employer disclosure or candidate rejection;
- no AI incident reportability, abuse substantiation or restrictive-practice authorisation;
- no funding/payment/claim approval;
- no emergency-services call or physical actuation;
- participant stop and human-help pathways remain directly available;
- all new flags remain off by default.

## Merge criterion for PR #593

PR #593 must remain draft until:

1. duplicated lifecycle/event/workflow ownership has been removed or clearly reduced to projection-only adapters;
2. Sentinel-specific tests prove it composes canonical modules rather than bypassing them;
3. current-main Guardian, mission, recovery, action and Context Fabric regression suites remain green for touched behaviour;
4. sibling open PRs are treated as optional future integration targets, not hidden runtime dependencies;
5. no production flag is enabled.
