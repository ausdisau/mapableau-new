# MapAble Access Demand Intelligence Design

## Status

Approved design for the first production slice of MapAble Access regional demand intelligence.

## Decision

Extend the existing Geographic Accessibility Information Service (GAIS) rather than creating another map or geographic platform. The first slice adds an optional SA3 regional intelligence overlay to MapAble Access using public upstream sources directly. The Care Sector Demand Map is a research comparator only and its restricted map data is not ingested, persisted, redistributed, or used as a production dependency.

## Goals

- Give participants optional, plain-language regional context alongside place accessibility information.
- Give MapAble strategy and delivery teams a reusable, source-grounded regional demand signal.
- Preserve provenance, reporting dates, suppression, uncertainty, and source licensing metadata.
- Keep the feature fail-closed and independently switchable from the existing GAIS place/barrier layer.
- Use aggregated regional data only; never infer an individual participant's disability, funding, service need, eligibility, or location from regional statistics.

## Non-goals

- No provider recommendation, participant matching, funding advice, or NDIS eligibility inference.
- No universal accessibility score.
- No claim that regional demand equals unmet need.
- No Care Sector Demand Map scraping or redistribution.
- No database migration in this first slice. Feed persistence is deferred until source contracts are proven stable.
- No automated service-expansion decision. Strategy metrics are advisory evidence for human review.

## Existing architecture reused

GAIS already owns stable typed geographic read contracts, evidence/provenance semantics, GeoJSON projection, bounds-based queries, public read APIs, and optional Leaflet/MapLibre layers. MapAble Access remains the owner of place accessibility UX. This slice adds a sibling regional demand read surface under `lib/gais/demand/` and `/api/gais/demand/regions`.

## Upstream sources

### NDIA participant geography

Default source: `https://dataresearch.ndis.gov.au/media/4241/download?attachment=`

The feed contains SA3 2016 codes, names, states, reporting dates, and participant counts across multiple quarters. The adapter must:

- parse quoted CSV safely;
- preserve suppressed values such as `<11` as `null` plus `suppressed: true`;
- select the latest reporting date per region;
- select the same region approximately 12 months earlier when available;
- calculate year-on-year percentage change only when both current and prior counts are known and prior count is greater than zero;
- expose the reporting date from the data rather than hard-coding a freshness claim.

The URL is configurable with `MAPABLE_GAIS_DEMAND_NDIA_SA3_URL` so a changed official media URL does not require code changes.

### ABS ASGS geometry

Default service: `https://geo.abs.gov.au/arcgis/rest/services/ASGS2016/SA3/MapServer/0/query`

The geometry edition intentionally matches the NDIA feed's `SA3Cd2016`. Requests are server-side bounds queries using an envelope, `spatialRel=esriSpatialRelIntersects`, `outSR=4326`, and `f=geojson`. The service URL is configurable with `MAPABLE_GAIS_DEMAND_ABS_SA3_URL`.

## Regional contract

Each region returned to the client contains:

- `regionCode` — SA3 2016 code;
- `regionName`;
- `state`;
- `participantCount: number | null`;
- `participantCountSuppressed: boolean`;
- `previousYearParticipantCount: number | null`;
- `yoyGrowthPercent: number | null`;
- `observedAt` — latest NDIA report date;
- `previousObservedAt: string | null`;
- `contextLabel` — deterministic plain-language context derived from scale and growth, never described as need or accessibility quality;
- `strategyIndex` — deterministic 0-100 planning index used by MapAble strategy surfaces, explicitly `exploratory`; it is not shown as a participant-facing score;
- `evidence` — source URL, source organisation, geography edition, reporting date, claim state, and limitations.

The API response is a GeoJSON FeatureCollection. Region geometry may be Polygon or MultiPolygon.

## Strategy index

The first index is deliberately simple and inspectable:

