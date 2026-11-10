# ADR — MapAble Day source of truth (Day 2.0)

**Status:** Accepted for Track A (`mapableau-new`)  
**Branch:** `cursor/mapable-day-v2-cc7c`  
**Base:** `origin/main` @ `58fffa6b`

## Decision

1. **Authoritative live reads for `/dashboard` My Day** are
   [`loadProgrammaticMyDay`](../../lib/dashboard/load-my-day.ts) and the
   [`MyDaySnapshot` certainty vocabulary](../../lib/dashboard/my-day-status.ts)
   (`confirmed` / `pending` / `cancelled` / `unknown`). Statuses come only from
   authorised `CareBooking` and `TransportTrip` records. Nothing is invented.

2. **CareOS My Day** and **Independence mock timeline** remain parallel products
   until a later unification PR. Day 2.0 does **not** invent a fourth source of
   truth and does not replace CareBooking / TransportTrip status.

3. **Reusable from MapAble PR #32** (pure libs only): dependency assessment,
   non-executing recovery proposals, DayEval harness, synthetic fixtures. Ported
   under [`lib/day/`](../../lib/day/) on mapableau-new. These never mutate SOR
   and never claim live verification.

4. **Legacy adapters:** dashboard panels remain the deployment UI. Progressive
   disclosure (Plan / Support / Changes / Sharing) expands under
   `MAPABLE_DAY_*` flags. The AI panel stays an optional stub gated by
   `MAPABLE_PARTICIPANT_MY_DAY_AI_ENABLED` + CareOS.

5. **Canonical reconciliation later:** when consolidating into MapAble, port
   back to `apps/web/lib/day/*`. Do not dual-maintain divergent engines.

## Out of first increment (remain disabled)

- QR access (`MAPABLE_DAY_QR_ACCESS_ENABLED`)
- Live writes (`MAPABLE_DAY_LIVE_WRITES_ENABLED`)
- Real worker handover (synthetic preview only)
- Calendar auto-load affecting readiness
- AI as authority
- Support-profile write-on-GET from Day aggregators
- Calendar `[eventId]` privilege expansion

## Recovery doctrine

Care `buildWorkerCancellationRecoveryOptions` and transport continuity builders
are safe as **read/display**. `initiate*` / `confirm*` / `proposeRecoveryOptions`
are writes — never invoke from Day preview. ContinuityRecoveryPanel remains
display-only.

## Identity

NextAuth remains the sole live session issuer. MapAbleID federation stays
disabled (`MAPABLE_IDENTITY_AUTHORITY_ENABLED=false`).
