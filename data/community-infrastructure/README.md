# Community infrastructure source snapshot

This directory contains a bounded, manually refreshed OpenStreetMap extract for three proposed Western Sydney study windows. It is a source report, not an independent MapAble access assessment. Window boundaries are in `lib/access/community-infrastructure/config.ts`; they are not council boundaries.

## Data licence

The OSM-derived database in `osm-snapshot.json` is © OpenStreetMap contributors and is made available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). See [OSM copyright and attribution](https://www.openstreetmap.org/copyright). This data licence is separate from the application's source-code licence. Retain source IDs, attribution and licence fields in redistribution.

## Refresh

Run `node --import tsx scripts/refresh-community-infrastructure.ts all` from the repository root after installing the pinned dependencies with `corepack pnpm install --frozen-lockfile`. A single study area identifier can replace `all`. The script makes sequential bounded requests to a fixed Overpass endpoint, limits response bytes, rejects partial/error/capped/malformed results and refuses empty refreshes. All selected areas must succeed before the file is atomically replaced. Review the data diff, tests and attribution before publication. No automatic upstream OSM edits occur.

If the runtime cannot reach Overpass, a maintainer can download the exact query returned by `buildCommunityOverpassQuery(area)` from the same endpoint, retain its receipt timestamp, and use `node --import tsx scripts/refresh-community-infrastructure.ts --from-file AREA /absolute/path/response.json --retrieved-at ISO_TIMESTAMP`. This uses the same bounded parsing, area filtering and atomic replacement. `ISO_TIMESTAMP` is the recorded time the source response was received, not the later import time or a field survey date. This is a local maintainer command, not a public file-upload API. It cannot authenticate the origin of a supplied file; retain the original download receipt for review.

Public API requests read this snapshot; they do not contact Overpass, Nominatim, Mapbox, or participant databases. A failed refresh preserves the last good file. Missing areas remain `not_loaded`, not a statement that no facilities exist. Dates record retrieval and source editing separately; a source check date is scoped and never promoted to a whole-site inspection.

## Precision

OSM nodes are source mapped points. Ways and relations use Overpass bounding-box centres and are marked `approximate_bbox_centre`; they may not lie at an entrance, bay or even inside the original polygon. This first slice is a point-discovery layer. It does not provide boundaries, a pedestrian graph, accessible routing, current parking vacancies, or equipment availability. Multi-category source objects produce separately identified category features. Nearby duplicates are not automatically conflated.

National Public Toilet Map, Changing Places and council data are documented in `docs/map/community-infrastructure-sources.md`; they are not included in this extract.
