# AURA Wave 2 — Resilience Assessment

Describes **plan and service environment** resilience — never participant capability.

## Schema

`AuraResilienceAssessment` in `lib/aura/resilience/index.ts`

- level: `high` | `moderate` | `low` | `no_verified_fallback`
- dependencies (route, lift, entrance, transport, support, assistance, evidence, time)
- singlePointsOfFailure
- verifiedFallbacks vs unverifiedFallbacks (kept separate)
- noFallbackReasons

## Harbour flagship

With main lift out: western lift and Entrance B are SPOFs; no verified lift fallback → typically `moderate` / `no_verified_fallback`.

## Flag

`MAPABLE_AURA_RESILIENCE_ENABLED`
