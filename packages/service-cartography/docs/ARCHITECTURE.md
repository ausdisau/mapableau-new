# Package architecture

```
@mapable/service-cartography
  src/types.ts                canonical, dependency-free contracts
  src/consent.ts              purpose-scoped consent gate
  src/evidence.ts             evidence and expiry gate
  src/matching.ts             rights-first service offers
  src/graph.ts                relationship dependency planning
  src/accessible-routing.ts   verified-route pathfinding
  src/service-gaps.ts         aggregate regional unmet demand
  src/scheduling.ts           conflict-aware advisory scheduling
  src/economic-scenarios.ts   scenario exposure without rationing
  src/equity.ts               aggregate descriptive equity screen
  src/policy-neutrality.ts    political attribution relabel regression
  src/continuity.ts           service disruption alerts
  src/audit.ts                audit payload preparation
  src/index.ts                public entry point
  algorithms.registry.json    public algorithm inventory
  examples/demo.mjs           synthetic, runnable integration demonstration
  tests/*.test.mjs            Node native tests, no test runner dependency
  docs/                      human rights, architecture and assurance documents
```

## Data flows

`Authenticated MapAble Core adapter -> verified + permissioned domain input ->
rights gates -> advisory analysis -> accessible explanation + human review ->
separately authorised host action`

The library holds no database credentials, no participant records, no session,
no network connections and no integrations with payment systems. The host's
server-side boundaries must provide all authentication, authorisation, data
quality controls and audit persistence before real use.

## Deterministic replay

Each function accepts explicit inputs and, when temporal correctness matters,
a supplied time instant. It does not call `Date.now()` or make external
requests. Replaying the same input produces the same result, subject to
JavaScript numeric semantics and the same library version.

## Explainability

- Ranking returns component values and mandatory-exclusion reasons.
- Routing returns excluded segment reasons and a lack-of-evidence status.
- Gap mapping returns suppression and missing-supply status.
- Scenario modelling retains the stated needs alongside budget exposure.
- Scheduling returns explicit proposal status plus unscheduled reasons.

## Real-world rights and quality assurance

Function-level gates reduce accidental misuse but cannot replace independent
assurance, operational review, participant consent, a signed source-of-truth,
actual worker screening, legitimate service availability or legal advice.
