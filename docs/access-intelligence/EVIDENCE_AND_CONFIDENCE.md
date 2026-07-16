# Evidence and confidence

**Modules:** schemas in `schemas.ts`; scoring in [`confidence-engine.ts`](../../lib/access-intelligence/confidence-engine.ts); Harbour evidence ledger in [`living/harbour-civic.ts`](../../lib/access-intelligence/living/harbour-civic.ts).

## Provenance on every material claim

- source type / source name
- observation date
- verification / status (`verified`, `provisional`, `disputed`, `expired`)
- confidence
- evidence id
- dispute flag
- freshness / expiry

## Source reliability defaults (configurable)

qualified_assessor 1.00 · trusted_system_feed 0.95 · trusted_partner 0.88 · trained_mapper 0.82 · venue_attestation 0.75 · community_report 0.55 · ai_inference 0.25

## Rules

- AI inference is never shown as a calibrated measurement
- Photographs without calibration cannot assert exact dimensions
- Conflicting claims remain visible; disputed → unknown + confidence penalty
- Stale evidence lowers confidence; expired evidence does not count as current
- Venue attestation is labelled distinctly from assessor verification

## Harbour intentional evidence mix

High-confidence assessor measurements · venue attestation · recent community observation · stale toilet evidence · unknown toilet ops · disputed hearing loop · livable incident for main lift
