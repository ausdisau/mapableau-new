# MapAble Transport — Current State Audit

Audit date: 2026-07-16. Repository: Next.js 15 + Prisma + NextAuth (not Vite/Express/Drizzle).

## Stack evidence

- [`package.json`](../../package.json): `next`, `react` ^18, `@prisma/client`, `next-auth`, `vitest`; scripts `type-check`, `build`, `test` (no `npm run check`).
- Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma) — `TransportTrip`, `TransportTripRequest`, `TransportBooking` (legacy), vehicles/drivers, events, evidence, routing estimates.
- Services: [`lib/transport/`](../../lib/transport/).
- APIs: [`app/api/transport/`](../../app/api/transport/), [`app/api/provider/transport/`](../../app/api/provider/transport/), [`app/api/driver/transport/`](../../app/api/driver/transport/).

## Routes (verified)

| Path | Role |
| --- | --- |
| `/transport` | Public marketing — [`app/transport/page.tsx`](../../app/transport/page.tsx) |
| `/transport/new` | Redirect to `/dashboard/transport/new` |
| `/dashboard/transport` | Participant trip list |
| `/dashboard/transport/new` | Create trip form |
| `/dashboard/transport/[tripId]` | Trip detail |
| `/dashboard/transport/legacy` | Legacy TransportBooking UI |
| `/provider/transport`, `/dispatch`, `/runs` | Provider console |
| `/driver/trips` | Driver UI (still partly legacy booking-oriented) |
| `/admin/transport` | Admin |

**Missing canonical MVP aliases:** `/transport/request`, `/transport/profile`, `/transport/dashboard`, `/transport/trips/:id`, `/transport/operator`, `/transport/operator/fleet`, `/transport/driver`, `/transport/book`.

## Public copy drift

[`app/transport/page.tsx`](../../app/transport/page.tsx) lists:

- Available now: public explanation, provider finder, signed-in pilot routes
- Coming soon: driver/vehicle verification, trip status/evidence/review, routing adapters

**Gap:** Eligibility, trip status/events, evidence, and advisory routing already exist in pilot code under `lib/transport/*` and APIs, but are not `production_ready` and must not be labelled “Available now” until claim gates pass. Recommended planned wording: eligibility checks; service records; advisory routing.

## Hard-coded fares / NDIS Covered

Search found **no** `$25.50`, `$42.00`, `$4.80`, or unconditional `NDIS Covered` / `Companion Card Accepted` in current transport UI (unlike the Replit Vite prototype described in the external prompt pack). Keep it that way.

## Domain gaps vs pack

| Pack entity | Status |
| --- | --- |
| TransportTrip + events + assignments | Exists |
| Fail-closed eligibility | Exists (`transport-eligibility-service`, assignment service) |
| Role-aware address masking | Partial (`transport-response`, access policy) |
| Quotes | Missing |
| Pricing rules | Missing |
| Dedicated access profile | Partial (mobility JSON + AccessibilityProfile) |
| Encrypted locations | Missing (plaintext address/lat/lng on trips) |
| Production-claim registry | Missing |
| Idempotency on trip events | Missing unique key on `TransportTripEvent` |
| Eligibility snapshot on assignment | Missing on `TransportDispatchAssignment` |
| Realtime transport rooms | Missing (realtime-server is messaging-only) |
| Offline driver queue | Missing |
| Versioned transport pricing / Stripe path | Missing |
| Care orchestrator on TransportTrip | Partial — creates TransportBooking |

## Dual model risk

- **Canonical new work:** `TransportTrip`
- **Legacy:** `TransportBooking` still used by provider list, some driver UI, care-transport orchestrator
- Optional bridge: `TRANSPORT_BOOKING_BRIDGE_ENABLED` → unified `Booking` on trip completion

## Feature flags (sample)

`TRANSPORT_ROUTING_ENABLED`, `TRANSPORT_ROUTING_PROVIDER` (default `mock`), `TRANSPORT_LIVE_TRACKING_ENABLED`, `TRANSPORT_BOOKING_BRIDGE_ENABLED`, `CARE_TRANSPORT_ORCHESTRATION_V2_ENABLED` — see `.env.example`.
