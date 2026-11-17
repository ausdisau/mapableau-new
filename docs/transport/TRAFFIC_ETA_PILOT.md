# Traffic-aware ETA pilot

Protected, fail-closed pilot for advisory travel times on **TransportTrip** (repo-root Next.js app). Traffic flags stay **off**. This is not a production live-ETA product, not a fare quote, and not a booking mutation.

## What shipped

- Provider-neutral estimate contract with honesty fields (`source`, `trafficModeApplied`, `liveTrafficUsed`, `providerStatus`, `fallbackReason`, `generatedAt`, `validUntil`, `advisoryOnly`).
- TomTom Orbis Calculate Route adapter (HTTP docs, `apiVersion=2`, car-only, public preview).
- Labelled OSRM fallback when TomTom is selected but misconfigured, capped, or upstream-failed.
- Route cache keys include provider, traffic mode, options, 15-minute UTC departure bucket, rounded origin/waypoints/destination. Memory TTL is 3 minutes when live traffic was used, otherwise 15 minutes. Database rows honour `expiresAt`.
- TfNSW incident and roadwork Open Data matched to route geometry (~250 m corridor). Hazards are advisory only.
- Boarding buffers (default 10 minutes, plus 10 minutes when `needsExtraBoardingTime`) applied at composition, not in the shared cache key.
- Trip-scoped ETA and reroute-advisory APIs. Reroute does **not** change the booking.
- Consent scope `transport.driver_location_share` plus driver opt-in. Recording also requires `TRANSPORT_LIVE_LOCATION_ENABLED`.
- Participant and driver TransportTrip UI with source, freshness (Australia/Sydney), live vs typical vs sandbox labels, hazard lists, and 44px controls.

## Flags (defaults OFF)

| Flag | Default | Meaning |
|------|---------|---------|
| `TRANSPORT_ETA_PILOT_ENABLED` | unset/false | Trip-scoped ETA/reroute endpoints |
| `TRANSPORT_TRAFFIC_AWARE_ENABLED` | unset/false | Allow `traffic=live` requests |
| `TRANSPORT_TOMTOM_TRAFFIC_LIVE` | unset/false | Use TomTom live vs historical |
| `TRANSPORT_ROUTING_PROVIDER` | `mock` | Do not change production to `tomtom` |
| `TOMTOM_API_KEY` | empty | Server-only. Sent as `TomTom-Api-Key` |
| `TRANSPORT_TOMTOM_DAILY_REQUEST_CAP` | `200` | Then OSRM fallback (`cost_limited`) |
| `TRANSPORT_TOMTOM_MAX_WAYPOINTS` | `20` | Below TomTom 150 cap |
| `TFNSW_ENRICH_ROUTE_ESTIMATES` | false | Unchanged |
| `TRANSPORT_LIVE_LOCATION_ENABLED` | false | Unchanged |

## Cost estimate (not a live bill)

- Cap: 200 TomTom Calculate Route calls per UTC day, then labelled OSRM fallback.
- Live traffic is the expensive path and stays off unless both traffic flags and a server key are set later.
- TfNSW Open Data is unused unless `TFNSW_ENRICH_ROUTE_ESTIMATES` is on, or an operator calls the existing nearby API (`force`).
- Public OSRM demo is **not** a production live-traffic source. Copy always says typical road speeds when `liveTrafficUsed` is false.

## Known limits

- TomTom Orbis HTTP docs are public-preview and car-only.
- Geometry matching is corridor proximity, not a legal closure authority.
- Estimates are never a guaranteed arrival window.
- GraphHopper and OpenRouteService remain key-gated stubs.
- Dual driver UIs remain: legacy `/driver/trips` bookings vs `TransportTrip`. This pilot attaches to `TransportTrip` only (`/driver/transport/[tripId]`).
- Mock and OSRM must never be labelled live traffic.

## Human-approval gates

Do **not** execute these without explicit later authorisation:

1. Set `TRANSPORT_ROUTING_PROVIDER=tomtom` in any shared/preview/prod env.
2. Set `TRANSPORT_TRAFFIC_AWARE_ENABLED` or `TRANSPORT_TOMTOM_TRAFFIC_LIVE` to true.
3. Bind `TOMTOM_API_KEY` or change Vercel production env.
4. Promote a preview deployment to production.
5. Mutate bookings, auto-reroute, or auto-cancel from traffic.

## Deployment evidence

- GitHub ↔ Vercel project for this repo creates a **preview** from the pull request.
- Do not promote, do not edit production env, do not call production deploy APIs.
- Record the preview URL and flag state (all traffic-aware flags unset/false, provider mock) on the PR after preview exists.
