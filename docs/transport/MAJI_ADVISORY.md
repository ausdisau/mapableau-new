# MAJI v0.1 advisory engine

MapAble Adaptive Journey Intelligence (MAJI) is an **advisory-only** in-trip remaining-route comparison on the canonical repo-root Next.js app. It does not activate routes, mutate bookings or quotes, authorise tolls, dispatch vehicles, or compute NDIS claimable funding.

It stacks on the traffic-aware ETA pilot. It reuses that honesty contract, cache expiry, TomTom Orbis adapter, TfNSW geometry match, and trip-bound driver-location consent. It does **not** call route-plan selection or operator dispatch reassignment.

## What it does

- Compares remaining time and operating cost for labelled alternatives from a consented in-service origin, or a synthetic checkpoint (pickup / last stop) labelled **not live GPS**.
- Persists `TransportJourneyAdvice` and `TransportJourneyCandidate` for audit.
- Exposes `POST /api/transport/trips/[tripId]/route-advice` and `POST .../route-advice/[adviceId]/decision`.
- Shows a Journey Intelligence panel on `/participant/transport/[tripId]`, `/dashboard/transport/[tripId]`, and `/driver/transport/[tripId]` (driver list is read-only).

Every response includes `advisoryOnly: true`, `bookingUnchanged: true`, `quoteUnchanged: true`.

## Money split

| Figure | Meaning |
|--------|---------|
| Operating-cost forecast | Remaining paid time + distance + optional tolls. Integer AUD cents. Unknown is `null`, never `0`. |
| Accepted quote | Read-only `acceptedQuoteTotalCents` from the trip request. Never updated. |
| Claimable funding | Never computed. Copy never says “NDIS covered”. |

Synthetic rates (`MAJI_SYNTHETIC_CENTS_PER_KM`, `MAJI_SYNTHETIC_CENTS_PER_PAID_MINUTE`) apply only when `MAJI_SYNTHETIC_PREVIEW_ENABLED=true`. Production defaults leave operating cost unknown.

## Flags (all default OFF)

| Flag | Default | Meaning |
|------|---------|---------|
| `MAJI_ADVISORY_ENABLED` | unset/false | Trip route-advice APIs and UI |
| `MAJI_TRAFFIC_ROUTING_ENABLED` | unset/false | Live-mode candidates only if `TRANSPORT_TRAFFIC_AWARE_ENABLED` and `TRANSPORT_TOMTOM_TRAFFIC_LIVE` are also true |
| `MAJI_TOLL_ESTIMATES_ENABLED` | unset/false | TfNSW Toll Calculator v2 POST |
| `MAJI_SYNTHETIC_PREVIEW_ENABLED` | unset/false | Labelled fixtures, synthetic origin, synthetic rates |
| `MAJI_MIN_TIME_SAVING_SECONDS` | `180` | Ranking floor |
| `MAJI_MIN_COST_SAVING_CENTS` | `200` | Ranking floor |
| `MAJI_COOLDOWN_SECONDS` | `300` | Minimum gap between evaluations |

Do not set these in Vercel production. Leave `TRANSPORT_ROUTING_PROVIDER=mock`.

## Routing candidates

TomTom Orbis HTTP `calculateRoute` documents `maxAlternatives` (0–5). MAJI requests at most **2** on the current remaining-route call, and also generates labelled variants with already-used query params (`routeType=short`, `avoid=tolls`). Each labelled call uses a distinct cache key. Mock and OSRM are never labelled live.

Public OSRM remains blocked in production and for consented live origins (ETA pilot rule).

## Tolls

TfNSW Toll Calculator v2 `POST /v2/roads/toll_calc/match` with an encoded polyline and vehicle class A/B. Fail closed when the flag is unset or the call fails: `tollCents: null`, `insufficient_price_information` on the toll line only. Full provider payloads are not stored.

## Hazards and constraints

TfNSW closed-road matches are **human review**, not auto-reroute. Accessibility is evaluated from recorded mobility requirements and the assigned vehicle. Unverified vehicle suitability is human review, not a silent pass. Diagnosis and aid category are not used to infer capability.

## Cost exposure (not a live bill)

Each evaluation is **1–3** TomTom `calculateRoute` calls against the existing **200 / UTC-day** cap. TfNSW Open Data is unused unless enrich or MAJI toll flags are on. Mock/OSRM are never billed as live.

## Rollback

Leave MAJI flags unset. Advice tables stay unused. The ETA pilot is unchanged.

## Human-approval gates (do not execute here)

- Enable any MAJI or live-traffic flag in shared/preview/prod
- Set `TRANSPORT_ROUTING_PROVIDER=tomtom`
- Bind `TOMTOM_API_KEY` or production env
- Promote to production
- Auto-activate routes, auto-authorise tolls, mutate quotes, or NDIS claims

**Go for flag-off preview** after tests and type-check. **No-go for live traffic/tolls** until keys, private OSRM, and human approval.
