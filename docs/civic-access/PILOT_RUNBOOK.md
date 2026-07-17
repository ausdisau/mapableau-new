# Harbour Precinct Pilot Runbook

## Precinct composition (synthetic)

- 1 transport interchange
- 1 civic building (+ western entrance + lift)
- 1 health clinic
- 1 community hub
- 2 connecting paths
- 2 curb zones (drop-off + loading)
- 1 public toilet (disputed claim)
- 1 Changing Places facility (unknown)

## Enable

```bash
MAPABLE_CIVIC_ENABLED=true
MAPABLE_CIVIC_MODE=shadow
MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED=true
MAPABLE_CIVIC_USE_MEMORY=true
```

## Seed

1. Sign in as `mapable_admin` (or provider/transport operator with write).
2. Open `/admin/civic/pilot`.
3. Click **Seed Harbour precinct pilot** (or `POST /api/civic/pilot/seed`).
4. Review `/admin/civic/assets` — confirm AccessPlace refs and unknown/stale/disputed claims.

## Acceptance walkthrough (Wave 1 slice of Scenario A)

Officer lists precinct assets with source/date where present; linked synthetic AccessPlace IDs shown; missing features labelled **unknown**; audit event `civic.pilot_seeded` written; paid confidence boost rejected by invariants.

## Non-goals in this pilot stage

Public Observatory, live incidents, journey simulation, participant data, real government feed ingest.
