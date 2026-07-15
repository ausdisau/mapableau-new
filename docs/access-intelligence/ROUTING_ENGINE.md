# Routing engine

Dijkstra over indoor graph (`buildAccessibleRoute`). Hard rejects stepped edges when step-free required, closed entrances, outaged lifts, temporary barriers.

Optimisation weights live in `route-cost.ts`. Text instructions are mandatory; maps are optional.
