> **Archived:** 2026-09-02 — Superseded by [04-personalised-accessible-routing.md](../04-personalised-accessible-routing.md) (Prompt 04 in series v2).

# Prompt 03 — Accessible Navigation (False-Safe Routing) (archived)

## Objective

Implement suitability-weighted accessible routing that respects passport requirements, surfaces evidence provenance and freshness per segment, and never presents inferred or unknown access as verified.

## Non-goals

- Guaranteed accessible arrival claims
- Indoor routing at scale before E05 evidence
- Shortest-time-only optimisation hiding barriers

## Prerequisites

- Prompt 01 merged (graph with provenance)
- Prompt 02 merged (passport compatibility)
- Portfolio epic: [E03 MapAble Navigate](../innovation/epics/03-navigate.md)

## Current claim state

**In development** — anchors: `lib/transport/*`, `types/transport-routing.ts`, `lib/access/intelligence-next/graph/*`

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/transport/routing/*` or routing service layer |
| Extend | `lib/access/intelligence-next/graph/journey-preflight.ts` |
| Create | `lib/navigate/suitability-scorer.ts` |
| Create | `lib/navigate/segment-provenance.ts` |
| Extend | `app/api/access-intelligence-next/journey-preflight/route.ts` |
| Create | `tests/navigate/false-safe-routing.test.ts` |
| Create | `tests/navigate/unknown-vs-inaccessible.test.ts` |
| Extend | `tests/transport-scheduling-routing.test.ts` |

## Data model / API changes

- `RouteSegment` includes: `provenance`, `freshnessState`, `suitabilityScore`, `blockingUncertainty`
- Routing weights: gradient, surface, stairs, lift status, sensory, rest points
- Temporary barrier ingestion triggers recalculation event

## Tests required

- Inferred evidence cannot produce "verified accessible" label
- Unknown segment blocks false-safe recommendation or shows explicit uncertainty
- Lift outage changes route without silent failure
- Non-AI step-by-step fallback available

## Docs to write

- `docs/mapable-go/ACCESS_GRAPH.md` — routing integration section
- Update `docs/innovation/epics/03-navigate.md`

## Commit message (exact)

```
feat: add false-safe accessible routing foundations
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/navigate`
- [ ] Journey preflight API returns per-segment provenance
- [ ] Manual review of uncertainty UI copy

## Rollback notes

Disable navigate routing flags; fall back to preflight-only advisory mode.
