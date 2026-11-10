# International accessibility and service-reach data intake — MapAble research

**Status:** Research candidate register only. No data has been operationally ingested, imported into the routing graph, promoted to independently verified evidence, or deployed.

**Dependency:** Municipal source intake PR #645; this branch begins at its head so this work must be reviewed **separately** and must not be merged before the parent scope is resolved. All international source entries have `operationalImport: false`, `requiresDatasetLevelLicence: true`, `licence: null` pending precise resource licensing.

## Distinguish the meaning of accessibility

1. **Mobility access** means an individual person may be able to traverse measured footpaths, crossings, ramps and entrances given their functional requirements and real-time conditions.
2. **Transport accessibility** often means station/stop proximity or network coverage, not guaranteed accessible boarding or step-free journey completion.
3. **Geographic/service accessibility** measures distance or travel time to hospitals, schools or urban centres. Historical raster grids, driving-time models and remote-sensing footprints do **not** establish wheelchair route feasibility.

## Source leads and ingestion decisions

| Source | Geographic scope | Proposed use | Critical restriction |
|---|---|---|---|
| [HDX PNG Accessibility Indicators](https://data.humdata.org/dataset/papua-new-guinea-accessibility-indicators) | Papua New Guinea | Humanitarian and regional research | Exact metadata, status, resource types, author and licence not verified; **no wheelchair routing** |
| [HDX HOTOSM Singapore roads](https://data.humdata.org/dataset/hotosm_sgp_roads) | Singapore | Road/network research only | Exact dataset metadata not confirmed. OSM-derived material should share the existing `openstreetmap` provenance basis rather than count as independent corroboration |
| [HeiGIT OpenAccessLens](https://heigit.org/global-data-on-healthcare-and-education-accessibility-with-openaccesslens/) | Global | Regional healthcare/education reach | Travel-mode scope currently motorised; not walking, step-free transit or wheelchair-accessible routing |
| [Earth Engine accessibility datasets](https://developers.google.com/earth-engine/datasets/tags/accessibility) | Global | Historical area-level travel-time grids / friction surfaces | Verify exact asset and its date and licence; raster is not a pedestrian-network graph; do not misrepresent historical estimates as current |
| [Singapore LTA DataMall](https://datamall.lta.gov.sg/) | Singapore | Transit stops and facility discovery | Some dynamic APIs require registered keys. Specific dataset formats, schema, attribution and API restrictions must be inspected |
| [Singapore data.gov.sg](https://data.gov.sg/) | Singapore | Dataset discovery | Portal-level metadata is not a licence for all child resources |
| [Singapore OneMap](https://www.onemap.gov.sg/apidocs/) | Singapore | Coordinate/geographic referencing | Review terms, coordinate reference system, authentication and permitted reuse; general directions are not proof of wheelchair feasibility |
| [India Geodata](https://yashveeeeeeer.github.io/india-geodata/) | India | Curated spatial dataset catalogue | Verify each dataset publisher, vintage, geometry and independent reuse terms |
| [Open City India GeoJSON filter](https://data.opencity.in/dataset/?res_format=GeoJSON) | India | City facilities, transport and street-network leads | Filtered catalogue is not evidence every resource is GeoJSON or licensed for MapAble |
| [Wheelmap](https://news.wheelmap.org/en/faq/) | Global | Venue observations where license and provenance permit | OSM tags and partner datasets may have different licence arrangements; do not double count OSM entries or label a route verified from venue tags |
| [Google Open Buildings](https://sites.research.google/gr/open-buildings/) | Regions in Global South | Building-footprint context | **Not** the Malaria Atlas Project travel-time dataset; footprint geometry does not establish accessible building entrances |

### China-specific cautions

The user-provided academic link `https://pmc.ncbi.nlm.nih.gov/articles/PMC13246859/` is not adopted as an authority for a standardised China-wide accessibility network until the document title, methodology, data coverage, access rights and publication are independently verified. No China-specific dataset is provisioned as an operational source by this branch. Any future China adapter must check location-data processing rules, local mapping constraints, applicable coordinate reference systems and permitted redistribution with appropriate specialist review.

## Source processing before any import

- Resolve stable dataset/item ID, publisher, resource URL, layer, update cadence, revision date, coordinate reference system, format, attribution and licence **per child resource**.
- Fail closed for HTTP errors, missing/ambiguous licence, malformed geometries, unreasonable bounding boxes, invalid coordinates, duplicates, missing record IDs, and stale/out-of-date records.
- Keep accessibility *meaning* as a typed property: `physical_path`, `destination_entrance`, `transport_facility`, `aggregate_travel_time`, `building_footprint`, `catalogue_lead`. A catalogue lead must never be cast to `physical_path`.
- Store research layers separately from consent-governed participant location. Never reconstruct identifiable trip history from humanitarian accessibility rasters.
- Keep OSM contributor attribution and ODbL considerations explicit; research derived from OSM may not be independent corroboration of OSM.
- For any active route guidance later, independently validate route graph topology, direction and curb crossing, barriers, surface, gradients, width, uncertainty, source freshness and participant-specific hard constraints. Provide evidence explanations, accessible list-first alternatives, reversible consent and explicit stop controls.

## Review gates and commands

Run tests after checking out a fully installed repo:

```bash
pnpm exec vitest run tests/access-infrastructure/data-source-registry.test.ts
pnpm type-check
```

Run formatter/lint/CI configured for the repository and compare failures with pre-existing baseline. No tests or deployments were run by the remote-edit-only preparation. All source candidates remain unavailable to participant-facing Navigate and MapAble Go.

**Roll back** by reverting the three research-only files/changes before merging. This branch performs no migrations, network ingest, live map modification or feature-flag activation.
