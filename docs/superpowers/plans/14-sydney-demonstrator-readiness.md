# Prompt 14 — Sydney Demonstrator & Production Readiness

## Objective

Prepare MapAble for a bounded Australian metropolitan accessibility demonstrator with pilot selection scorecard, production gates, operations runbooks, and incident response — without assuming Sydney is automatically correct.

## Non-goals

- Broad national rollout
- Claiming production readiness without gate evidence
- Deploying with unresolved critical false-safe routing defects

## Prerequisites

- Prompts 07–13 materially complete or explicitly deferred with documented risk
- Existing: [`docs/operations/CONTROLLED_PILOT_CHARTER.md`](../operations/CONTROLLED_PILOT_CHARTER.md)

## Pilot selection scorecard

Evaluate candidate geographies on:

| Criterion | Weight |
|-----------|--------|
| Open GIS availability | High |
| GTFS / GTFS-Realtime quality | High |
| Municipal partnership readiness | High |
| Hospital/venue partners | Medium |
| Disability-community partnership | High |
| Geographic diversity | Medium |
| Accessibility evidence coverage | High |
| Operational cost | Medium |

**Current governance decision:** NSW region with Australia/Sydney staffed hours per controlled pilot charter. Document rationale even if Sydney is pre-selected.

## Pilot area definition (for chosen geography)

- Geographic boundary (GeoJSON)
- Baseline accessibility coverage (% verified features)
- Target coverage at demonstrator end
- Field-validation strategy
- Partner integration requirements
- Research protocol linkage (Prompt 10)
- Support model (staffed hours)
- Incident handling procedure
- Rollback plan

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `docs/pilots/sydney-nsw-demonstrator.md` |
| Create | `docs/operations/innovation-runbook.md` |
| Create | `docs/operations/accessibility-incident-response.md` |
| Create | `lib/pilot/demonstrator/scorecard.ts` |
| Create | `lib/pilot/demonstrator/boundary.ts` |
| Extend | `lib/pilot/controlled-pilot-baseline.ts` |
| Create | `tests/pilot/demonstrator-scorecard.test.ts` |
| Create | `.github/workflows/demonstrator-gates.yml` (or extend existing CI) |

## Production gates (all must pass)

| Gate | Command / evidence |
|------|-------------------|
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Integration tests | `pnpm test:integration` (if configured) |
| Playwright | `pnpm exec playwright test` |
| Mobile tests | mobile test suite |
| axe accessibility | axe in CI |
| WCAG 2.2 AA review | Manual checklist |
| Database migration verification | `prisma migrate status` |
| Security review | Sign-off record |
| Privacy review | Sign-off record |
| Load testing | k6 or equivalent results |
| Routing correctness | `tests/navigate/*` |
| Evidence provenance verification | `tests/access-graph/*` |
| False-safe accessibility suite | dedicated test suite |

**No deployment if a critical false-safe routing defect remains unresolved.**

## Docs to write

- `docs/pilots/sydney-nsw-demonstrator.md`
- `docs/operations/innovation-runbook.md`
- `docs/operations/accessibility-incident-response.md`

## Commit message (exact)

```
chore: prepare MapAble accessibility demonstrator
```

## Verification checklist

- [ ] Scorecard completed with documented rationale for NSW/Sydney
- [ ] All production gates documented with pass/fail status
- [ ] Runbooks reviewed by operations owner
- [ ] Rollback procedure tested in staging
- [ ] Golden journeys G1–G10 status updated in charter

## Rollback notes

Demonstrator flag off returns to controlled pilot boundary only.
