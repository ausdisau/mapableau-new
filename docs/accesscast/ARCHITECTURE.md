# AccessCast Architecture

## Role

AccessCast is a **read-oriented intelligence projection**. It composes:

AccessPlace / Living Access Twin → AccessOps (future) → Access Intelligence Next → Transport / services → ContinuityOS (future) → AccessCast → Companion / Life Planner / Visit Pack.

## Layers

1. **Adapters** — read synthetic Harbour fixtures (Wave 1); later AccessPlace, AccessOps, TransportTrip.
2. **Pipeline** — deterministic: requirements → horizon → graph → baseline → conditions → freshness → services → reliability → burden → state → envelope → render.
3. **Rules** — `calculateAccessCastState` is the sole authoritative state function. LLMs may explain output only.
4. **Presentation** — AccessCast card, text-first timeline, list alternative to any map.

## Forecast horizons

| Horizon | Range |
| --- | --- |
| nowcast | 0–30 min |
| near_term | 30 min–4 h |
| day_outlook | 4–24 h |
| planning_outlook | 1–14 days |
| long_range | >14 days (baseline + scheduled changes only) |

## Module layout

```
lib/accesscast/
  types.ts
  states.ts
  flags.ts
  evidence.ts
  rules.ts
  harbour-fixture.ts
  forecast.ts
  index.ts
```

## Non-writers

AccessCast must not write places, floor plans, features, incidents, trips, care shifts, equipment, worker availability, venue status, participant requirements, or recovery cases.
