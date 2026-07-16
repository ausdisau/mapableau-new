# Observation and evidence — Physical Systems

Aligns with Core [EVIDENCE_AND_CONFIDENCE.md](../access-intelligence/EVIDENCE_AND_CONFIDENCE.md) and `confidence-engine.ts`. Scout and feeds create **observations** that may promote to `AccessFeature` / `Evidence` only under explicit rules.

## Source types

Reuse Core `SourceType` reliability defaults:

| sourceType | Default reliability | Physical notes |
|------------|---------------------|----------------|
| `qualified_assessor` | 1.00 | Calibrated measurements |
| `system_feed` | 0.95 | BMS/lift status when authenticated |
| `trusted_partner` | 0.88 | Partner venue integrations |
| `trained_mapper` | 0.82 | Structured Scout mapping |
| `venue_attestation` | 0.75 | Staff claims — labelled distinctly |
| `community_report` | 0.55 | Pulse / Scout community |
| `ai_inference` | 0.25 | Model estimates — never “measured” |

## Observation fields (minimum)

- `placeId`, optional `elementId`
- `sourceType`, `sourceName`, `observedAt`
- `summary` (plain language)
- `calibrationConfirmed` (boolean)
- `mediaRefs[]` (optional; no binary in logs)
- `confidence` contribution inputs
- `status`: provisional | verified | disputed | expired

## Hard rule — no exact measurement from uncalibrated photo

If `sourceType` is photo-derived / `ai_inference` and `calibrationConfirmed !== true`:

- Do **not** assert exact millimetres, degrees, or lux as verified measurements.
- Allow qualitative tags (`appears_narrow`, `steps_present_unknown_count`) with low confidence.
- Fit engine treats missing calibrated width as **unknown**, not fail, unless a required constraint can be evaluated another way.

Calibrated assessor evidence remains the path to numeric door/corridor/lift widths on Harbour Civic.

## Promotion path

```
Scout observation → moderation / confidence → Evidence (+ optional Feature update)
                                              ↘ Action proposal only if twin+kernel allow
```

Disputed or conflicting values lower confidence and yield unknowns for required matches (Core behaviour).

## Live feeds

`system_feed` observations from Core `live/` adapters are status, not actuation. Stale feeds fail Safety Kernel freshness checks for dispatch; Concierge should prefer last-known **with explicit age** over silent upgrade.

## Related

[CONSENT_AND_PRIVACY.md](./CONSENT_AND_PRIVACY.md) · [SAFETY_KERNEL.md](./SAFETY_KERNEL.md) · Core [SAFETY_AND_GOVERNANCE.md](../access-intelligence/SAFETY_AND_GOVERNANCE.md)
