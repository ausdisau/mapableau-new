# MapAble Navigate — municipal and cross-border source intake (1 November 2026)

**Claim state:** CATALOGUED / PROPOSED. No operational dataset import, graph generation, live routing, mobile navigation activation or production change is authorised by this change.

**Target repository:** `ausdisau/mapableau-new`; base reviewed: `4a50f790fc4ada4e037b4dd2d1812d1e40f37c53`.

## Decision

Register candidate sources in the existing `lib/access/data-sources/registry.ts` admission boundary, with operational import **off**. Preserve MapAble's existing `/access` MapLibre/AccessFit entry, `lib/go/route-service.ts`, existing sandbox `lib/access/navigate/fixture/sandbox-graph.ts` and default-off `MAPABLE_NAVIGATE_ENABLED` / `MAPABLE_GO_ROUTE_PLANNING_ENABLED` flags.

An interactive map or portal search is not, by itself, a verified extractable dataset, an export licence, a valid topological pedestrian graph or proof a wheelchair user can traverse a route.

## Candidate source matrix

| Registry ID | Source | Possible contribution | Verification gate / limitation |
|---|---|---|---|
| `city-of-sydney-accessibility-map` | City of Sydney ArcGIS accessibility viewer | Inclines, obstacles, lifts, mobility features and path effort where published | Locate underlying item, service and layer IDs; inspect field and licence metadata; compare against existing KML/Navability seeds to avoid duplicates |
| `city-of-melbourne-clue-building-information` | Melbourne CLUE buildings accessibility dataset | Building entrance and destination accessibility attributes | Building dataset, **not** path topology; confirm schema, history, coordinate CRS and dataset-specific terms |
| `brisbane-spatial-accessibility-catalogue` | Brisbane spatial accessibility catalogue | Candidate kerb ramps, parking and infrastructure layers | Resolve **individual** ArcGIS services/layers, authorisation and terms; verify graph connectivity |
| `arcgis-item-ffa2876916fd4e9fa25eca58aaf497ef` | ArcGIS item supplied for review | Not determined | **Unidentified:** item type, publisher, schema and licence not established; metadata review only |
| `data-sa-disability-search` | South Australia government dataset search | Candidate location, facility and policy datasets | Search results are not a specific licenced dataset; select and verify child records |
| `city-of-darwin-accessibility-map` | City of Darwin accessibility viewer | Local facilities and mobility information | Raw export/service interface and licence not independently established; local extent only |
| `nt-government-open-data-catalogue` | Northern Territory open data | Supporting base layers | No territory-wide dedicated disability-route evidence proven; resolve exact datasets |
| `nt-dlpe-spatial-data-requests` | NT natural resource spatial portal | Background spatial context | Request terms and layers separately; not a disability-route dataset |
| `city-of-perth-toilet-accessibility` | City of Perth Toilet Accessibility | Accessible toilets / destination amenity context | WA catalogue identifies CC BY 4.0 with City of Perth attribution and notes update 8 September 2022. **Import remains disabled** pending API, schema, completeness, duplicates, currency and field validation. Toilet point records are not route edges |
| `stats-nz-datafinder-viewer-layer-123498` | Stats NZ Datafinder viewer layer 123498 | Only geographic context, if confirmed | Exact selected layer metadata not verified; urban *driving-time* accessibility indicators cannot justify wheelchair- or walking-route claims. NZ remains outside Australia's metropolitan routing scope |

### Primary links

- Sydney: https://cityofsydney.maps.arcgis.com/apps/webappviewer/index.html?id=ca717c4e82774e189c3a60215b67f230
- Melbourne: https://data.melbourne.vic.gov.au/explore/dataset/buildings-with-name-age-size-accessibility-and-bicycle-facilities/information/
- Brisbane: https://spatial-brisbane.opendata.arcgis.com/search?q=accessibility
- Unidentified ArcGIS item: https://www.arcgis.com/home/item.html?id=ffa2876916fd4e9fa25eca58aaf497ef
- SA catalogue: https://data.sa.gov.au/data/dataset?q=disability
- Darwin: https://www.darwin.nt.gov.au/community/programs/access-and-inclusion/accessibility-map
- NT catalogue: https://data.nt.gov.au/
- NT spatial requests: https://environment.nt.gov.au/natural-resource-management/info-systems/natural-resource-maps/spatial-data-requests
- Perth: https://geohub-perth.opendata.arcgis.com/datasets/perth::toilet-accessibility
- NZ viewer: https://datafinder.stats.govt.nz/mapviewer/?mv.basemap=Streets&mv.centre=175.14999999999998%2C-41.03753612338015&mv.content=layer.123498.color%3A003399&mv.zoom=3

## Intake stages

1. **Source identity:** confirm official publisher, underlying stable service/dataset URL, item and layer IDs, geographic coverage, expected refresh and attribution.
2. **Reuse permission:** inspect per-dataset licence and attribution; record redistribution requirements and any API restrictions. Portal-level permissions do **not** authorise all child datasets.
3. **Read-only staging:** import a bounded snapshot into an isolated synthetic/test environment, validate GeoJSON/KML/CSV/ArcGIS geometry, CRS, units, nulls, duplicates, timestamps and source-record IDs. No participant location history.
4. **Canonical normalisation:** distinguish venue/amenity points, building entrance features, infrastructure barriers, and traversable pedestrian-network edges. Keep field-level observations, `sourceUri`, date, SHA-256, original claim, dispute and verification status.
5. **Participant-specific route assessment:** compare direction-specific slope, crossfall, path width, kerb transitions, steps, surface, temporary obstacles and individual equipment constraints. Unknown conditions must remain unknown. A shortest-path algorithm must not create a walkway or road crossing.
6. **Rights/privacy review:** foreground-only location with explicit consent; location sharing separately consented, default off; no inference about a person's diagnosis from mobility requirements; accessible list-first experience and AAC/switch/screen-reader controls.
7. **Release gate:** independent data steward review, manual route audits, WCAG 2.2 AA and participant-led testing, failure/cancellation experience, traceable build, rollback, human signoff. Until then, show **unverified / advisory** data only.

## Implementation boundaries

- Existing `lib/access/data-sources/registry.ts` is the source admission authority. All new candidates: `operationalImport: false`.
- Existing Sydney KMLs under `attached_assets/` and `server/geo/seed.ts` are historical seeds, **not fresh field verification**.
- Existing `lib/go/route-service.ts` calls `getSandboxGraph()` and reports `isLiveEvidence: false`. This PR leaves those behaviours intact.
- Existing national GCCSA geography provides region boundaries but does not establish within-city route feasibility.
- Do not run remote page or ArcGIS service ingestion from participant-facing API routes; schedule controlled ingest only after source approval.
- Do not co-mingle ODbL base-network data and council datasets into redistributable products until licence compatibility and attribution have been reviewed.
- Do not mark a source independently verified solely because its publisher is a government body.

## Review and verification

- Registry unit tests: `tests/access-infrastructure/data-source-registry.test.ts` must confirm all ten candidate sources fail closed; Perth's CC BY 4.0 metadata is recorded but does not bypass approval; NZ driving-time context is prohibited for wheelchair-routing claims.
- Run `pnpm exec vitest run tests/access-infrastructure/data-source-registry.test.ts` and relevant formatting/type checks in a fully installed checkout. These were **not executed** as part of the connector-only repository edits.
- Require a new, separately reviewed PR before implementing data download, writes, migrations, PostGIS topology or EAS/device navigation.

**Rollback:** revert the registry/test/documentation-only change. No production table migration or source import was part of this task.
