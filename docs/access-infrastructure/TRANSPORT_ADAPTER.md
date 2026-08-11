# Transport adapter

**Status:** Phase 2 slice — flag-gated (`MAPABLE_ACCESS_TRANSPORT_COMPATIBILITY_ENABLED`)  
**Code:** [`lib/access/infrastructure/adapters/transport/`](../../lib/access/infrastructure/adapters/transport/)  
**API:** `POST /api/access-infrastructure/transport/compatibility`

## What this slice does

- Projects vehicle / pickup / destination evidence into `AccessCapability` shapes
- Evaluates passport transport-related requirements via the shared compatibility engine
- Returns **segment-aware** results: Vehicle · Pickup · Route · Destination
- Filters replacement candidates to *sufficiently compatible* vehicles (interface)

## What it does not claim

- Live partner dispatch or booking
- Guaranteed verified accessible fleet
- Route barrier verification (route segment is explicitly `uncertain` until evidence exists)

## Integration

Existing [`lib/transport/accessibility/evidence-service.ts`](../../lib/transport/accessibility/evidence-service.ts) remains a projection input — not a second engine.

## Participant decision

Compatibility is advisory. The participant decides whether to proceed.
