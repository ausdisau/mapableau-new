# Access as Infrastructure — NOW / NEXT / LATER

Status legend: **IMPLEMENTED** · **SEEDED** · **PROPOSED** · **EXPLORATORY**

## NOW — IMPLEMENTED (this branch)

| Capability | Status | Location |
| ---------- | ------ | -------- |
| Access Integration Gateway | IMPLEMENTED | `lib/integrations/access/` |
| Provenance + publication policy | IMPLEMENTED | `contracts.ts`, `provenance.ts` |
| Panoramax evidence adapter | IMPLEMENTED | `lib/integrations/access/panoramax/` |
| Project Sidewalk adapter + idempotent import | IMPLEMENTED | `lib/integrations/access/project-sidewalk/` |
| Evidence media abstraction (R2-ready) | IMPLEMENTED | `lib/access/evidence-media/` |
| MapAble Access Quests | IMPLEMENTED | `lib/access/quests/`, `app/access/quests/` |
| JSON-FG-ready public projection | IMPLEMENTED | `lib/access/interop/` |
| Overture-ready base geography boundary | IMPLEMENTED | `lib/integrations/access/overture/` (fixtures only) |
| Community Access Graph foundations | IMPLEMENTED | `lib/access/community-graph/` |
| Tool-safe domain services | IMPLEMENTED | `lib/access/services/` |
| Coolify / open-infra docs | IMPLEMENTED | `infra/open-infrastructure/` |

All consequential flags default **OFF**. No production activation.

## NEXT — SEEDED (contracts / ADRs / flag seams; not live runtime)

| Capability | Status | Notes |
| ---------- | ------ | ----- |
| MCP MapAble server | SEEDED | ADR only — wrap tool-safe services later |
| SensorThings / FROST | SEEDED | Adapter stub + flag; no FROST deploy |
| Async domain events | SEEDED | Documented contracts |
| Open311 civic bridge | SEEDED | Draft-first boundary; no real submissions |
| OTP / ORS / Valhalla overlay | SEEDED | Provider-neutral routing seam |
| DuckDB / GeoParquet analytics | SEEDED | ADR only |
| On-device Access Agent | SEEDED | Architecture note only |

## LATER — EXPLORATORY (optionality preserved; do not build)

A2A, agent discovery, Accessibility Compass / XR / spatial audio, robotic/LiDAR surveys, municipal digital twins, Accessibility Uptime, predictive fragility.

See `access-later-horizon.md`.

## Canonical ownership

MapAble owns: AccessPlace, GAIS, observations, capabilities, requirements, AccessFit, Community Access Graph.

External systems are replaceable providers behind the Access Integration Gateway.
