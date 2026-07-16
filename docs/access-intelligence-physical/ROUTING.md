# Routing — Physical Systems

Physical Concierge and Responsive Venue **reuse** Core Dijkstra routing. Do not reimplement pathfinding under `physical/`.

## Module

- Primary: [`lib/access-intelligence/route-engine.ts`](../../lib/access-intelligence/route-engine.ts)
- Costs: [`route-cost.ts`](../../lib/access-intelligence/route-cost.ts)
- Thin wrapper (planned): `lib/access-intelligence/physical/services/routes.ts` — passes twin graph + passport + incidents into `buildAccessibleRoute` / route engine.

## Behaviour (unchanged)

1. Hard-reject edges that violate required passport constraints (steps, width, gradient, lift outage, locked entrance, blocking incidents).
2. Dijkstra over eligible undirected indoor edges with weighted costs (distance, gradient, narrowness, surface, sensory, uncertainty, temporary conditions).
3. Return recommended path, optional fallback, and `rejected[]` with reasons (e.g. Entrance A stepped).

## Text instructions required

Every successful route **must** include ordered plain-language step instructions. Maps are optional ornamentation — never the only output. Physical UI lists steps as an ordered list (map-free), consistent with Core Living Visit and [ACCESSIBILITY.md](./ACCESSIBILITY.md).

## Physical integration points

| Input | Source |
|-------|--------|
| Nodes / edges | Harbour Living Twin / `AiRouteNode`+`AiRouteEdge` |
| Incidents | Twin live incidents + physical observations promoted to incidents |
| Passport | Core passport (field-minimised in agent tools) |
| Temporal closures | `living/temporal` (`getAccessStateAt`) |

When Safety Kernel denies an action (e.g. cannot unlock Entrance B), routing should recompute alternatives rather than inventing access.

## Related

Core [ROUTING_ENGINE.md](../access-intelligence/ROUTING_ENGINE.md) · [LIVING_ACCESS_TWIN.md](./LIVING_ACCESS_TWIN.md)
