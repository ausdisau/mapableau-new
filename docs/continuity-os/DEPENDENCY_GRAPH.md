# Dependency and Responsibility Graph

**Service:** `lib/continuity-os/dependency-projection.ts`  
**API:** `GET /api/life-events/[missionId]/dependencies`

Read-only projection from life-event templates + optional CareOS `graphJson`.

Every node includes a responsibility map (provider, MapAble role, participant role, complaint route, recovery responsibility). Unknowns are preserved (e.g. `reception_assistance` for `start_job`).

UI always provides a structured list (`DependencyList`) — never graph-only.
