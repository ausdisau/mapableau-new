# MapAble Strategic Wedges — Module Guide

## Overview

Strategic wedges extend MapAble beyond directory search. They share infrastructure under `lib/wedges/`, `lib/access-fit/`, and `lib/trust/`.

## Feature flags

Configure in `.env`:

```bash
WEDGES_MVP_ENABLED=true          # Show wedge UI on provider-finder and routes
WEDGES_USE_MOCK_DATA=true        # Use mock provider dataset (default until registry API)
WEDGES_PERSIST_REQUESTS=false    # Persist concierge/availability to DB (requires migration)
```

See `lib/config/wedges.ts`.

## Routes

| Route | Wedge | Auth |
|-------|-------|------|
| `/provider-finder` | W1, W2 filters | Public |
| `/request-support` | W3 Request Concierge | Public |
| `/providers/available-now` | W8 No-Waitlist Zones | Public |
| `/planops-lite` | W7 PlanOps Lite | Participant (dashboard) |
| `/support-coordinator` | W4 Coordinator OS | Coordinator permission |

## Key files

| Area | Path |
|------|------|
| Types | `types/wedges.ts` |
| Config | `lib/config/wedges.ts` |
| Mock data | `lib/wedges/mock-providers.ts` |
| Availability | `lib/wedges/availability/` |
| Access-fit | `lib/access-fit/` |
| Trust | `lib/trust/` |
| Request tracker | `lib/wedges/request-tracker/` |
| Components | `components/wedges/` |

## API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/wedges/availability` | GET | List/filter provider availability |
| `/api/wedges/support-requests` | POST | Submit concierge request (when persistence enabled) |

## Boundaries

- Availability is provider-declared; not guaranteed
- Access-fit scores are advisory; confirm with provider before booking
- No NDIS eligibility, legal, clinical, or funding decisions
- Trust scores are evidence-based; paid tiers do not auto-improve scores

## Tests

```bash
pnpm test tests/wedges/
```

## Backend integration path

1. **Mock-first** — UI and scoring with `lib/wedges/mock-providers.ts`
2. **Schema** — `ProviderAvailabilitySnapshot`, `ProviderAccessCapability`, `SupportConciergeRequest` in Prisma
3. **API** — `/api/wedges/*` routes with Zod validation
4. **Provider admin** — Link update flows to `/provider/availability` and provider console
5. **Live registry** — Unified read layer merging NDIS ingest, Organisation, ProviderProfile
