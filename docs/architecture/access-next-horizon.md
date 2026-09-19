# Access NEXT horizon (SEEDED — not live)

These seams exist so tomorrow's work wraps today's services. **None are production-enabled.**

## MCP MapAble server

Future MCP tools must call `lib/access/services/tool-safe-services.ts` after MapAble identity, permission, consent, and audit.

Candidate tools: `search_access_places`, `get_access_evidence`, `calculate_access_fit`, `list_access_quests`, `submit_access_observation`, `plan_access_route`, `create_civic_issue_draft`.

Do not add MCP SDK dependencies until a runtime need exists.

## SensorThings / live infrastructure

Provider stub: `lib/integrations/access/sensorthings/`. Flag `MAPABLE_SENSORTHINGS_ENABLED=false`. Do not deploy FROST.

Temporal fields on evidence contracts: `observedAt`, `receivedAt`, plus realtime projection helpers under `lib/access/realtime/`.

## Asynchronous events (contracts)

Documented event names (no Kafka required now):

- `AccessObservationReceived`
- `AccessEvidenceCorroborated`
- `AccessCapabilityChanged`
- `AccessBarrierDetected`
- `AccessBarrierResolvedClaimed`
- `AccessEvidenceStale`

## Open311

Draft-first civic boundary under `lib/access/civic/` + `lib/integrations/access/open311/`. No autonomous submission. No real council posts in this phase.

## Accessible routing

Provider-neutral seam in `lib/integrations/access/routing/`. Navigate/Go remains preference owner. External engines supply geometry/time only.

## Analytics plane

Future: privacy-safe export → Parquet/GeoParquet → DuckDB. Do not replicate Neon into another warehouse for this ADR.

## On-device / private Access Agent

Personal requirements may stay on-device; MapAble receives minimum necessary functional queries. Vendor-neutral.
