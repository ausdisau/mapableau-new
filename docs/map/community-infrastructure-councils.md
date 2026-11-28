# Local government and council accessibility linkages

**Review date:** 28 November 2026, Australia/Sydney.

**Status:** Implemented, not independently verified in production. The stored snapshot, boundary receipt and council registry were inspected; the matcher passed 17 focused geometry tests. Deployment and wider API/UI verification belong in the implementation report.

## Participant outcome and current state

The community layer can connect a mapped facility to the relevant local-government area and official council information. This helps a participant find parking guidance, toilet access information, park descriptions or the appropriate place to investigate a missing detail.

Three relationships must remain distinct:

1. A feature's display point falls within a published council boundary.
2. A council provides relevant information on a public page or map.
3. A council owns, operates, maintains or has inspected the specific asset.

The current addition establishes the first relationship and supplies references for the second. It does not establish the third. No council facility inventory is automatically imported, and no operator partnership, accessible route, live parking vacancy or compliance assessment is implied.

The [community contract](../../lib/access/community-infrastructure/types.ts) now permits `properties.councilJurisdiction` and `meta.councilLinkage`. Their [types](../../lib/access/community-infrastructure/council-types.ts) retain source IDs, match status, dates and explicit `assetOwnership: "not_established"`. These optional fields allow older snapshots to remain readable while refreshes add the linkage.

## Boundary source, rights and dates

The inspected source is NSW Spatial Services' [LocalGovernmentArea layer 8](https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme_multiCRS/FeatureServer/8), associated with [LGA item 3c8278222ddf4908a9a6e256d9847e6f](https://portal.spatial.nsw.gov.au/portal/home/item.html?id=3c8278222ddf4908a9a6e256d9847e6f). Its service item is `54c7b3b18680416a8b4496eceb6740fa`.

The successful source receipt records:

| Property             | Observed value                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| Retrieved            | `2026-11-28T10:34:26.484467+00:00`, or 21:34:26 AEDT                            |
| Query envelope       | West/south/east/north: `150.675, -33.835, 151.025, -33.735`                     |
| Native/requested CRS | EPSG:7844; requested source-service output EPSG:4326                            |
| Response             | HTTP 200; GeoJSON; 1,278,750 bytes                                              |
| Count                | Six polygon features; separate source count query also returned six             |
| SHA-256              | `d848c32a8c3c9a57c2f7b44f8d21198d8f51fa538dbef71a69a10e7b6eacf8eb`              |
| Scope                | Complete returned polygons intersecting the envelope; not clipped or simplified |

The six polygons cover Blacktown, Cumberland, Fairfield, Penrith, The Hills Shire and City of Parramatta. The query envelope is only a retrieval device; it is not a new administrative area.

