# Access Intelligence Next — Reliability and Journey Failure Graph

Wave 8–9 synthetic/shadow contracts.

## Reliability

- Path: `lib/access-intelligence-next/reliability/`
- API: `GET /api/access-intelligence-next/reliability?placeRef=harbour_civic`
- Flag: `MAPABLE_ACCESS_RELIABILITY_ENABLED` (default off; requires master enable)

Returns qualitative **bands** (`cannot_forecast`, `insufficient_evidence`, …).  
Does **not** fabricate precise failure probabilities.  
Does **not** treat absence of incidents as proof of availability.

## Journey failure graph

- Path: `lib/access-intelligence-next/journey/failure-graph.ts`
- API: `POST /api/access-intelligence-next/journey-failure-graph`
- Flag: `MAPABLE_JOURNEY_FAILURE_GRAPH_ENABLED`

Builds hard/optional dependencies, single points of failure, unverified fallbacks,  
timing conflicts, and authority gaps from the Harbour door-to-room preflight.

Always includes an accessible **list alternative** of dependency nodes.

## Non-goals

- Live BMS / sensor adapters
- ContinuityOS recovery execution
- Participant behaviour prediction
- Prisma persistence
- Public production claims
