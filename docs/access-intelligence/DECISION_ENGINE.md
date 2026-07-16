# Decision engine

**Module:** [`lib/access-intelligence/fit-engine.ts`](../../lib/access-intelligence/fit-engine.ts) (`calculatePersonalFit`), plus `decision-engine/` package helpers. Living Twin wrapper: [`living/counterfactual.ts`](../../lib/access-intelligence/living/counterfactual.ts) `evaluateDecisionForTwin`.

## Four measures (never collapse into one score)

| Measure | Field | Meaning |
|---------|-------|---------|
| Venue Access Baseline | `baselineScore` | Place-level accreditation / baseline — does **not** override passport |
| Personal Access Fit | `personalFit` | Preference-weighted fit after required gates |
| Evidence Confidence | `evidenceConfidence` | Deterministic confidence engine 0–100 |
| Live Reliability | `liveReliability` | Incident / feed freshness |

## Status priority

1. Confirmed required failure → `blocked`
2. Required feature missing adequate evidence or `value: "unknown"` / `unknown_operational` → `unknown` (UI: “Information incomplete”)
3. Required pass with preferences/alternatives/live conditions/low confidence → `suitable_with_conditions`
4. Else → `suitable`

## Invariants

- AI / chat cannot change status, blockers, or unknowns
- Diagnosis labels are never inputs
- Disputed / conflicting claims contribute unknowns and lower confidence
- Unknown is not converted to accessible or inaccessible

## UI language

Suitable · Suitable with conditions · Blocked · Information incomplete
