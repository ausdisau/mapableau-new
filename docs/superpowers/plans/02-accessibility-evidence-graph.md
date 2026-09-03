# Prompt 02 — Accessibility Evidence Graph

## Objective

Implement the first production version of the MapAble Accessibility Evidence Graph. Accessibility facts must be evidence-backed rather than binary assertions. **Do not build routing UI in this PR.**

Salvage provenance taxonomy and false-safe tests from [archive/01-access-graph.md](./archive/01-access-graph.md).

## Non-goals

- Universal accessibility score
- Routing UI or route planning
- AI-only verification
- National live registry claim without G5 evidence
- Second operational database

## Prerequisites

- Prompt 00 merged
- Prompt 01 in progress or merged (governance for community evidence)
- Portfolio epic: [E01 Access Graph](../../innovation/epics/01-access-graph.md)

## Current claim state

**In development** — anchors: `AccessPlace`, `AccessObservationRecord`, `lib/access/infrastructure/`, `lib/access/intelligence-next/evidence/`, `lib/gais/contracts/evidence.ts`

## Domain types to create

`AccessibilityNode`, `AccessibilityEdge`, `AccessibilityFeature`, `AccessibilityObservation`, `EvidenceSource`, `EvidenceClaim`, `EvidenceConfidence`, `EvidenceFreshness`, `TemporaryCondition`, `AccessConstraint`, `FunctionalPreference`.

### Candidate edge properties (optional — unknown ≠ false)

`geometry`, `width`, `longitudinalGrade`, `crossSlope`, `surface`, `curbTransition`, `steps`, `doorClearance`, `liftDependency`, `crossingType`, `tactileFeatures`, `lighting`, `sensoryLoad`, `temporaryStatus`, `observedAt`, `confidence`, `sourceId`.

### Provenance states

`AUTHORITATIVE`, `VERIFIED`, `COMMUNITY_CONFIRMED`, `COMMUNITY_REPORTED`, `MODEL_INFERRED`, `STALE`, `UNKNOWN`.

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/access/infrastructure/` — graph domain types |
| Extend | `lib/access/intelligence-next/evidence/classes.ts`, `persist.ts` |
| Extend | `lib/gais/contracts/evidence.ts` |
| Create | `packages/contracts/src/evidence-provenance.ts` (canonical enum) |
| Extend | `prisma/schema.prisma` — graph nodes/edges, indexes |
| Evaluate | PostGIS on Neon vs app-side geo (document decision in migration) |
| Extend | `app/api/access/evidence-graph/route.ts` |
| Extend | `app/api/access-intelligence-next/graph/route.ts` |
| Create | `tests/access-graph/provenance-taxonomy.test.ts` |
| Create | `tests/access-graph/false-safe-unknown-vs-inaccessible.test.ts` |
| Create | `tests/access-graph/conflicting-observations.test.ts` |
| Create | `tests/access-graph/freshness-decay.test.ts` |
| Fix | `tests/access/access-graph-observation-service.test.ts` (pre-existing freshness failures) |
| Create | `docs/innovation/accessibility-evidence-graph.md` |
| Update | `docs/innovation/E01_ACCESS_GRAPH_G3_STATUS.md` |

## Database

- Use existing Neon/Postgres via Prisma
- PostGIS where appropriate (evaluate in PR — see [gap-analysis.md](../../innovation/gap-analysis.md))
- Indexes: bounding-box search, nearest-feature, route-segment lookup, freshness queries, source/provenance lookup
- Migrations with rollback strategy documented

## API

- Internal typed service interfaces **before** public endpoints
- Every assertion carries provenance envelope

## Tests required

- Unknown versus inaccessible
- Multiple conflicting observations preserved (not silently overwritten)
- Source precedence resolution
- Freshness decay (`STALE` state)
- Temporary barriers with expiry
- Historical observation retention for audit

## Docs to write

- `docs/innovation/accessibility-evidence-graph.md`

## Commit message (exact)

```
feat: add accessibility evidence graph foundation
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/access-graph tests/access/access-graph-observation-service.test.ts`
- [ ] Provenance visible in graph API responses
- [ ] No `MODEL_INFERRED` auto-promotion to `VERIFIED`
- [ ] Conflicting observations both retrievable

## Rollback notes

Disable `MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED` and intelligence-next flags. Migrations forward-only with documented rollback procedure.
