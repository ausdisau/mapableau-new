# Prompt 06 — Accreditation OS → Graph Publication

## Objective

Complete the operational accreditation pipeline: assessor site visit → measurements → human review → approved facts published to Access Graph with assessor provenance and expiry.

## Non-goals

- Legal compliance certification
- Auto-accreditation
- AI scoring without human review

## Prerequisites

- Prompt 01 merged
- Portfolio epic: [E06 Accreditation OS](../innovation/epics/06-accreditation-os.md)
- E09 Trust & Credential Network (assessor credentials)

## Current claim state

**Implemented, not independently verified** — anchors: `lib/access/accreditation*`, QMS models

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/access/accreditation*` services |
| Create | `lib/access/accreditation/graph-publisher.ts` |
| Extend | Prisma accreditation assessment models |
| Create | `tests/accreditation/graph-publication-gate.test.ts` |
| Create | `tests/accreditation/appeals-audit-trail.test.ts` |
| Update | `docs/innovation/epics/06-accreditation-os.md` |

## Data model / API changes

- Human review gate before any graph write
- Published facts carry `assessor_measured` / `independently_verified_claim` provenance
- Expiry and reassessment scheduling
- Appeals open correction path with audit history

## Tests required

- Assessment without human approval cannot publish
- Published facts appear in graph with correct provenance
- Expired accreditation marks graph assertions stale
- Appeals do not silently delete community evidence

## Docs to write

- Accreditation-to-graph workflow in epic doc

## Commit message (exact)

```
feat: complete accreditation-to-graph publication pipeline
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/accreditation`
- [ ] End-to-end dry run with Harbour fixture
- [ ] G4 credential expiry blocks silent approval

## Rollback notes

Disable graph publisher; assessments remain in accreditation tables only.