The item licence metadata links [Spatial Services copyright](https://www.spatial.nsw.gov.au/copyright). Its official indexed text specifies CC BY 4.0 for Spatial Services material unless otherwise stated, with exceptions for specified material such as third-party content and imagery. Direct retrieval of the copyright page was inconsistent; the retained receipt identifies that limitation and the metadata basis. Preserve the boundary attribution and extraction date separately from the OSM data's ODbL attribution. A boundary licence does not license council website content or third-party basemaps.

Required source attribution:

> © State of New South Wales (Spatial Services, a business unit of the Department of Customer Service NSW). For current information go to spatial.nsw.gov.au.

Boundary modification/update fields concern the boundary record. They do not supply a facility inspection date. A far-future source `enddate` must not become a promise about future boundary or asset validity.

## Join meaning and the Cumberland finding

The completed importer has added council jurisdiction to all 563 OSM category projections in the [stored snapshot](../../data/community-infrastructure/osm-snapshot.json). Direct inspection of that file confirms:

| Study window      | Display-point council association | Projection count |
| ----------------- | --------------------------------- | ---------------: |
| Parramatta centre | City of Parramatta                |              157 |
| Parramatta centre | Cumberland                        |                8 |
| Penrith centre    | Penrith                           |              300 |
| Blacktown centre  | Blacktown                         |               98 |

All 563 stored associations have status `matched`; none is ambiguous, unmatched or unjoined. The final matcher reproduces the preliminary diagnostic counts. Comparing the snapshot with the preceding committed version after excluding the added jurisdiction property confirmed that the original OSM features, source fields and timestamps were unchanged. Counts describe category projections, not necessarily distinct physical sites.

The eight Cumberland associations demonstrate why the rectangle's name cannot identify the council for every record. They do not mean eight council-owned facilities were discovered. Fairfield and The Hills Shire occur in the boundary extract but receive no points in the current snapshot.

The matcher uses the existing display coordinate. OSM nodes may be mapped points; ways and relations can use approximate bounding-box centres. A centre can fall outside the physical feature, and an asset may cross a boundary. No centre is promoted into an entrance, surveyed location or ownership decision.

### Geometry and uncertainty rules

The maintainer matcher is implemented in [`council-geometry.ts`](../../lib/access/community-infrastructure/council-geometry.ts). Its behaviour is:

- Respect Polygon/MultiPolygon parts and interior holes; being inside a hole is not being inside the council polygon.
- Return `ambiguous` for a point touching an outer or hole edge, including a single candidate boundary, or lying within overlapping polygons.
- Return `unmatched` when no polygon matches; do not assign the nearest council.
- Reject a point outside the extraction query envelope, where the source selection does not establish complete coverage.
- Use a numerical edge tolerance of `1e-10` degrees. This is not a claim about GPS, mapping or legal boundary accuracy.
- Preserve all candidate matches and the coordinate used. Ambiguity must not silently pick the first council.

The contract labels the method `display_point_in_polygon`, and collection linkage uses `display_point_boundary_match`. The `ambiguousFeatureCount`, `unmatchedFeatureCount` and `notJoinedFeatureCount` fields preserve those distinctions when other records or future refreshes have less certain results.

## Council reference registry and reuse status

The [stored council registry](../../data/community-infrastructure/council-references.json) contains 18 reference links across Parramatta, Penrith, Blacktown and Cumberland, within six council identity entries matching the boundary extract. Fairfield and The Hills Shire currently have no researched source links. These are official lookup references, not active facility feeds. Every current `CouncilSourceLink` has `bulkReuseStatus: "not_established"` and `importEnabled: false`.

| Council    | Useful official reference                                                                                                                                                                                                                                                                                                                                                                                          | Evidence boundary                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parramatta | [Accessible Parking](https://www.cityofparramatta.nsw.gov.au/community/getting-around/parking/car-parks/accessible-parking), [parks directory](https://www.cityofparramatta.nsw.gov.au/community/parks-and-public-spaces/find-a-park-or-reserve), [National Public Toilet Map referral](https://www.cityofparramatta.nsw.gov.au/community/ageing-and-disability/people-with-disability/national-public-toilet-map) | Lookup pages and a council-linked parking application; no licensed facility feed established.                                                                                            |
| Penrith    | [Accessible Services Map](https://www.penrithcity.nsw.gov.au/news/213-penrith-accessible-services-map), [parking map](https://penrithcity.nsw.gov.au/services/other-services/parking/penrith-city-centre-parking-map), [Playspaces](https://penrithcity.nsw.gov.au/facilities-recreation/outdoor-recreation/playspaces)                                                                                            | Readable facility descriptions include MLAK/adult-change information. The first two pages display 2024 updates; Playspaces displays 29 October 2026. These are not live condition feeds. |
| Blacktown  | [Parks directory](https://www.blacktown.nsw.gov.au/Sport-recreation/Parks-and-recreation-directory), [Warrick Lane parking](https://www.blacktown.nsw.gov.au/Services/Roads-construction-and-parking/Look-up-city-parking/Warrick-Lane-precinct-car-park), [disability/MLAK guidance](https://www.blacktown.nsw.gov.au/Community/Our-people/People-with-disability)                                                | Source descriptions support investigation; capacity, equipment and access need their own dates. Indexed website licence wording does not establish a particular API's rights.            |
| Cumberland | [2024–2025 annual report](https://www.cumberland.nsw.gov.au/sites/default/files/inline-files/annual-report-2024-2025.pdf), [public amenities review](https://haveyoursay.cumberland.nsw.gov.au/public-amenities)                                                                                                                                                                                                   | Report documents a public toilet map; its exact live endpoint and reuse rights were not resolved. Consultation is planning evidence, not proof that a facility operates.                 |

[Penrith's data portal](https://data.penrith.city/) redirected to login. [Parramatta's linked ArcGIS hub](https://open-data-parracity.hub.arcgis.com/) returned a page shell without an inspected dataset. Several council pages returned HTTP 403 while their indexed content remained available. These are distinct retrieval outcomes, not assertions that a facility or every council dataset is closed. See the [Australian source register](community-infrastructure-sources.md).

## Architecture: proposed asset crosswalk and field mapping

MapAble Access and GAIS maintainers should own any future crosswalk. A local-government-area match is not an asset-identity match. Before integrating a council release, retain the following:

| Source information                                        | Proposed mapping and gate                                                                                                                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Council asset ID, facility/amenity ID and release version | Namespace the original ID, retain its source URL and connect it to a GAIS feature only after human review. Proximity or matching names alone are insufficient.                                                              |
| Entrance, cubicle, individual bay, path or parent site ID | Preserve separate identities and parent/child relationships. Do not collapse a toilet building, its entrance and a nearby parking bay into one point.                                                                       |
| Source boundary `shapeuuid`, `OBJECTID`, `abscode`        | Preserve as boundary provenance. The current numbers, such as `6260`, `2380`, `6350` and `750`, are source codes, not verified five-digit ABS geography identifiers. Never manufacture an ABS join by prefixing or padding. |
| Coordinates, CRS and geometry role                        | Validate transform, units and asset extent; distinguish site coordinates from entrances and surveyed path geometry.                                                                                                         |
| Accessibility claims, measurements and equipment          | Retain original values, observation scope, unknowns and conflicts; a council label does not independently certify participant suitability.                                                                                  |
| Hours, keys, restrictions and temporary closure           | Keep conditions and their dates separately from stable asset characteristics. Do not infer open-now or functioning equipment.                                                                                               |
| Publisher, release, licence and attribution               | Archive release-specific rights and evidence of permission before bulk redistribution or OSM contribution. A public webpage is insufficient.                                                                                |

Related measurement requirements are in the [built-environment brief](community-infrastructure-built-environment.md); statistical-geography joins have separate gates in the [ABS context brief](community-infrastructure-abs-context.md).

## Manual refresh, tests and failure recovery

The boundary inputs are stored as [`nsw-lga-boundaries.geojson`](../../data/community-infrastructure/nsw-lga-boundaries.geojson) and [`nsw-lga-boundaries-receipt.json`](../../data/community-infrastructure/nsw-lga-boundaries-receipt.json). The inspected raw bytes match the receipt checksum and byte length. Geometry is a maintainer import dependency, not a runtime browser download. The loader validates bounded input, checksum, source count, CRS, required fields and closed nondegenerate rings before generating jurisdiction properties.

The existing manual OSM refresh command remains:

```sh
node --import tsx scripts/refresh-community-infrastructure.ts all
```

The single-window forms use `parramatta`, `penrith` or `blacktown`. The supported downloaded-response form remains `--from-file AREA FILE --retrieved-at ISO_TIMESTAMP`, with actual receipt time supplied. These refreshes use the reviewed local boundary input; they do not imply that council pages or boundary geometry are fetched on every request. Replacing the boundary extract requires a new receipt and rights review before recomputing matches.

The 17 passing tests in [`community-infrastructure-councils.test.ts`](../../tests/community-infrastructure-councils.test.ts) cover geometry and receipt validation, including holes, edges, overlapping candidates, unmatched points, coordinate order, integrity/count mismatches, invalid rings and the stored snapshot. The focused command is:

```sh
corepack pnpm exec vitest run tests/community-infrastructure-councils.test.ts
```

API/UI acceptance must preserve match status and ownership limits and make source links available through a keyboard and screen-reader equivalent list. No colour-only jurisdiction or confidence cue should be required. These broader results are recorded in the implementation report rather than inferred from geometry tests.

**Security and privacy:** Publish infrastructure and council references only. No participant health profile, travel history or personal location is needed for this deterministic join. Future participant reports require existing consent and moderation controls; source text remains untrusted input.

**Failure and rollback:** Failed geometry or receipt validation must preserve the previous approved snapshot. A missing join remains explicitly unjoined; an inaccessible council page must not remove the facility or change its access claim. Keep an audit trail, original evidence and the ability to roll back geometry, receipt and generated associations together. The fallback is the source-reported facility with no stronger council assignment.

The strict MapAble technical validator checks document structure and claim controls. Its success is not evidence that the importer passed tests, the page was deployed, a council owns an asset or a participant can use it.
