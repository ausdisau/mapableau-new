> **Archived:** 2026-09-02 — Superseded by [09-governed-ai-evidence-pipeline.md](../09-governed-ai-evidence-pipeline.md) (Prompt 09 in series v2).

# Prompt 04 — Access Intelligence Vision (R&D Scaffold) (archived)

## Objective

Scaffold human-supervised computer-vision evidence capture: photo upload → CV proposal → moderation queue. All outputs locked to `AI_INFERRED` / `model_candidate` — never verified.

## Non-goals

- CV-only accreditation
- Auto-publish to verified graph
- Production-scale inference without governance (see Prompt 09)

## Prerequisites

- Prompt 01 merged (observation ingestion targets)
- Portfolio epic: [E04 Access Intelligence Vision](../innovation/epics/04-access-intelligence-vision.md)

## Current claim state

**Exploratory** — superseded for production AI path by Prompt 09

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `app/api/access/vision/propose/route.ts` (internal, flag-gated) |
| Extend | `lib/access/intelligence-next/evidence/classes.ts` |
| Create | `lib/access/vision/proposal-schema.ts` |
| Create | `components/access/VisionProposalReview.tsx` (moderator UI) |
| Create | `tests/access-vision/proposal-unverified.test.ts` |
| Update | `docs/innovation/epics/04-access-intelligence-vision.md` |

## Data model / API changes

- `VisionProposal` record: model/version, confidence, input source, timestamp, geo, proposed feature
- Status: `pending_review` | `accepted_for_review` | `rejected` — never `verified`
- Photo consent at capture; face/plate blurring policy documented

## Tests required

- Proposal always enters as `model_candidate` / `AI_INFERRED`
- No path from propose endpoint to `AccessPlace` truth tables
- Moderation queue requires human actor

## Docs to write

- `docs/access-intelligence-next/VISION_CAPTURE.md`

## Commit message (exact)

```
feat: scaffold access intelligence vision capture
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/access-vision`
- [ ] Endpoint returns 404 when flag off
- [ ] Security review for upload handling

## Rollback notes

Disable vision proposal flag; no production graph impact.
