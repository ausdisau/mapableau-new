# Rule and Standard Registry

Service: `lib/accessibility-ops/rules/rule-registry-service.ts`

## Profiles

ACT-compatible web, mobile, document, built_environment, service_workflow, procurement_conformance, lived_experience, design_system, mapable_internal.

Do not force non-web rules into ACT format.

## Outcomes

`passed` | `failed` | `inapplicable` | `cannot_tell` | `manual_review_required` | `lived_experience_review_required` | `evidence_expired` | `disputed`

## Source governance

Each rule links to `AccessibilityStandardSource` (organisation, title, version, status, retrieval date). Source updates require human impact review — models never auto-promote production rules.

## Baseline seeds

- `mapable.ds.visible_focus`  
- `mapable.ds.refusal_discoverable`  
- `mapable.doc.pdf_structure`  
- `mapable.built.evidence_freshness`  
- `mapable.service.accessible_channel`
