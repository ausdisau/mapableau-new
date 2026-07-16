# Living Access Twin — Harbour Civic (Physical)

Physical Systems reuses the Core Living Access Twin. Flagship place: **Harbour Civic Centre** (`place-harbour-civic`) in `lib/access-intelligence/living/harbour-civic.ts`.

## Fictional status

Clearly synthetic. Address “100 Synthetic Quay, Demo Harbour NSW 2000”. Accreditation tier `synthetic-demo`. UI must warn: measurements do not represent a real venue.

## Twin elements (physical-relevant)

| Element id | Type | Notes |
|------------|------|-------|
| `hcc-dropoff` | drop_off | Accessible vehicle drop-off |
| `hcc-parking` | parking | Accessible parking |
| `hcc-path-exposed` / `hcc-path-shelter` | path | External approach trade-offs |
| `hcc-ent-a` | entrance | Stepped — rejected for step-free passports |
| `hcc-ent-b` | entrance | Level entry; temporal close after 18:00 |
| `hcc-reception` | reception | Ground orientation |
| `hcc-quiet-g` | quiet_space | Sensory preference |
| `hcc-lift` | lift | Main lift — demo outage incident |
| `hcc-lift-west` | lift | Alternate when main out |
| `hcc-corr-3` / `hcc-corr-west` | corridor | Width features on graph |
| `hcc-room` | room | Interview Room 3.12 destination |
| `hcc-toilet-2` | toilet | Accessible toilet; mixed evidence freshness |
| `hcc-display` | corridor | Temporary display / barrier scenarios |

Graph nodes/edges feed `route-engine` Dijkstra. Features carry evidence ids and confidence.

## Dynamic events (demo)

Used by Operate, Simulator, and Physical Responsive Venue scenarios:

- **Main lift outage** — active `lift_outage` incident; routes prefer western lift when eligible.
- **Entrance B after-hours** — temporal rule closes level entry; Concierge must surface unknown/blocked, not invent access.
- **Corridor display** — temporary obstruction / width uncertainty.
- **Toilet evidence mix** — stale / unknown ops teach Scout + confidence behaviour.
- **Disputed hearing loop** — conflict → unknown, not false certainty.

Counterfactuals and Access Coverage (≥16 synthetic passports) remain in `living/` — Physical Simulator should call the same APIs.

## Physical bindings

Demo device bindings map:

- `hcc-lift`, `hcc-lift-west` → mock lift adapter
- `hcc-ent-b` → mock door/entrance adapter
- place-level HVAC/status → mock BMS (read + simulated execute in demo only)

No real BACnet/MQTT/WoT/ROS connection.

## Persistence

Zod twin in code is source of truth for demo. Prisma `AiLivingTwinMeta`, temporal rules, mutation drafts, live status snapshots available when `ACCESS_INTELLIGENCE_USE_PRISMA` is enabled. Physical observations/actions add new `ai_physical_*` tables — they reference `placeId` / element ids, they do not fork the twin.

## Related

Core Living docs via [ARCHITECTURE.md](../access-intelligence/ARCHITECTURE.md), [TEMPORAL_ACCESS.md](../access-intelligence/TEMPORAL_ACCESS.md), [ROUTING_ENGINE.md](../access-intelligence/ROUTING_ENGINE.md) · [ROUTING.md](./ROUTING.md)
