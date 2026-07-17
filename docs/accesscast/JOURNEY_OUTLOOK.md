# AccessCast Journey Outlook — Starting Work

## Purpose

Forecast the accessibility outlook for Taylor’s Starting Work journey:

**Home → accessible transport → Harbour Civic Centre → western entrance → Lift A → Room 3.12 → return transport**

## Module

- `lib/accesscast/journey.ts` — `runStartingWorkJourneyAccessCast`
- `lib/accesscast/timeline.ts` — text-first timeline (authoritative)
- UI: `/accesscast/journey`
- API: `POST|GET /api/accesscast/journeys/demo/outlook`

## Flags

Requires:

- `MAPABLE_ACCESSCAST_ENABLED=true`
- `MAPABLE_ACCESSCAST_MODE=synthetic` (or shadow/documentation)
- `MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED=true`

## Outputs

- Segment outlooks with evidence, freshness, reliability, confirmation tasks
- Return journey evaluated (must not be hidden by outward success)
- Fragility windows / SPOF list
- Plain-language, print, and audio summaries
- Complete list alternative (no map required)

## Scenarios

| Scenario | Expected |
| --- | --- |
| `starting_work_tomorrow` | `fragile` / `cannot_confirm` / `stale` |
| `lift_outage` | `temporarily_unavailable` |
| `return_journey_fragile` | whole journey `fragile` |
| `conflicting_venue` | `conflicting` |

## Non-goals

- No live TransportTrip writes
- No ContinuityOS case creation
- No notifications
- No professional assessment replacement
