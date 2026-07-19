# Supported Decision Studio

## Objective

Help participants understand and make decisions without replacing them.

## First vertical slice

**Worker replacement after a Care cancellation** — synthetic options, conflict disclosure, no auto-execution.

## Rules

- No default selection for consequential choices
- No provider-paid ranking
- No hidden options
- Private participant notes stay private
- Participant can proceed without AI and can request a human
- Commercial conflicts and recommendation sources are visible
- Studio emits `DecisionReceipt` only; Care/Transport execute elsewhere

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_DECISION_STUDIO_ENABLED` | false |
| `MAPABLE_DECISION_AI_EXPLANATIONS_ENABLED` | false |
| `MAPABLE_REVERSIBLE_DECISIONS_ENABLED` | false |

## Authority ceiling

`PARTICIPANT_SELECTS_ONLY` — `not_claimable`.
