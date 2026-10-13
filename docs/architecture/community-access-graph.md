# Community Access Graph — foundations

PostgreSQL / Prisma first. No Neo4j required for NOW.

## Node kinds

`place`, `entrance`, `path`, `crossing`, `lift`, `facility`, `stop`, `observation`, `capability`, `barrier`, `journey`

## Edge kinds (foundation)

`has_entrance`, `has_path`, `has_crossing`, `has_lift`, `has_facility`, `supported_by_observation`, `has_barrier`, `journey_depends_on`, `stale_evidence_for`, `missing_evidence_for`

## Implemented helpers

`lib/access/community-graph/relations.ts` — typed slice builders.

`lib/access/community-graph/metrics.ts` — coverage / freshness / barrier density (no people scoring).

## Questions the graph should eventually answer

- Which entrance has step-free evidence?
- Which observations support this capability?
- Which journeys depend on this lift?
- Which access facts are stale?
- Where is critical evidence missing?

NOW implements relationship foundations and metrics methodology only.
