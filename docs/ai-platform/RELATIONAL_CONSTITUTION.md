# Relational Intelligence — Constitution & Contracts (Prompt 02)

**Status:** proposed policy-as-code (`not_claimable`)  
**Versions:** `relational-constitution.v0.1` · `relational-intelligence.v1`  
**Owners:** ai-platform, accessibility, privacy · **Approvers:** product, privacy, safeguarding

## What this is

Versioned Relational Constitution rules and typed participant-control contracts.
No live models, no participant UI, no training-data collection, no Prisma migration.

## Service vs training consent

| Purpose | Kind | Notes |
|---|---|---|
| `relational.service_assistance` | service | Default assistance path |
| `relational.memory` | service | Optional memory within service use |
| `relational.data_sharing` | service | Explicit sharing only |
| `relational.human_escalation` | service | Human help route |
| `relational.model_training` | training | Independent; never implied by service |

Declining AI or training must not block core access. Non-AI / deterministic routes remain available.

## Participant control

`STOP`, `WAIT`, and `NO` take effect immediately via `decideImmediateControl`.
Long pauses use `policyForLongPause` and must not create refusal, incapacity, or emotion inferences.

## Decision Passport

`decisionPassportSchema` is purpose-minimised and revision-friendly.
Corrections use `applyInterpretationCorrection` (auditable revision; history retained via `previousRevisionRef`).

## Change control

See `RELATIONAL_CONSTITUTION_CHANGE_CONTROL` in `lib/ai/relational/constitution.ts`.
Additive changes only; pin constitution and policy versions; unknown enums fail closed.
