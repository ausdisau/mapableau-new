# Routing engine

**Module:** [`lib/access-intelligence/route-engine.ts`](../../lib/access-intelligence/route-engine.ts) (Dijkstra), costs in `route-cost.ts`.

## Graph

Nodes / edges live on Harbour Living Twin (`living/harbour-civic.ts`) and demo graphs. Edges carry width, steps, gradient, temporary barriers, lift flags, evidence confidence.

## Hard rejection

An edge is ineligible when it violates a required passport constraint: steps when step-free required, width below minimum, unavailable lift under outage, closed entrance at visit time, active blocking incident, etc.

Rejected alternatives (e.g. Entrance A) are returned alongside the recommended path — Visit UI lists them explicitly.

## Cost (eligible edges)

`distance + gradient + narrow-path + surface + sensory + uncertainty + live-condition` penalties. Optimisation goals (shortest / lowest effort / highest confidence / lowest sensory) weight terms; Living Visit currently defaults to highest confidence via journey context.

## Output

- Recommended ordered **text** instructions (map never required)
- Optional fallback
- `rejected: { summary, reasons[] }[]`

## Living Building demo

- Entrance A: stepped → rejected for step-free passports
- Entrance B: level entry → primary path when open
- Main lift → western lift when main lift outage incident is active
- Entrance B closed after 18:00 local (temporal engine)
