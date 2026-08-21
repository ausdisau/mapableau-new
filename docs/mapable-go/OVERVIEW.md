# MapAble Go — Overview

**Claim state:** IN_DEVELOPMENT

MapAble Go is the participant-facing mobility and navigation layer within the existing MapAble ecosystem. It is **not** a standalone mapping product.

## Conceptual model

| Layer | Role |
| ----- | ---- |
| MapAble Access | Accessibility evidence (places, observations, provenance) |
| MapAble Navigate | Routing intelligence (suitability-weighted, not shortest-time-only) |
| MapAble Transport | Public transport and trip information (consume-only in slice 1) |
| MapAble Go | Participant journey experience orchestrating the above |

## Questions MapAble Go answers

- Can I get there?
- Which route best fits me?
- What barriers are known?
- What is uncertain?
- What changed?
- Where is the accessible entrance?
- What should I do if the route is blocked?

## First vertical slice

Power-wheelchair accessible journey planner behind feature flags (default OFF):

1. Choose destination (AccessPlace)
2. Confirm mobility routing preferences
3. Receive 2–3 route options with evidence confidence
4. Choose route → Guided / List / Map modes
5. Report barrier → reroute
6. Destination accessible entrance where evidence exists

**Not in slice 1:** live public transport stitching, assistive input bridge, Navigate MCP writes, sensor telemetry, national OSM routing.

## Safety boundary

MapAble Go must **never** control wheelchair propulsion, braking, steering, seating, or firmware. See [WHEELCHAIR_SAFETY_BOUNDARY.md](./WHEELCHAIR_SAFETY_BOUNDARY.md).

## Related docs

- [CURRENT_STATE_AUDIT.md](./CURRENT_STATE_AUDIT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
