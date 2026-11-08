# MapAble Day 2.0 — PRD (Track A)

## Goal

Improve participant My Day on `mapableau-new` with competitor-informed oversight,
synthetic continuity demos, and DayEval coverage — without a new planning
authority, migrations, or live writes.

## In scope

- A1: “Changes affecting my day” from authorised snapshot facts  
- A2: Care Routine Studio preview (synthetic, flag-gated)  
- A3: Continuity scenarios via `lib/day` (display-only)  
- A4: Worker handover preview (explicit synthetic)  
- A5: Help/recovery display adapters (non-executing)

## Out of scope

- Production flag enablement  
- QR / live writes  
- Support-profile GET from Day  
- Calendar mutate deep-links  
- Dual-maintaining MapAble `apps/web/lib/day` in this PR  

## Flags (default off)

```
MAPABLE_DAY_V2_ENABLED=false
MAPABLE_DAY_ROUTINES_DEMO_ENABLED=false
MAPABLE_DAY_HANDOVER_DEMO_ENABLED=false
MAPABLE_DAY_CONTINUITY_DEMO_ENABLED=false
MAPABLE_DAY_QR_ACCESS_ENABLED=false
MAPABLE_DAY_LIVE_WRITES_ENABLED=false
```

## Success

- Flags off → My Day behaviour unchanged except additive empty Changes section when v2 off remains hidden  
- DayEval DAY-001–005 + DAY-013–026 pass  
- Draft PR only; no production deploy  
