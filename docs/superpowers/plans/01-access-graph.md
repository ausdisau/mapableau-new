# Prompt 01 — Access Evidence Graph

## Objective

Strengthen the canonical evidence-backed accessibility graph: full provenance on every assertion, freshness/expiry engine, and false-safe distinction between unknown, inferred, and verified states.

## Non-goals

- Universal accessibility score
- Legal compliance certification
- Passport exposure in public graph
- AI-only verification
- National live registry claim without G5 evidence

## Prerequisites

- Prompt 00 merged
- Portfolio epic: [E01 Access Graph](../innovation/epics/01-access-graph.md)

## Current claim state

**In development** — anchors: `AccessPlace`, `lib/access/*`, `lib/access/intelligence-next/*`, `lib/gais/*`

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/access/intelligence-next/evidence/classes.ts` |
| Extend | `lib/access/intelligence-next/evidence/persist.ts` |
| Extend | `lib/gais/contracts/evidence.ts` |
| Create | `packages/contracts/src/evidence-provenance.ts` (canonical type) |
| Extend | `prisma/schema.prisma` — `AccessObservationRecord`, expiry fields |
| Extend | `app/api/access-intelligence-next/graph/route.ts` |
| Create | `tests/access-graph/provenance-taxonomy.test.ts` |
| Create | `tests/access-graph/false-safe-unknown-vs-inaccessible.test.ts` |
| Update | `docs/innovation/E01_ACCESS_GRAPH_G3_STATUS.md` |

## Data model / API changes

- Canonical `EvidenceProvenance` enum: `verified`, `authoritative`, `community_confirmed`, `inferred`, `stale`, `unknown`
- Every graph edge/feature carries: `source`, `timestamp`, `evidenceType`, `verificationState`, `confidence`, `expiryAt`, `disputeHistory`
- Freshness engine marks stale assertions; routing must treat stale as uncertain (not absent)

## Tests required

- `tests/access-graph/provenance-taxonomy.test.ts` — all provenance values serialise and display
- `tests/access-graph/false-safe-unknown-vs-inaccessible.test.ts` — unknown ≠ inaccessible in routing projection
- Extend `tests/transport/accessibility/evidence-compatibility.test.ts`

## Docs to write

- Update `docs/innovation/epics/01-access-graph.md` claim state when gates pass
- Cross-link `docs/access-intelligence-next/ARCHITECTURE.md`

## Commit message (exact)

```
feat: strengthen access evidence graph provenance
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/access-graph`
- [ ] Provenance visible in graph API responses (shadow mode acceptable)
- [ ] No AI_INFERRED auto-promotion to verified

## Rollback notes

Disable `MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED` and intelligence-next flags.
