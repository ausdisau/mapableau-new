# Prompt 10 — Health Access Research Pilot

## Objective

Build technical foundation for MapAble health-access research pilot measuring whether evidence-backed accessible journey planning reduces accessibility-related journey failure when travelling to health and community services.

## Non-goals

- **Clinical decision support** — do not diagnose, treat, or recommend healthcare
- Raw participant location traces to researchers without approved protocol
- Combining research consent with ordinary navigation consent

## Prerequisites

- Prompt 08 merged (RESEARCH data lane + separate consent)
- Existing: `lib/research/research-project-service.ts`, `MAPABLE_RESEARCH_GOVERNANCE_ENABLED`

## Research question

> Can evidence-backed accessible journey planning reduce accessibility-related journey failure when travelling to health and community services?

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `lib/research/journey/research-journey-protocol.ts` |
| Create | `lib/research/journey/research-journey-service.ts` |
| Create | `lib/research/journey/metrics/vajsr.ts` |
| Create | `lib/research/journey/metrics/supporting-measures.ts` |
| Create | `lib/research/journey/export/deidentified-export.ts` |
| Extend | `prisma/schema.prisma` — `ResearchJourney`, `ResearchJourneyEvent` |
| Create | `app/api/research/journeys/route.ts` (ethics-gated) |
| Create | `tests/research/journey/protocol.test.ts` |
| Create | `tests/research/journey/consent-separation.test.ts` |
| Create | `tests/research/journey/deidentified-export.test.ts` |
| Create | `docs/research/accessible-health-journey-pilot.md` |

## ResearchJourney protocol events

| Event | Description |
|-------|-------------|
| `planned_route` | Route selected with functional requirements |
| `route_evidence_state` | Snapshot of evidence confidence along route |
| `journey_start` | Participant begins journey |
| `journey_complete` | Successful arrival |
| `unexpected_barrier` | Barrier not predicted by route evidence |
| `reroute` | Accessibility-induced route change |
| `abandonment` | Journey abandoned |
| `participant_confidence` | Rated confidence (1–5) |
| `qualitative_feedback` | Optional free text |

## Primary metric

**Verified Accessible Journey Success Rate (VAJSR)**

```
VAJSR = completed_verified_accessible_journeys / total_completed_journeys
```

## Supporting measures

- Unexpected barrier rate
- Route abandonment rate
- Accessibility-induced reroute rate
- Missing evidence rate (segments with unknown provenance)
- Stale evidence rate
- Participant confidence (median)

## Consent & export

- Research consent separate from `core_navigation` consent (Prompt 08)
- Exports: de-identified/aggregated by default
- Raw traces: only with explicit protocol authorisation + ethics approval
- Withdrawal blocks pending exports; triggers purge workflow

## Tests required

- Participant can use core navigation without entering research
- Research events not written without research consent
- Export contains no direct identifiers by default
- VAJSR calculation matches fixture journeys

## Docs to write

- `docs/research/accessible-health-journey-pilot.md`

## Commit message (exact)

```
feat: add accessible journey research measurement framework
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/research/journey`
- [ ] Ethics gate returns 403 without approval
- [ ] Privacy review of export format

## Rollback notes

Disable `MAPABLE_RESEARCH_GOVERNANCE_ENABLED`; protocol tables remain empty.
