# MapAble-Native Intelligence R&D Layer (Prompt 13)

Architecture for a **MapAble-owned, disability-domain intelligence layer** that can
progressively reduce dependence on any single proprietary frontier model — exploring
open-weight, local inference, specialised small models, retrieval, routing, and
distillation/fine-tuning *where justified* — **without weakening existing governance**.

Preferred terminology: **MapAble-native intelligence** / **MapAble-owned model layer**.
Avoid ambiguous “indigenous AI” unless specifically discussing Aboriginal and Torres
Strait Islander AI / data governance.

## Critical constraints

| Constraint | Status |
|---|---|
| Does **not** replace the production AI gateway | Enforced |
| Does **not** auto-promote models to production | `canAutoPromoteModel() === false` |
| Models cannot bypass gateway or gain authority | Router asserts + tests |
| No training on unclear-license / participant data without governance | Proposal gates |
| Production / authority changes | **NONE** |
| Merge / deploy | **Do not** |

## Principle

**Not one giant model.** Prefer:

governed model portfolio + MapAble domain knowledge + deterministic algorithms +
retrieval + evals + participant-controlled context

## Architecture

```
Canonical Capability
        → Model Gateway (canonical — never bypassed)
        → Model Router (portfolio policy)
        → (Cloud gateway | Local/OSS | Deterministic)
        → MapAble Retrieval (provenance required)
        → Governance + Evals (Prompt 10 reuse)
```

High-impact **permission / mission / action policy** decisions remain **deterministic**
regardless of model.

## Feature flags (fail-closed)

| Env | Default |
|---|---|
| `MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED` | `false` |
| `MAPABLE_LOCAL_MODEL_ROUTING_ENABLED` | `false` (also requires master) |

## Code

| Path | Role |
|---|---|
| `lib/ai/platform/models/registry.ts` | **Extended** canonical registry (single registry) |
| `lib/ai/platform/native-intelligence/` | R&D layer (types, portfolio, router, local adapter, retrieval policy, training proposals, labs) |
| `lib/config/native-intelligence.ts` | Flags |
| `app/labs/native-intelligence/` | Experimental Labs surface |

## Model registry extensions

Each registration may declare: provider, deployment type, task suitability, data
residency, modalities, context size, latency class, cost class, evaluation status,
approved capabilities, prohibited data classes, fallbacks, `rndOnly`.

Do **not** hardcode “best model” assumptions — the router ranks candidates from
declarative metadata.

## Candidate task kinds

- intent classification
- domain routing
- plain-language explanation
- evidence summarisation
- retrieval reranking
- access-image interpretation
- structured extraction
- mission explanation

## Local / open-weight

Provider adapters for local inference where practical. Initial state: **experimental,
Labs only, evaluation gated**. Stubbed local assist avoids unbounded GPU spend until
an owner records an infra decision.

## Retrieval

Governed retrieval for policies, accessibility evidence, public disability guidance,
service info, approved domain docs — **with provenance**. Unverified business-plan
claims are not operational truth (`operationalTruth: false`).

## Training proposals

Template only (dataset card, model card, eval plan, privacy impact, compute,
rollback, licensing). Require insufficiency evidence for retrieval+prompting+rules
first. Reject unclear-license / scraped personal story patterns. Significant infra
spend → `awaiting_governance` (STOP for owner).

## Evals

Reuse Prompt 10. Candidates **cannot** promote on benchmark alone. Evaluate:
accessibility language, disability bias, instruction following, hallucination,
provenance, structured output, privacy, latency, cost, mission-quality impact.

## Persistence

No training data store. In-memory / registry code only.

## Authority

**AUTHORITY CHANGES: NONE.**  
**PRODUCTION CHANGES: NONE.**
