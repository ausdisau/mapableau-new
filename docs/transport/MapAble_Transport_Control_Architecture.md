# MapAble Transport Control — Architecture

Repository: `ausdisau/mapableau-new`.  
Companion decisions: [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md).  
Governing rule: [`.cursor/rules/mapable-transport.mdc`](../../.cursor/rules/mapable-transport.mdc).

## Mission

Bounded foundation for accessible transport booking, fleet scheduling, optional Leaflet/OSM visualisation, and authenticated Socket.IO status updates. Phase 0 hardens safety; Phase 1 adds a read-only schedule matrix and optional map. Live GPS broadcast, autonomous assignment, real bookings from sockets/LLMs, and payments are out of scope.

## Source of truth

| Concern | Model / path |
|---------|----------------|
| Operational trip | `TransportTrip` |
| Request | `TransportTripRequest` |
| Append-only ledger | `TransportTripEvent` |
| Dispatch | `TransportDispatchAssignment` |
| Group ride | `RideRun` |
| Quotes | `TransportQuote` / `TransportQuoteVersion` |
| Claims bridge | generic `Booking` via `booking-bridge-service` only |

Do not replace these with parallel booking-assignment stacks (#92) or resurrect CONFLICTING schedule solvers (#22). Schedule UI is a **read projection** over existing trips and availability.

## Policy properties

1. Participant choice and communication preferences are mandatory design inputs.
2. No diagnosis disclosure is required for functional vehicle fit.
3. Each rider must independently accept pooling (`poolingAccepted` on trip mobility snapshot).
4. Driver/vehicle eligibility is a hard gate (fail closed on unknown or expired credentials).
5. Quotes are not NDIS funding approvals.
6. No system may change bookings, claims, driver assignment, or service status merely because an LLM or socket event arrives.
7. Accessible help and explicit no-match, cancellation, incident, and manual recovery flows remain human-reachable.
8. Raw addresses and GPS stay behind purpose-limited consent and retention; use `projectLocationForStage()`.

## Privacy and third-party geo

- Exact pickup/drop-off: participant, authorised provider staff after assignment window, assigned driver in active statuses, audited admins.
- OSM tiles via `lib/config/openstreetmap.ts`; Nominatim/OSRM only within current terms.
- Never send confidential street addresses or participant identifiers to public geocoders.

## Realtime (ADR-11 closed)

**Decision:** Socket.IO via `apps/realtime-server` for transport control status reads. Persist events before any future broadcast. TanStack Query HTTP refetch / polling is the fallback. Pusher is not used for this control surface.

Phase 0: harden auth/CORS/membership; publish **contracts only** (no live emit).  
Phase 1: default-off client adapter reads status/assignment projections; sequence gap → HTTP refetch. GPS remains off.

## Map (Phase 1)

**Decision:** Schedule map uses **Leaflet 1.9.4** + OSM tiles, reusing `lib/map/leaflet-markers.ts` and openstreetmap config. Care-Transport MapLibre remains a separate pilot — do not dual-wire both into `/provider/transport/schedule`.

List/table views must remain fully usable when the map flag is off or tiles are offline (map–list parity).

## Phase boundaries

| Phase | Delivers | Must not |
|-------|----------|----------|
| 0 | Atomic assign, ride-run fit, socket auth, no-location event schemas | Schedule UI, map, live socket publish |
| 1 | Read-only schedule matrix, Leaflet map, advisory route viz, socket status adapter (flag off) | Assignment writers, GPS publish, auto-assign, payments |

## Overlap policy

- Rebase carefully around open traffic-ETA work that touches assignment/schema (#712).
- Do not invent a second assignment path on generic `Booking` (#92).
- New schedule board is not a travel-time matrix solver and does not revive #22.

## Stop conditions

Stop and report HOLD if: schema conflicts with in-flight transport PRs; authenticated roles can cross tenants; verified accessible vehicle unavailable under eligibility; legal/insurance authority unresolved; production secret required for local gates; critical build/test gate fails; emergency/human response path missing.

## Rollout

All new Phase 1 surfaces default flag-off. Phase 0 is pure hardening (revert to rollback). Do not merge, deploy, or flip live flags from agent automation.
