# MapAble Day 2.0 — Vercel preview notes

## Project mismatch

| Surface | Likely Vercel project | Notes |
|---|---|---|
| Legacy mapableau | `mapableau` | Historical deployments; may show ERROR states unrelated to Day 2.0 |
| This repo (`mapableau-new`) | `mapableau-new` (confirm in team) | Day 2.0 draft PR targets this codebase |

Do **not** change production env, DNS, or project settings from this track.
Preview only if isolated preview access is verified for the PR branch.

## Pre-existing ERROR deployments

Prior Vercel ERROR deployments on mapableau / mapableau-new (lint spawn, OOM,
Prisma ads noise) are documented here so Day 2.0 CI failures can be separated
from known platform issues. Investigate new failures only after confirming they
are not those baselines.

## Flags for preview (never production)

If a safe preview is approved separately:

```
MAPABLE_DAY_V2_ENABLED=true
MAPABLE_DAY_ROUTINES_DEMO_ENABLED=true
MAPABLE_DAY_HANDOVER_DEMO_ENABLED=true
MAPABLE_DAY_CONTINUITY_DEMO_ENABLED=true
MAPABLE_DAY_QR_ACCESS_ENABLED=false
MAPABLE_DAY_LIVE_WRITES_ENABLED=false
```

QR and live writes remain hard-off in [`lib/config/mapable-day.ts`](../../lib/config/mapable-day.ts).

## GO / NO-GO

- **GO:** draft PR review; synthetic demos behind flags  
- **NO-GO:** production enablement, live dispatch, QR, live writes, merge without review  
