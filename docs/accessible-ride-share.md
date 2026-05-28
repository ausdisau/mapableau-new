# Accessible ride-share (MapAble)

Managed, consent-gated transport for people with disability — built on `TransportTrip`, not a generic gig marketplace.

## Journeys

### Participant books a ride

1. Open `/dashboard/transport/new` — mobility wizard prefills from `AccessibilityProfile` when available.
2. `POST /api/transport/trips` stores a canonical `MobilityRequirements` snapshot on the trip.
3. Trip detail shows advisory route estimate, suitability warnings for assigned vehicle, handover status, and accessible actions (no `window.prompt`).
4. Provider assigns eligible driver/vehicle; driver progresses the status machine and records safety/handover checks.

### Family nominee

Grant `transport.trip_access` via `/dashboard/consent` — summary view (suburb-level, status) without full addresses unless policy allows.

### Provider dispatch

`/provider/transport/dispatch` lists org trips. Match suggestions from `/api/provider/transport/trips/[id]/match-suggestions` are **advisory**; assignment stays manual via `POST .../assign` (422 returns eligibility reasons).

Route plans and optimisation jobs with `review_required` / `requiresHumanReview` appear in the **admin dispatch console** and require human approval before dispatch — they do not auto-assign drivers or vehicles.

### Pooling (phase 2)

Enable `TRANSPORT_RIDE_POOLING_ENABLED=true`. Use `/provider/transport/runs` to create a `RideRun`, attach trips, and **lock** the run after human review. Combined mobility uses strictest-wins intersection; vehicle must pass eligibility for all attached trips.

## Mobility vocabulary

Defined in `lib/transport/mobility-schema.ts` and aligned with `lib/validation/accessibility.ts` transport fields:

- Wheelchair access, ramp, lift, hoist
- Assistance animal
- Driver assistance and extra boarding time
- Access equipment verification

## NDIS billing bridge

When `TRANSPORT_BOOKING_BRIDGE_ENABLED=true`, completing a trip (`trip_completed` or `closed`) creates a linked `Booking` with `transportTripId`. Claims still require human approval; the platform does not auto-submit to NDIA.

## Safety

- `TransportSafetyCheck` and `TransportHandoverRecord` via `/api/transport/trips/[id]/handover`
- Safety events → safety centre (`/dashboard/safety`)
- No autonomous dispatch (`lib/av-framework/governance.ts`)

## Regulatory positioning

Community / NDIS coordinated transport — not a taxi substitute unless the provider holds appropriate accreditation (operational runbook, out of code scope).
