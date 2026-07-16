# NDIS digital platform scope

## Purpose

Versioned questionnaire and assessment workflow for whether a MapAble function may fall within published Commission descriptions of platform providers.

## Authority boundary

| Input | Treatment |
|-------|-----------|
| Commission platform-provider guidance | `implementation_guidance` — versioned in `RegulatorySourceVersion` |
| Final registration instruments (when published) | Future `enacted_requirement` rows only after legal review |
| Assessment `result` enum | Review opinion / workflow state — **not** a legal classification |

## Result states

- `likely_in_scope`
- `likely_out_of_scope`
- `mixed_function_review_required`
- `insufficient_evidence`
- `legal_review_required`

Assurance officers cannot finalise `likely_in_scope` / `likely_out_of_scope` without a legal-reviewer path. High-signal marketplace answers default to `legal_review_required`.

## Questionnaire version

`mapable-platform-scope-v1-2026-07-16` in `lib/platform-assurance/scope-questionnaire.ts`.
