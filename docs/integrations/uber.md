# Uber Guest Rides (MapAble SDK)

MapAble ships a typed client for [Uber for Business Guest Rides API](https://developer.uber.com/docs/guest-rides/guest-ride-api-build-guide/overview). There is no official Node.js SDK; `lib/uber/` is the integration surface.

## Enable

```bash
UBER_ENABLED=true
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_ORGANIZATION_UUID=
```

Optional:

| Variable | Purpose |
|----------|---------|
| `UBER_USE_SANDBOX=true` | Use `https://sandbox-api.uber.com` |
| `UBER_SANDBOX_RUN_UUID` | Sandbox run header (`x-uber-runuuid`) |
| `UBER_OAUTH_SCOPE` | Default `guests.trips` |
| `UBER_API_BASE_URL` | Override API host |
| `UBER_TOKEN_URL` | Override OAuth token URL |

Validate with:

```bash
pnpm check:integrations-env
```

## Transport API

Authenticated session required. Trip must include pickup/dropoff lat/lng; dispatch requires participant phone (E.164).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/transport/trips/{tripId}/uber/estimates` | Fare/product estimates |
| `POST` | `/api/transport/trips/{tripId}/uber/dispatch` | Create guest trip (`productId`, `fareId` optional) |
| `GET` | `/api/transport/trips/{tripId}/uber/sync?requestId=` | Refresh Uber trip status |
| `POST` | `/api/transport/trips/{tripId}/uber/cancel` | Cancel guest trip (`{ "requestId": "..." }`) |

Uber `request_id` is stored on `TransportTripEvent` metadata (`uber_guest_trip_*` events), not as a separate Prisma field.

## Code usage

```ts
import { getUberClient, getUberGuestTripEstimates } from "@/lib/uber";
```

Integration health: `uber` adapter in the integrations registry (OAuth token probe).
