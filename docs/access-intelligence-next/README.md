# Access Intelligence Next — Living Access Fabric

Programme name: **MapAble Living Access Fabric**.

This package delivers **Wave 0–5 foundation** plus **Waves 8–11** Living Access Fabric contracts:

- Versioned accessibility ontology
- Typed Access Query Language (AQL) AST + validation + fixture execution
- Personal Access Compiler interfaces
- Evidence envelopes and proof-carrying results
- Temporal vocabulary + Temporal Access Engine (shadow)
- Change detection reviews (auto-overwrite blocked)
- Synthetic Harbour Living Access Graph
- Proof-carrying door-to-room journey preflight with segment list
- Reliability profiles (bands + cannot_forecast)
- Journey failure / fragility graph with list alternative
- Counterfactual failure simulation (no external actions)
- Participant burden profiles (organisation-attributed, not participant scores)
- Outcome states distinct from route-found / service-confirmed

## Operating mode

**Synthetic / documentation / shadow.** All feature flags default off. No live adapters. No public production claims. No AI execution authority.

Optional durable evidence (still not production truth): see [EVIDENCE_PERSISTENCE.md](./EVIDENCE_PERSISTENCE.md) (`MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED`).

## Canonical ownership

| Concept | Owner |
| --- | --- |
| Public place identity | `AccessPlace` (`lib/access-map`) |
| Floor plans | `AccessFloorPlan` / indoor platform |
| Participant presentation prefs | `AccessibilityProfile` |
| Functional requirements (future) | AccessPassport (not yet on `main`) |
| Mission state | CareOSMission (CareOS tip — not yet on `main`) |
| Recovery | ContinuityOS tip **#288** |
| Fit / proof / graph projection | Access Intelligence Next |

## Related docs

- [REPOSITORY_RECONCILIATION.md](./REPOSITORY_RECONCILIATION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [RELIABILITY_AND_FAILURE.md](./RELIABILITY_AND_FAILURE.md)
- [COUNTERFACTUALS_BURDEN_OUTCOMES.md](./COUNTERFACTUALS_BURDEN_OUTCOMES.md)
- [NON_GOALS.md](./NON_GOALS.md)
