# Explainable Matching + Options Engine (Prompt 07)

Participant-directed, explainable **Options Engine** spanning Care, Transport, Jobs, and Access.

> The engine generates **OPTIONS**. It does **not** assign people, book transport, choose employment disclosure, or decide for the participant.

## Architecture

```
Participant requirements → Hard Constraint Filter → Evidence Eligibility
  → Rules-Based Candidate Set → Optional Model Explanation
  → Participant-Adjustable Ranking → Explainable Options
  → Participant Choice → Governed Action Proposal (Prompt 02)
```

Implementation: `lib/ai/platform/options-engine/`

## Consolidation

Facade over existing SoRs — not a parallel matching system:

| Existing | Role |
|----------|------|
| `matching.care_rules` | Deterministic care hard-filter |
| `matching.ai_overlay` | Optional commentary |
| Navigator matching | Stage-1/2 patterns reused |
| Transport suitability | Verified accessibility hard where required |
| Jobs match explanation | Disclosure-protected |
| GAIS/Access evidence | Source/freshness; absence ≠ accessible |

## Hard constraints (non-overridable)

required accessibility feature · verified vehicle suitability · required worker credential · availability window · location/service area · participant exclusion · employer/work requirement · consent/disclosure boundary

## Ranking dimensions (participant-adjustable)

access_fit · time_fit · availability · participant_preference · distance · continuity · known_cost · evidence_quality

## Fairness — MUST NOT

rank by profitability/ease · penalise complex disability requirements · infer from diagnosis · discriminatory steering · auto-assign/confirm/disclose

## Feature flags (fail-closed, default false)

`MAPABLE_OPTIONS_ENGINE_ENABLED` · `MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED` · `MAPABLE_OPTIONS_ENGINE_KILL_SWITCH`

## Persistence

In-memory only. Durable store → **Prompt 07A**.

## Authority changes

**NONE.**

## Recommended Prompt 08

Participant Journey Continuity Copilot — consume Options Engine choices + Recovery alternatives without expanding operational authority.
