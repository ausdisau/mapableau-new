# Service Cartography controlled pilot

**Mode:** experimental_reference (synthetic fixtures only)  
**Flag:** `MAPABLE_SERVICE_CARTOGRAPHY_PILOT` (default false)  
**Synthetic only:** `MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY` (default true)

Rights-first advisory algorithms for service discovery, accessible journeys,
scheduling, gaps, and continuity. This is **not** live matching, a map product,
an NDIS eligibility engine, or a booking/payment path.

Kernel: `packages/service-cartography` (`@mapable/service-cartography` v0.1.0).  
Host adapter: `lib/pilot/service-cartography/`.  
Vendor docs (rights contract, threat model, unmet real-data release gates):
`packages/service-cartography/docs/`.

## Scope

- Synthetic community visit with optional care and transport
- Two advisory service choices, missing-dependency explanations, human confirmation
- Fail-closed consent, evidence, communication access, and verified availability gates
- No Prisma product schema; no Care / Transport / Billing writers

## APIs

- `GET /api/pilot/service-cartography` — honesty fields and prohibitions (pilot flag)
- `POST /api/pilot/service-cartography` — authenticated golden slice; requires pilot **and** synthetic-only
- `GET /api/pilot/service-cartography/simulate` — unauthenticated synthetic-only path; same dual-flag gate
- Page `/pilot/service-cartography` — disabled unless both flags allow a synthetic preview

## Prohibitions

- no booking or payment
- no NDIS claim or price-limit advice
- no auto-assignment
- no live participant or provider records
- no public “accessible route” claim without independently verified coverage

## Kill criteria

Stop if the preview is marketed as live matching, if client-supplied evidence is
treated as verified, if suggestions execute without separate authorisation, or
if synthetic fixtures are presented as independently verified external evidence.

## Rollback

Disable `MAPABLE_SERVICE_CARTOGRAPHY_PILOT`. No live bookings, claims, or
worker assignments were enabled.

## Honesty / claims

- `productionClaimStatus: not_claimable`
- `isLiveMatchingEngine: false`
- `isBookingEngine: false`
- Release gates in `packages/service-cartography/docs/RELEASE_GATES.md` remain
  unmet for real data
