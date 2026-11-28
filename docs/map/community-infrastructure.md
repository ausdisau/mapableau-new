# Community infrastructure layer

**Review date:** 28 November 2026, Australia/Sydney.

**Status:** Implemented, not independently verified in production.

**Scope:** Public, read-only OpenStreetMap facility discovery for bounded Western Sydney study windows.

## Problem and participant outcome

A location pin or an “accessible” label cannot explain whether a participant can use a parking space, reach a toilet or enter a public space. The useful information includes the source, relevant access conditions, what remains unknown and when any check occurred.

This slice adds source-reported parking, toilets and public spaces to MapAble through one GeoJSON contract and a Leaflet/list interface. Participants can inspect reported attributes without providing a disability profile or location history. The layer supports discovery and investigation; it does not establish a continuous accessible journey, available bay or working equipment.

## Current implementation evidence

The implementation is present in the paths below. Import counts, successful commands, browser results, commit identity and deployment evidence must be recorded in the accompanying change report. This overview does not substitute a planned check for an executed check.

| Capability           | Evidence path                                      | Boundary                                                                   |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Public page          | `app/accessibility-map/community/page.tsx`         | Linked from `/accessibility-map`; list-first participant interface.        |
| GeoJSON read API     | `app/api/access/community-infrastructure/route.ts` | Reads the packaged snapshot; no database or upstream source call.          |
| Source normalization | `lib/access/community-infrastructure/normalise.ts` | Deterministic OSM-to-GAIS projection with source-specific extensions.      |
| Query and filtering  | `lib/access/community-infrastructure/service.ts`   | Bounded, allowlisted filters over one selected study window.               |
| Manual refresh       | `scripts/refresh-community-infrastructure.ts`      | Fixed Overpass source; no OSM edits, scheduled job or participant records. |
| Dataset              | `data/community-infrastructure/osm-snapshot.json`  | Reviewed source snapshot, with per-area retrieval and OSM base timestamps. |
| Interface            | `components/accessibility-map/community/`          | Optional Leaflet map, equivalent list, evidence details and export.        |
| Focused tests        | `tests/community-infrastructure*.test.*`           | Source semantics, API limits and participant-interface behaviour.          |

