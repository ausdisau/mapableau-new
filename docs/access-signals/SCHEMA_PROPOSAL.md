# Access Signals schema proposal (unapplied)

Proposed Prisma models for a future migration — **not applied** in this PR:

- `AccessSiteZone` — precinct zones linked to `AccessPlace` (optional FK)
- `AccessNetworkNode` / `AccessNetworkEdge` — topology
- `AccessSignalAssessment` — RAG result, rule version, evidence refs
- `AccessSignalOperationalCondition` — temporary outages vs barriers
- `AccessRemediationItem` — placemaking lifecycle

No production migration ships with this slice. Synthetic TypeScript fixtures stand in.
