# Prompt 06 — Accessible Field Validation & Community Reporting

## Objective

Implement accessible field validation allowing users and paid validators to submit structured accessibility evidence with moderation, privacy protections, and contributor reputation for evidence quality only.

## Non-goals

- Treating contribution volume as authority
- Public scores of disabled contributors
- Requiring photos or free text when structured controls suffice

## Prerequisites

- Prompt 01 merged (governance, paid validators)
- Prompt 02 merged (observation targets)
- Prompt 05 merged (event/corroboration patterns)

## Current claim state

**Proposed** — partial observation APIs; no full contribution workflow

## Contribution capabilities

Structured observations, photos (optional), confidence, time observed, feature selection, plain-language notes.

## Accessibility requirements (UI)

- Screen-reader usable
- Voice-control usable
- Switch-access usable
- Large target sizes
- Low cognitive load
- Photo optional; text input optional where structured controls suffice

## Privacy (before storage)

- Strip unnecessary image metadata
- Face/plate redaction pipeline or quarantine until redacted
- Avoid exposing home/private-location information

## Evidence states

`submitted` → `under_review` → `corroborated` → `verified` → (`rejected` | `expired`)

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `app/access/contribute/` — accessible contribution UI |
| Create | `lib/access/contribution/submission-service.ts` |
| Create | `lib/access/contribution/moderation-service.ts` |
| Create | `lib/access/contribution/image-privacy-pipeline.ts` |
| Create | `lib/access/contribution/contributor-reputation.ts` (quality only, not public) |
| Extend | `prisma/schema.prisma` — `AccessibilityContribution` |
| Extend | `app/api/access/observations/` or create contribution routes |
| Create | `tests/contribution/anonymous-identified-boundaries.test.ts` |
| Create | `tests/contribution/image-privacy.test.ts` |
| Create | `tests/contribution/revocation.test.ts` |
| Create | `tests/contribution/moderation.test.ts` |
| Create | `tests/contribution/duplicate-evidence.test.ts` |
| Create | `tests/contribution/malicious-submissions.test.ts` |
| Create | `tests/a11y/contribution-workflow.spec.ts` (Playwright) |

## Data model / API changes

- Contribution linked to graph observation on acceptance
- Rejected contributions do not affect routing
- Revocation removes future use; audit trail retained
- Contributor reputation internal only — affects moderation priority, not public ranking

## Tests required

- Anonymous vs identified contribution boundaries
- Image metadata stripped; faces/plates redacted or quarantined
- Revocation removes evidence from active routing
- Moderation queue enforces states
- Duplicate evidence linked not duplicated
- Malicious submissions rate-limited and rejected

## Docs to write

- Update `docs/innovation/co-design-governance.md` — field validator role

## Commit message (exact)

```
feat: add accessible evidence contribution workflow
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/contribution`
- [ ] `pnpm exec playwright test tests/a11y/contribution-workflow.spec.ts`
- [ ] Contribution UI passes axe scan
- [ ] No public contributor scores exposed

## Rollback notes

Disable contribution UI and API; pending submissions remain in `under_review` until processed or expired.
