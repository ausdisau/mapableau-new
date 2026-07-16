# MapAble Transport — Architecture Decisions

## ADR-001: Adapt pack to Next.js + Prisma

**Decision:** Implement the Transport prompt pack against this repository’s Next.js App Router + Prisma stack. Do not port Vite/Express/Drizzle.

**Consequences:** Services live in `lib/transport/*`; routes in `app/api/transport/*`; UI in `app/` + `components/transport/*`; validation in `lib/validation/transport*`; types in `types/transport*`.

## ADR-002: TransportTrip is source of truth

**Decision:** All new participant, operator, and driver product work targets `TransportTrip` / `TransportTripRequest`.

**Legacy:** `TransportBooking` remains readable. Care orchestration and driver UI migrate off it. Optional post-completion bridge to generic `Booking` stays behind `TRANSPORT_BOOKING_BRIDGE_ENABLED`.

## ADR-003: Compatibility routes

Canonical MVP paths under `/transport/*` redirect or wrap existing dashboard/provider/driver pages so bookmarks keep working. `/dashboard/transport` remains the primary participant chrome.

## ADR-004: Production-claim registry

**Decision:** Server-authoritative registry in `lib/transport/production-claims.ts` exposed via `GET /api/transport/features`. Public `/transport` reads claim status; only `production_ready` may appear under “Available now”.

States: `planned | sandbox | pilot | partner_required | production_ready | temporarily_unavailable`.

## ADR-005: Quotes and pricing as additive models

Add `TransportQuote` and `TransportPricingRule` without replacing trip create. Request → quote → accept creates/updates trip. Monetary values in integer cents. Historical rule versions never mutate in place.

## ADR-006: Location privacy

Introduce `TransportLocation` (encrypted exact payload + masked suburb fields). Until migration completes, serializers continue masking plaintext trip fields by role. Exact-location decrypt requires auth decision + data-access audit.

## ADR-007: Operator membership

Prefer organisation membership + transport permissions over a parallel `transport_operators` table. Provider organisation is the operator unit; dispatcher/driver/fleet/compliance map to existing permission + `TransportDriver` records.

## ADR-008: Adapters fail closed

Missing partner keys → sandbox or unavailable, never invented live bookings/ETAs/funding. Routing outputs always advisory until operator confirmation.

## ADR-009: Feature flags

Continue env-driven flags for routing, live tracking, booking bridge, care orchestration, transit (phase two). Claim registry is independent of “flag on” — flags alone do not promote claims.