- Scale component: 70% weight. `min(100, participantCount / 75)` so 7,500 participants reaches the scale cap.
- Growth component: 30% weight. `clamp((yoyGrowthPercent + 5) / 25 * 100, 0, 100)`, mapping -5% to 0 and +20% to 100.
- If participant count is suppressed or missing, the index is `null`.
- If growth is unavailable, use the scale component alone and mark `growthAvailable: false`.

This is a MapAble planning heuristic, not an NDIA or ABS measure. The API must label it `exploratory` and participant UI must not display the numeric index.

## Participant-facing language

The layer is labelled **Regional support context**. Region detail shows factual metrics and limitations, for example:

- `4,320 NDIS participants in this SA3 at 30 June 2026.`
- `12-month change: +8.4%.`
- `This is regional context, not a measure of your individual needs, service availability or eligibility.`

`contextLabel` values are neutral: `smaller`, `established`, `large`, `large_and_growing`. They describe observed regional participant scale/growth only.

## Feature flags

Server:

- `MAPABLE_GAIS_ENABLED=true`
- `MAPABLE_GAIS_DEMAND_ENABLED=true`
- `MAPABLE_GAIS_DEMAND_PUBLIC_API_ENABLED=true`

Client:

- `NEXT_PUBLIC_MAPABLE_GAIS_ENABLED=true`
- `NEXT_PUBLIC_MAPABLE_GAIS_DEMAND_LAYER=true`

All flags default off. The demand public API requires the GAIS master flag plus both demand server flags. The participant toggle requires the GAIS client master flag plus the demand client flag.

## Data flow

1. Leaflet reads visible bounds.
2. Client hook requests `/api/gais/demand/regions` with the same bounded coordinates pattern used by GAIS.
3. Server fetches/caches the NDIA CSV and calculates the latest/prior regional metrics.
4. Server fetches ABS SA3 2016 polygons intersecting the viewport.
5. Service joins by SA3 2016 code.
6. API returns a GeoJSON FeatureCollection with provenance and claim metadata.
7. Leaflet renders low-emphasis polygons beneath place markers.
8. Popup/list detail presents a textual equivalent; colour is never the sole carrier of meaning.

## Caching and failure behaviour

- NDIA source cache TTL: 6 hours in-process.
- ABS bounds request uses the same server-side cache window where supported.
- Upstream timeout: 8 seconds per source.
- NDIA failure: route returns `502` with a generic source-unavailable error and no stale fabricated values.
- ABS failure: route returns `502`; no geometry is invented.
- Suppressed values remain unknown rather than converted to 0 or 10.
- An empty bounds result returns an empty valid FeatureCollection.

## Accessibility

- Layer toggle is a labelled checkbox/button with at least 44px target height.
- Map polygons have a list/text equivalent.
- Region popup headings and metrics are semantic text.
- Loading/error/count updates use polite live regions.
- The UI does not rely on colour alone; context labels and numerical values are visible in text.
- Existing Access map keyboard/list alternatives remain available.

## Privacy and rights

The feature uses public regional aggregates only. It must never combine regional statistics with participant identity, saved location, disability profile, access needs, plan budget, or service history to infer need or steer a participant. Participant-facing output remains informational and optional.

## Licensing and provenance

- NDIA and ABS source URLs are included in response metadata.
- ABS geography edition is explicitly `ASGS 2016 / Edition 2` to match the NDIA region codes.
- Care Sector Demand Map is documented as `research_reference_only` and is not called by runtime code.
- Source limitations and reporting dates are retained in the API response and region detail UI.

## Validation

Required tests cover:

- CSV parsing including quotes and suppressed `<11` values;
- latest and prior-year selection;
- no year-on-year calculation from suppressed or zero prior counts;
- strategy index bounds and missing-growth behaviour;
- feature flags fail closed;
- region join by SA3 2016 code;
- Polygon and MultiPolygon pass-through;
- participant copy does not describe the index as need, accessibility, eligibility, recommendation, or service availability;
- public response includes provenance/claim-state metadata.

Required verification commands:

```bash
pnpm vitest run tests/gais-demand-intelligence.test.ts
pnpm type-check
pnpm lint:app-api
pnpm lint:components
pnpm lint:lib
```
