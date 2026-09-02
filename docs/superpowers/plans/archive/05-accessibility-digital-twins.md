> **Archived:** 2026-09-02 — Deferred post-demonstrator; evidence-backed twins only. Not on critical path.

# Prompt 05 — Accessibility Digital Twins (archived)

## Objective

Extend evidence-backed spatial models for venues, stations, campuses: twin draft → review → publication linked to Access Graph — no indoor navigation without sufficient evidence.

## Non-goals

- Production indoor nav without evidence
- AR/VR without G3 proof
- Duplicate place SoT

## Prerequisites

- Prompt 01 merged
- Prompt 06 in progress (assessor validation path)
- Portfolio epic: [E05 Accessibility Digital Twins](../innovation/epics/05-accessibility-digital-twins.md)

## Current claim state

**In development** — anchors: `docs/indoor-accessibility/*`, indoor access models

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | Indoor accessibility schema and publication workflow |
| Create | `lib/access/twins/twin-publication-service.ts` |
| Extend | `docs/indoor-accessibility/privacy-and-threat-model.md` |
| Create | `tests/access-twins/publication-gate.test.ts` |
| Create | `tests/access-twins/evidence-linked-spatial.test.ts` |

## Data model / API changes

- `AccessTwin` linked to `AccessPlace` with evidence references per spatial feature
- Publication states: `draft` | `under_review` | `published` | `archived`
- Preview API for participants shows uncertainty where evidence thin

## Tests required

- Unpublished twin not visible on public APIs
- Spatial feature without evidence cannot claim verified status
- Twin deletion does not orphan graph place SoT

## Docs to write

- Update `docs/indoor-accessibility/README.md`

## Commit message (exact)

```
feat: extend evidence-backed digital twin publication
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/access-twins`
- [ ] Publication workflow requires reviewer role
- [ ] Privacy threat model reviewed

## Rollback notes

Disable twin publication flag; drafts remain internal.
