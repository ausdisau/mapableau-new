# Community infrastructure source snapshots

This directory contains a bounded, manually refreshed OpenStreetMap extract for three fixed Western Sydney study windows, a reviewed NSW local-government boundary extract, and official council reference links. Facility information remains source-reported rather than independently assessed by MapAble. Window rectangles are defined in `lib/access/community-infrastructure/config.ts`; they are not council boundaries.

## Files and source roles

| File                              | Role                                                                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `osm-snapshot.json`               | OSM facility projections and their source evidence; each current record also carries a derived display-point council association.                                                                               |
| `nsw-lga-boundaries.geojson`      | Six complete NSW Spatial Services polygons intersecting the source query envelope. The source service returned EPSG:4326 coordinates from its EPSG:7844 layer. No local clipping or simplification was applied. |
| `nsw-lga-boundaries-receipt.json` | Exact source/query URLs, retrieval time, CRS, source count, byte length, SHA-256, source fields, licence and attribution evidence.                                                                              |
| `council-references.json`         | Six council identities and 18 official lookup links. Every link has `bulkReuseStatus: "not_established"` and `importEnabled: false`; these are references, not imported council facility feeds.                 |

The boundary GeoJSON is used by the maintainer importer. Public requests read the prepared snapshot and reference registry; they do not load the raw boundary geometry into the browser or query an external council service.

## Data licences and attribution

The OSM-derived facility data in `osm-snapshot.json` is © OpenStreetMap contributors and is made available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). See [OSM copyright and attribution](https://www.openstreetmap.org/copyright). Retain OSM source IDs, attribution and licence fields in redistribution.

The boundary source is NSW Spatial Services' [LocalGovernmentArea layer 8](https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme_multiCRS/FeatureServer/8). Its item licence metadata links [Spatial Services copyright](https://www.spatial.nsw.gov.au/copyright); the recorded licence is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The receipt preserves the extraction date and rights evidence, including the inconsistent direct retrieval of the copyright page. Retain the boundary attribution with its derived council associations:

> © State of New South Wales (Spatial Services, a business unit of the Department of Customer Service NSW). For current information go to spatial.nsw.gov.au.

Keep these source licences distinct from each other and from the application's source-code licence. Boundary reuse rights do not confer rights to bulk-copy council pages, facility databases, logos or third-party map imagery. Council links remain reference-only until the exact facility release and its permitted reuse have been reviewed.

## Refresh

Run `node --import tsx scripts/refresh-community-infrastructure.ts all` from the repository root after installing the pinned dependencies with `corepack pnpm install --frozen-lockfile`. A single study area identifier can replace `all`. The script makes sequential bounded requests to a fixed Overpass endpoint, limits response bytes, rejects partial/error/capped/malformed results and refuses empty refreshes. All selected areas must succeed before the file is atomically replaced. Review the data diff, tests and attribution before publication. No automatic upstream OSM edits occur.

The same script reads the local boundary GeoJSON and receipt, checks their bounded structure, checksum, byte count, source count, CRS and required fields, then computes each feature's display-point association. A point outside the recorded extraction envelope is rejected. Updating boundaries is a separate maintainer review: retain the exact new source response and receipt, verify rights and scope, then refresh all affected areas. The normal refresh does not silently fetch a newer boundary release.

If the runtime cannot reach Overpass, a maintainer can download the exact query returned by `buildCommunityOverpassQuery(area)` from the same endpoint, retain its receipt timestamp, and use `node --import tsx scripts/refresh-community-infrastructure.ts --from-file AREA /absolute/path/response.json --retrieved-at ISO_TIMESTAMP`. This uses the same bounded parsing, area filtering and atomic replacement. `ISO_TIMESTAMP` is the recorded time the source response was received, not the later import time or a field survey date. This is a local maintainer command, not a public file-upload API. It cannot authenticate the origin of a supplied file; retain the original download receipt for review.

Public API requests do not contact Overpass, Nominatim, Mapbox, Spatial Services, council websites or participant databases. A failed refresh preserves the last good file. Missing areas remain `not_loaded`, not a statement that no facilities exist. Dates record retrieval and source editing separately; a source check date is scoped and never promoted to a whole-site inspection. Boundary retrieval/modification dates are not facility inspection dates.

## Precision

OSM nodes are source mapped points. Ways and relations use Overpass bounding-box centres and are marked `approximate_bbox_centre`; they may not lie at an entrance, bay or even inside the original polygon. The public facility layer remains a point-discovery layer. It does not establish a pedestrian graph, accessible route, current parking vacancy or equipment availability. Multi-category source objects produce separately identified category features. Nearby duplicates are not automatically conflated.

Council association uses `display_point_in_polygon`; it does not establish asset ownership, operation, maintenance responsibility or verified access. Holes are respected. Boundary-edge touches and overlapping candidates are ambiguous; zero matches are unmatched. A numerical tolerance of `1e-10` degrees is not a positional-accuracy buffer. Source `abscode` values remain unchanged and are not treated as verified five-digit ABS geography codes.

The current stored snapshot has 563 matched category projections: Parramatta's study window contains 157 City of Parramatta associations and eight Cumberland associations; Penrith has 300 and Blacktown has 98. There are no ambiguous, unmatched or unjoined records in this snapshot. These counts are not distinct council-owned asset counts.

See [council linkage documentation](../../docs/map/community-infrastructure-councils.md) for matching semantics, focused tests, future asset-ID crosswalks and rollback. National Public Toilet Map, Changing Places and council **facility inventories** remain unimported; their reference sources and rights gates are documented in the [Australian source register](../../docs/map/community-infrastructure-sources.md).