The dataset is OSM-derived and carries ODbL 1.0 attribution. Its licence is separate from the application source-code licence. See the [dataset README](../../data/community-infrastructure/README.md) and [OpenStreetMap copyright information](https://www.openstreetmap.org/copyright).

### Task-session tool roles

| Tool                  | Completed role in this task                                                                          | Evidentiary boundary                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| AnyWhereMap           | Displayed a proposed Western Sydney planning viewport.                                               | The viewport is not an administrative-boundary or facility source.                       |
| Mapify                | Organised the infrastructure taxonomy as a mind map.                                                 | Organising concepts does not verify access claims.                                       |
| Mapbox                | Checked a bounding box and rendered 46 actual Parramatta parking/toilet source points for visual QA. | No search/geocoder results were persisted; no wheelchair-routing capability is asserted. |
| AI Task Brief Builder | Refined the delivery goal and scope.                                                                 | Native packaging was unspecified; no binary delivery is inferred.                        |

Map Builder also created an 18-marker companion review map, selecting two records per category in each study window from this same snapshot. Each marker retains its OSM link, source-report status, geometry precision and attribution. The [companion draft](https://mapbuilder.app/map?draft=flT--Lf4om7R_zgZz4fOwg&utm_source=chatgpt) is a sample, not the full dataset or a routing service; Map Builder reported a 30-day retention period unless saved there.

These session actions support scoping and review. The runtime data source remains the packaged OSM snapshot; it does not call these tools per request.

The canonical Vercel project for `mapable.com.au` is `mapableau`, as verified through its project-domain records. This work prepares a preview against that existing project. A deployment or readiness claim requires its own successful build and HTTP/browser evidence; this document does not assert a production release or change to the canonical domain.

## Study windows and source selection

These are fixed rectangles around town centres, **not local government area boundaries or complete facility inventories**. The authoritative configuration is [`config.ts`](../../lib/access/community-infrastructure/config.ts).

| Identifier   | Display name      | West, south, east, north           |
| ------------ | ----------------- | ---------------------------------- |
| `parramatta` | Parramatta centre | `150.99, -33.83, 151.02, -33.8`    |
| `penrith`    | Penrith centre    | `150.68, -33.77, 150.71, -33.74`   |
| `blacktown`  | Blacktown centre  | `150.895, -33.78, 150.925, -33.75` |

The Overpass query selects standalone toilets; venues reporting toilets; parking objects with specified disability-space information; parks, gardens, playgrounds and squares. A zero `capacity:disabled` is retained as a reported count. The query does not enumerate every parking space, path, kerb, building or amenity.

An OSM object can produce separate category features, for example a park and toilets reported at that park. Counts therefore describe category projections, not necessarily distinct sites. Nearby records are not automatically conflated. A park/garden category does not establish unrestricted public entry; source access restrictions remain visible.

### Imported snapshot reviewed on 28 November 2026

The following values were computed directly from `osm-snapshot.json` after import. Retrieval times below are on 28 November 2026 in Sydney (AEDT); the dataset retains full ISO timestamps in UTC.

| Window     | OSM input objects | Parking projections | Toilet projections | Public-space projections | Total projections | Retrieved  |
| ---------- | ----------------- | ------------------- | ------------------ | ------------------------ | ----------------- | ---------- |
| Parramatta | 173               | 20                  | 33                 | 112                      | 165               | 21:04:40   |
| Penrith    | 311               | 122                 | 25                 | 153                      | 300               | 21:09:23   |
| Blacktown  | 103               | 17                  | 9                  | 72                       | 98                | 21:10:09   |
| Total      | 587               | 159                 | 67                 | 337                      | 563               | Per window |

Across those 563 projections, wheelchair status is unknown for 535, reported yes for 24, limited for one and no for three. This describes the imported source fields, not the prevalence of accessible or inaccessible infrastructure. Most records require additional access evidence before they can support individual journey decisions.

## Architecture and the GAIS contract

The normalizer constructs the existing `GaisFeature` type and calls `gaisFeatureToGeoJson`. `CommunityInfrastructureFeature.properties` extends `GaisGeoJsonFeatureProperties` with category, source, geometry-role and raw-tag fields. It therefore shares GAIS evidence vocabulary and GeoJSON projection, rather than creating another verification system. See [GAIS convergence](../architecture/gais-convergence.md).

The initial community endpoint is a snapshot-backed read adapter. It does **not** alter the existing Prisma-backed GAIS queries, create `AccessPlace` records, add observations to moderation or enable routing. The single community contract is available for web and future platform adapters; the existing GAIS APIs retain their own current scopes and flags.

### Identity and geometry

- `source.id`: `osm:<node|way|relation>:<numeric-id>`.
- Feature `id`: the source identity plus `:<parking|toilet|public_space>`.
- `source.url`: the specific OSM object, not an inferred venue website.
- GeoJSON coordinates use longitude, latitude. Leaflet marker construction reverses them for its latitude/longitude API.
- Nodes use `geometryRole: mapped_point`; ways and relations use `approximate_bbox_centre` from Overpass. A representative centre can be outside the original polygon and is not an entrance or individual bay.
- Every feature has `routeEndpoint: false`; collection metadata has `liveNationalRouting: false`.

Invalid identities, coordinates and malformed source responses are rejected. Representative points outside the selected study rectangle are omitted. Exact geometry validation and boundaries are implemented in the normalizer and its focused tests.

### Evidence and dates

Every imported feature retains `COMMUNITY_REPORTED` GAIS evidence, with `claimState: source_reported_not_independently_verified` in collection metadata. A `wheelchair=yes` tag is a source claim; it does not promote the record to independently verified status.

| Field                               | Meaning                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `source.retrievedAt`                | When this source response was retrieved.                        |
| `source.sourceUpdatedAt`            | Valid OSM object edit timestamp, where supplied.                |
| `source.checkedAt` / `checkedScope` | A valid source check/survey date and its scope, where supplied. |
| Area `osmBaseTimestamp`             | Overpass's source database timestamp, where supplied.           |
| Snapshot `generatedAt`              | When the packaged snapshot was generated.                       |
| Response `meta.generatedAt`         | Retrieval timestamp of the selected area's snapshot.            |

No feature-wide `observedAt` is invented from these dates. Generic `check_date` is labelled as an existence check without established access details. A venue-toilet projection prioritises `check_date:toilets:wheelchair`; other projections use `check_date:wheelchair`, with documented fallbacks in code. Invalid or future calendar dates are excluded from normalized check fields while raw allowlisted tags remain available. Sydney's calendar day is used when evaluating source dates.

### Unknown access and venue toilets

The wheelchair field preserves `yes`, `limited`, `no` and `designated`. Missing or unrecognized values become `unknown`, not `no`; raw source values remain inspectable. Unknown results are included by default.

A venue with `wheelchair=yes` and `toilets=yes` does not establish wheelchair access to its toilets. A hosted toilet projection uses `toilets:wheelchair` independently and labels general venue hours/access/fees as venue information. A standard changing-table tag describes baby-changing provision; it does not establish an adult table, hoist or Changing Places facility.

Dimensions, slopes, opening schedules and restrictions are retained as source text. The current layer does not calculate standards compliance, open-now status, route suitability, parking vacancy or equipment operation. Category-specific missing details are shown explicitly.

## Public API and export

`GET /api/access/community-infrastructure` returns `application/geo+json` with a `FeatureCollection`, source attribution and metadata. It is public and does not set a session cookie. Successful responses use a five-minute public cache and one-hour shared-cache directive; invalid queries return HTTP 400, `INVALID_QUERY` and `Cache-Control: no-store`.

This exact endpoint supports anonymous `GET`, `HEAD` and `OPTIONS` for external map clients. Next.js derives HEAD handling from GET; the explicit OPTIONS handler returns 204. CORS permits `Access-Control-Allow-Origin: *`, accepts the `Accept` header and exposes `Link`. It does not enable credentialed requests or accept authorization headers through its preflight. External clients should omit credentials. An exact-path rule in `vercel.json` matches this public endpoint; unrelated APIs retain their existing CORS policy.

| Parameter    | Accepted values/default                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `area`       | `parramatta`, `penrith`, `blacktown`; default `parramatta`.                |
| `category`   | `parking`, `toilet`, `public_space`, `all`; default `all`.                 |
| `wheelchair` | `yes`, `limited`, `no`, `designated`, `unknown`, `all`; default `all`.     |
| `limit`      | Integer 1–500; default 500.                                                |
| `offset`     | Integer 0–100000; default 0.                                               |
| `bbox`       | Optional `west,south,east,north`, wholly inside the selected study window. |
| `format`     | Optional `geojson`; no other output format.                                |

Unknown or repeated parameters, malformed bounds, unsupported values and excessive URL length are rejected. `area=all` is not a public API value: `all` is a manual-refresh command option.

Example requests:

```text
/api/access/community-infrastructure?area=parramatta
/api/access/community-infrastructure?area=penrith&category=parking&wheelchair=unknown
/api/access/community-infrastructure?area=blacktown&category=toilet&format=geojson
```

`featureCount`, `totalMatched` and `truncated` distinguish the response page from the full match count. `dataStatus: not_loaded` means the area has no imported snapshot; it is different from a loaded snapshot with zero filtered matches. The UI's download link preserves selected filters and returns the same bounded API page. Clients exporting more than 500 matches must page with `offset`; the list's “show more” reveals more already-fetched records and does not perform server pagination.

## Interface, accessibility and privacy

The page starts in list mode. Filters are labelled, result status is announced politely, and source details have explicit disclosure controls. “Map + list” loads Leaflet on request. Letter-and-colour markers have accessible labels and focus the corresponding list card; users can skip the map. Tile or map failure leaves the list available. Network failure, unloaded coverage and no filter matches have separate messages and recovery behaviour.

WCAG 2.2 AA is the acceptance target. Component tests cover focus, list/map parity, source-text safety, filter/export consistency, dates and recovery; they do not prove browser rendering, assistive-technology compatibility or participant usability. Keyboard, screen reader, switch/AAC, text enlargement and mobile-layout checks remain explicit release evidence.

This component does not request GPS, send access profiles or create a private journal. Public tags are allowlisted, text bounded and mapper identity fields omitted. Source strings are rendered as text. Site-wide scripts and hosting logs remain part of the wider application's privacy assessment; this feature does not certify their behaviour. Participant reports would require the existing consent, moderation and audit controls before a future write path is enabled.

The map uses `NEXT_PUBLIC_OSM_TILE_URL`, falling back to standard OSM tiles, and `NEXT_PUBLIC_MAP_ATTRIBUTION` for additional provider credit. OSM attribution remains visible. Provider changes require appropriate attribution/terms review. No offline tile-prefetch feature is implemented; [OSM's tile policy](https://operations.osmfoundation.org/policies/tiles/) applies independently of the data licence.

## File layout and verification commands

| Path                                                                         | Responsibility                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `lib/access/community-infrastructure/types.ts`                               | Community contract extending GAIS.                              |
| `lib/access/community-infrastructure/config.ts`                              | Windows, limits, source notice and bounded Overpass query.      |
| `lib/access/community-infrastructure/normalise.ts`                           | Identity, categories, source dates, claims and GAIS projection. |
| `lib/access/community-infrastructure/service.ts`                             | Query validation and immutable snapshot filtering.              |
| `scripts/refresh-community-infrastructure.ts`                                | Manual import and atomic snapshot replacement.                  |
| `components/accessibility-map/community/CommunityInfrastructureExplorer.tsx` | Filters, list, states, evidence cards and export.               |
| `components/accessibility-map/community/CommunityInfrastructureMap.tsx`      | Optional Leaflet renderer and tile failure handling.            |
| `components/accessibility-map/community/presentation.ts`                     | Labels, dates and safe attribution text.                        |

From the repository root, refresh all configured windows manually:

```bash
node --import tsx scripts/refresh-community-infrastructure.ts all
```

A single area identifier can replace `all`. The Node import form avoids the standalone `tsx` CLI's IPC limitation in this execution environment. Dependencies and source network access are required. Do not treat failure to reach Overpass as an empty successful import.

For an already downloaded raw response, the script also accepts `--from-file AREA FILE --retrieved-at ISO_TIMESTAMP`. This mode requires one supported area, a bounded raw JSON file and the recorded receipt timestamp from that original retrieval. It runs the same normalizer and atomic replacement logic; it does not grant authority to relabel an old source as freshly retrieved. The reviewed three-window snapshot was populated through this mode after fixed bounded Overpass responses were downloaded separately.

Run the focused tests:

```bash
corepack pnpm exec vitest run tests/community-infrastructure.test.ts tests/community-infrastructure-api.test.ts tests/community-infrastructure-ui.test.tsx tests/map-geojson.test.ts
```

The implementation review recorded 70 passing focused tests: 31 normalization/source-semantics, 27 API/snapshot, 10 interface and two shared map-GeoJSON tests. The full TypeScript check also passed with a 6,144 MB Node heap limit. These results describe local verification at that checkpoint; later changes require the affected checks to be rerun. They do not establish a production release or complete assistive-technology assessment.

Review data diffs, attribution, category semantics, source timestamps and test output before publishing a refreshed snapshot. The importer bounds source bytes/elements, rejects partial/capped/error responses, refuses unexplained empty refreshes and replaces the snapshot atomically only after the selected refresh succeeds. No automatic upstream OSM contribution occurs.

## Related intake work and source expansion

At this review, related work remained in open, unmerged pull requests:

- [PR #681: OSM Commons intake](https://github.com/ausdisau/mapableau-new/pull/681): research flag off, no runtime activation.
- [PR #586: NPTM intake](https://github.com/ausdisau/mapableau-new/pull/586): gated moderation intake; no NPTM import supplied by this change.

This read-only display snapshot complements those intake proposals. It does not silently reuse unavailable branch code, turn on research flags, publish moderated records or bypass their approval flow. Reassess overlap before either intake PR merges.

The existing [source registry](../../lib/access/data-sources/registry.ts) marks OSM and NPTM as operational-import candidates. That metadata is not proof of an executed import or settled terms for a specific current release. The [Australian source register](community-infrastructure-sources.md) records exact-source licensing, freshness and schema questions. NPTM, Changing Places, council data and TfNSW occupancy are not part of the OSM snapshot.

Mapbox presentation, AnyWhereMap exploration and Mapify organisation do not become authoritative accessibility sources merely because they display or organise records. React Native and Electron are proposed consumers of the public contract; no native binary or parallel application is delivered. See the [platform adaptation brief](community-infrastructure-platforms.md).

The supplied NHVR planner reference is assessed in the [routing integration brief](community-infrastructure-routing.md). It concerns heavy-vehicle network access and does not supply wheelchair-route evidence. The [symbol provenance record](community-infrastructure-symbols.md) documents the three locally served NPS category symbols and retained repository licence. The National Public Toilet Map is available as a direct lookup link in the interface while its additional dataset intake remains separate.

The [built-environment evidence brief](community-infrastructure-built-environment.md) checks the supplied architectural article against official Australian sources and proposes scoped measurement evidence without an automatic compliance result. The [PubMed and JSTOR research brief](community-infrastructure-research.md) distinguishes participant research, interpretive scholarship and design inferences; software tests do not establish participant outcomes. The [ABS context brief](community-infrastructure-abs-context.md) assesses the supplied API description for future area-level context, with explicit geographic and measure boundaries.

## Failure recovery, rollback and next gates

| Condition                                       | Behaviour or required response                                                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Source refresh fails or is incomplete           | Preserve the previous snapshot; investigate and retry manually.                                                                           |
| Public query is invalid                         | Return bounded noncacheable error without source calls.                                                                                   |
| User changes filters while a request is pending | Cancel/ignore the superseded response.                                                                                                    |
| Map or tiles fail                               | Retain list access and show a status message.                                                                                             |
| Incorrect source claim reported                 | Human review of source and snapshot; do not silently upgrade or erase evidence.                                                           |
| Regression after release                        | Restore the prior reviewed code/snapshot through the normal deployment workflow; no database migration rollback is needed for this slice. |

Proposed owners are the Access engineering lead for contract/imports, a data steward for source releases/licensing, the frontend maintainer for map/list parity, and participant reviewers for usability. These roles require assignment before expansion.

Next gates are recorded import/test/browser evidence for this bounded slice; participant review of useful missing details; exact-release approval for any additional source; reconciliation with the open intake PRs; and explicit route-graph evidence before any navigation claims. Any later native or desktop delivery requires its own compatibility, security, accessibility and release checks.
