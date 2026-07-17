# AccessCast Safety Boundary

## Must not become

- a new AccessPlace database
- a second Living Access Twin
- a universal accessibility score
- a safety guarantee
- a navigation authority
- a participant risk score
- an emergency alerting platform
- a surveillance system
- a weather service
- a replacement for professional access assessment
- a replacement for orientation and mobility support

## Permanent deny flags

These remain false regardless of environment or client parameters:

- `MAPABLE_ACCESSCAST_SAFETY_GUARANTEE_ENABLED`
- `MAPABLE_ACCESSCAST_AUTO_ROUTE_CHANGE_ENABLED`
- `MAPABLE_ACCESSCAST_AUTO_BOOKING_ENABLED`
- `MAPABLE_ACCESSCAST_BACKGROUND_LOCATION_ENABLED`
- `MAPABLE_ACCESSCAST_DIAGNOSIS_INFERENCE_ENABLED`
- `MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED`
- `MAPABLE_ACCESSCAST_PAID_CONFIDENCE_ENABLED`

## Evidence rules

- Unknown hard requirements → `cannot_confirm`
- Failed hard requirements cannot return `stable` or `likely_usable`
- Stale critical evidence → `stale` or `cannot_confirm`
- `model_candidate` cannot independently create `temporarily_unavailable`
- Venue declaration ≠ independent verification
- Offline data beyond expiry cannot produce `stable`
- No fabricated reliability percentages without calibration evidence

## Kill criteria

Freeze AccessCast if safety/guarantee language ships, AI decides state, a place writer appears, background location is enabled, partner APIs leak requirements, offline casts are presented as live, or production claims are made without a supervised pilot.
