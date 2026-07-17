# AURA Wave 2 — Offline Visit Packs

Accessible offline-safe snapshot of a verified Visit Plan. **Not a live service.**

## Content

Route steps, fallback guidance, unknowns, blockers, conditions, live snapshot at generation time, evidence dates, non-AI links. Excludes diagnosis, full Passport, medical notes, funding by default.

## States

`current_snapshot` | `stale_snapshot` | `superseded` | `mission_stopped` | `deleted`

Stale after deterministic threshold (4h in Wave 2). Always show generation time and that live conditions may have changed.

## Formats

1. Structured JSON snapshot (in-memory / optional Prisma)
2. Standalone HTML (semantic headings, ordered lists, no script for core content, print-friendly)
3. Print via browser

No large PWA dependency in this wave. Later: service-worker cache.

## Flag

`MAPABLE_AURA_OFFLINE_PACKS_ENABLED`

## Risks

Shared-device persistence; delete guidance included. Never claim live currency after `generatedAt`.
