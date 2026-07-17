# MapAble Access Weather (AccessCast)

**Tagline:** Know before you go.

AccessCast is a participant-facing, time-bounded accessibility outlook. It forecasts how usable a place, route, service, or complete journey is likely to be at the participant’s intended time, based on current evidence, known changes, reliability, service dependencies, and participant-selected requirements.

## Status

Wave 1 foundation: **synthetic contracts only**. No Prisma migration, no live feeds, no notifications, no production claims.

## Repository reconciliation (Wave 0 — verified 2026-07-17)

| Tip | Status | AccessCast reuse |
| --- | --- | --- |
| Access Intelligence Next Waves 0–5 (#303/#304/#306) | On `main` | Primary spine |
| Living Fabric + VisionAccess (#308) | OPEN | SPOF / model_candidate rules after merge |
| AccessOps (#309) | OPEN | Future temporal/ops adapter |
| Companion (#315) | OPEN | Offline Visit Pack (Wave 5) |
| Starting Work (#317) | OPEN | Taylor journey outlook (Wave 3) |
| Life Planner (#318) | OPEN | Event outlook later |
| ContinuityOS (#288) | CLOSED | Stub until SoR revived; #301 parked |

## Demo

- UI: `/accesscast/demo` (requires `MAPABLE_ACCESSCAST_ENABLED=true`, mode `synthetic`)
- API: `GET|POST /api/accesscast/demo`
- Journey UI: `/accesscast/journey` (also requires `MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED=true`)
- Journey API: `GET|POST /api/accesscast/journeys/demo/outlook`

See [JOURNEY_OUTLOOK.md](./JOURNEY_OUTLOOK.md).

## Safety

See [SAFETY_BOUNDARY.md](./SAFETY_BOUNDARY.md). AccessCast is **not** a safety guarantee, navigation authority, universal score, weather service, or emergency alerting platform.

## Ownership

Read-oriented projection under `lib/accesscast/**`. Canonical writers remain AccessPlace, Indoor, Transport, and (when merged) AccessOps.
