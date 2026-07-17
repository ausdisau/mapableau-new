# Wave 11 — Impact assessment & detection

## Correlation (deterministic)

Rule-based, auditable. See `lib/continuity/detection/correlation-service.ts`.

- Stale or unvalidated signals → `hold_for_review` (never destructive).
- Signals without a participant scope → no case opened.
- Validated + fresh + participant-scoped → open or extend a `ContinuityCase`.

## Impact assessment (read-only)

`computeAndStoreImpact` walks the graph downstream, counts affected nodes and broken dependencies, and stores a `ContinuityImpactAssessment` snapshot on the case. It never mutates the graph or any operational row.

Impact levels: `none`, `minor`, `moderate`, `significant`, `critical`.
