# MapAble community infrastructure: Australian source register

**Review date:** 28 November 2026, Australia/Sydney.

**Status:** Proposed source expansion; research and schema inspection completed.

**Purpose:** Help participants judge whether parking, toilets and public spaces suit their own access requirements, with visible evidence and gaps.

## Current state and implementation boundary

The agreed initial implementation uses an OpenStreetMap source snapshot, a public GeoJSON layer and a Leaflet view covering three small Western Sydney study windows. Its actual import counts, query boundaries and verification results belong in the implementation report. This register does not certify those results.

The Australian sources below were researched to support the next stage. The National Public Toilet Map (NPTM), Changing Places, council records and Transport for NSW feeds are **not connected or bulk imported by this change**. Several offer useful public information, but current release rights, freshness or reusable endpoints remain unresolved. A public website, searchable application or discoverable schema is not proof of an operational MapAble integration.

The participant journey is parking or arrival point → crossing or kerb → path → entrance → facility. Evidence for one element must not be promoted into a claim about the whole journey. A facility labelled accessible may still have unknown transfer space, door width, approach conditions or operating status.

## Evidence ledger

| Source or dependency                 | Status                                                        | Evidence                                                     | Confidence and consequence                                                                      |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| NPTM monthly publication             | Verified live documentation                                   | [S1](#s1-national-public-toilet-map-publication-and-rights)  | High for the documented cadence; a particular release still needs inspection.                   |
| NPTM November 2026 CSV               | Verified catalogue metadata; bytes not inspected              | [S2](#s2-national-public-toilet-map-catalogue-record)        | Medium: ARDC metadata names the release; direct data.gov.au retrieval returned 403.             |
| NSW-hosted NPTM ArcGIS mirror        | Verified live schema                                          | [S3](#s3-nsw-hosted-national-public-toilet-map-mirror)       | High for advertised fields and query formats; mirror release date remains unknown.              |
| Historical NPTM boolean defaults     | Historical documented limitation                              | [S4](#s4-national-public-toilet-map-field-semantics)         | High for the 2021 warning; later field-level correction has not been established.               |
| Changing Places Australian directory | Verified live public directory                                | [S5](#s5-changing-places-australia)                          | High for directory features; reusable public API and bulk licence not established.              |
| Western Sydney council sources       | Verified public information; proposed integration             | [S6](#s6-parramatta), [S7](#s7-penrith), [S8](#s8-blacktown) | Useful discovery and verification sources; coverage, redistribution rights and API access vary. |
| Transport for NSW parking occupancy  | Verified dataset/resource documentation; proposed integration | [S9](#s9-transport-for-nsw)                                  | Selected car parks only; accessible-bay-specific occupancy not established.                     |
| City of Sydney access mapping        | Verified public documentation; proposed expansion source      | [S10](#s10-city-of-sydney)                                   | Useful model for surveyed paths; individual dataset terms and currency require inspection.      |

“Verified live” here means the specified page or schema was observed during research. It does not mean a facility was visited, a feed was imported, an API was authenticated or production behaviour was tested.

## Data model and domain ownership

MapAble Access should own public infrastructure records and their evidence history. Transport and other modules should reference stable facility identifiers rather than maintain conflicting copies. Preserve upstream records separately from participant reports and verified measurements.

Each future adapter should retain:

- Source-native identifier, source URL, publisher and original field values.
- Source release date, retrieval time and actual observation time as separate values; unknown dates stay null.
- Geometry role, such as site location, entrance, individual bay, path segment or facility footprint.
- Field-level claim, source semantics, review status and any conflicting evidence.
- Release-level licence/attribution text and the permitted publication purpose.
- Availability/closure events separately from enduring characteristics.

These are proposed requirements for future adapters. The initial OSM layer may expose a smaller contract. Do not silently collapse missing source fields into false values while bridging the contracts.

## NPTM adapter field mapping

The inspected NSW mirror uses lowercase names and string fields for most flags. The original field documentation uses names such as `FacilityID` and `ParkingAccessible`. Preserve the source vocabulary as well as normalized values. [S3](#s3-nsw-hosted-national-public-toilet-map-mirror), [S4](#s4-national-public-toilet-map-field-semantics)

| Source fields                                                                      | Proposed MapAble purpose | Interpretation boundary                                      |
| ---------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `facilityid`, `url`, `name`, `facilitytype`                                        | Identity and source link | A site may contain several facility types.                   |
| `latitude`, `longitude`, `address1`, `town`, `state`, `addressnote`                | Site location            | Do not infer entrance or cubicle coordinates.                |
| `parking`, `parkingaccessible`, `parkingnote`                                      | Parking reported at site | No bay count, dimensions, clearance or vacancy implied.      |
| `keyrequired`, `mlak24`, `mlakafterhours`, `paymentrequired`, `accessnote`         | Conditions of entry      | Keep key and time restrictions separately.                   |
| `adultchange`, `changingplaces`, `byosling`, `acshower`, `adultchangenote`         | Adult-change claims      | Distinguish equipment, registration and operating condition. |
| `accessible`, `ambulant`, `lhtransfer`, `rhtransfer`, `toiletnote`                 | Toilet access claims     | Retain raw transfer terminology pending orientation checks.  |
| `openinghours`, `openinghoursnote`                                                 | Reported schedule        | Unknown/variable hours are not “open now”.                   |
| `male`, `female`, `unisex`, `allgender`, `babychange`, `babycareroom`              | Facility options         | Options may coexist at a site.                               |
| `sharpsdisposal`, `drinkingwater`, `sanitarydisposal`, `menspaddisposal`, `shower` | Additional amenities     | Presence does not establish current availability.            |

`acmlak` is present in the mirror but described as reserved/unused in the 2021 source documentation. Preserve it without treating it as an active access condition. [S4](#s4-national-public-toilet-map-field-semantics)

### TRUE, FALSE and unknown

The October 2021 release notes state that newly introduced flags were initially set to FALSE and advise relying on those flags only when TRUE until sufficient provider updates exist. This is a historical source-semantics warning, not evidence that every current FALSE is wrong. A later export alone does not prove an individual flag was checked. [S4](#s4-national-public-toilet-map-field-semantics)

Proposed normalization:

| Input/evidence                                                                    | Normalized claim                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Missing, blank, unrecognized or documented default with no confirming observation | `unknown` or `not_reported`                           |
| Source TRUE                                                                       | `reported_yes`, retaining source and dates            |
| Source FALSE with uncertain default semantics                                     | `unknown`, retaining the original FALSE               |
| Explicit dated negative observation with known meaning                            | `reported_no` or `observed_no`, according to evidence |
| Contradictory observations                                                        | `conflicting`, with both sources available            |

Parse booleans explicitly. In JavaScript, `Boolean("FALSE")` is true and must not be used for these source fields. This normalization should be deterministic, reviewable and covered by focused tests.

## Source register

### S1. National Public Toilet Map publication and rights

- [Official National Public Toilet Map lookup](https://toiletmap.gov.au/).
- [Official description and service information](https://toiletmap.gov.au/About).
- [Official copyright and publication information](https://toiletmap.gov.au/Copyright).
- [Canonical downloadable dataset](https://data.gov.au/data/dataset/national-public-toilet-map).

The official website states that dataset releases are published at the beginning of each month and directs consumers to data.gov.au for licensing. It separates dataset licensing from website material and Google cartography. Do not reproduce the website's map imagery under an assumed dataset licence.

**Gate:** inspect and retain the actual release terms before republication. A failed fetch must leave the last approved snapshot intact and visibly dated.

#### Follow-up to the supplied Toilet Map URL

The explicit user-supplied `https://toiletmap.gov.au/` was revisited on 28 November 2026. Its official lookup and copyright pages were readable. Canonical dataset retrieval remained blocked: the dataset page, modern catalogue landing page and both public CKAN package lookup forms returned HTTP 403 in this research environment. This is a retrieval limitation, not a conclusion that permitted dataset reuse is prohibited.

Exact catalogue targets for the next successful source review:

- [Dataset package landing page](https://data.gov.au/dataset/ds-dga-553b3049-2b8b-46a2-95e6-640d7986a8c1/details).
- [CKAN package lookup under `/data/api`](https://data.gov.au/data/api/3/action/package_show?id=national-public-toilet-map).
- [CKAN package lookup under `/api`](https://data.gov.au/api/3/action/package_show?id=national-public-toilet-map).
- Package identifier: `553b3049-2b8b-46a2-95e6-640d7986a8c1`.

The current downloadable resource identifier, response schema and release-specific terms remain unconfirmed. A historical CSV resource appeared in the [official December 2024 NationalMap catalogue](https://www.ga.gov.au/scientific-topics/national-location-information/nationalmap/NationalMap-Catalogue-Extract-December2024.pdf), but its filename referred to a 2020 export. It is not a suitable substitute for a verified current release.

The official lookup is useful immediately as an external search destination. Preserve the distinction between a participant opening that official service and MapAble ingesting its records. Do not scrape the website's Google map or invent location-filter query parameters. Once a permitted dataset is available, use its actual facility URL field for individual-record links.

#### Converge with the existing intake proposal

[PR #586](https://github.com/ausdisau/mapableau-new/pull/586) already contains a gated NPTM moderation-intake proposal. It remains unmerged and is not activated by this work. Build on that reviewed intake when available rather than add a competing NPTM publication pipeline.

The concrete next integration should capture one canonical release's resource URL, licence text, publication timestamp, retrieval timestamp and checksum; reconcile the observed columns with the field mapping above; exercise boolean/default/unknown handling using synthetic records; and project approved public facts into the existing GAIS contract. Retain source-native facility identity and avoid merging records solely by proximity. A release-level decision and the existing moderation/activation gates must precede public source publication. No new NPTM adapter or bulk dataset was added in this follow-up.

### S2. National Public Toilet Map catalogue record

- [ARDC Research Data Australia harvested record](https://researchdata.edu.au/national-public-toilet-map/3785686).
- [Official Brisbane reuse attribution](https://data.brisbane.qld.gov.au/explore/dataset/public-toilets-in-brisbane/images/).

The ARDC record names a November 2026 CSV and labels rights CC BY 3.0 Australia. Its description also reproduces bespoke terms concerning sublicensing, updates and disclaimers. Brisbane's official attribution describes its NPTM source as CC BY 3.0 Australia. These observations warrant checking the canonical release; they do not resolve the apparently overlapping wording.

**Gate:** record exact licence text, attribution, release checksum and applicable conditions. No blanket permission for OSM import is inferred.

### S3. NSW-hosted National Public Toilet Map mirror

- [Feature service](https://portal.data.nsw.gov.au/arcgis/rest/services/Hosted/National_Public_Toilet_Map/FeatureServer).
- [Layer 0 and field schema](https://portal.data.nsw.gov.au/arcgis/rest/services/Hosted/National_Public_Toilet_Map/FeatureServer/0).

The layer advertises GeoJSON, JSON and PBF, point geometry, pagination and a 2,000-record response limit. Native coordinates use EPSG:3857. Its source-release date was not established in this review.

**Proposed adapter:** bounded spatial queries, explicit pagination and EPSG:4326 output for GeoJSON. Store native IDs and metadata. A retrieved timestamp cannot substitute for a source release or inspection date. Query capability is documented; no data import or completeness check was performed here.

### S4. National Public Toilet Map field semantics

- [Official spreadsheet field guide, October 2021](https://toiletmap.gov.au/documentation/spreadsheetverification.pdf).
- [Official release notes, October 2021](https://data.gov.au/data/dataset/553b3049-2b8b-46a2-95e6-640d7986a8c1/resource/cc5aff29-786e-4548-ba2c-5a58fb05f144/download/release-notes.pdf).

Use these as historical schema evidence, including the boolean-default warning above. Reconcile against the current export before enabling an adapter. The guide distinguishes accessible, ambulant, adult change and accredited Changing Places facilities. It describes several non-scheduled opening-hours values. Preserve those meanings rather than manufacture precise hours.

### S5. Changing Places Australia

- [Official Australian facility directory](https://changingplaces.org.au/find).
- [Official description of Changing Places features](https://changingplaces.org.au/why-changing-places).

The directory exposes location and feature filters, hours, MLAK information, venue links and a printable list. It also points to Changing Places listings in NPTM. The feature definition distinguishes these facilities from standard accessible toilets, including adult-change and hoist provision.

**Gap:** a documented reusable public API and bulk licence were not established. Use source links and individual verification until a permitted data feed is confirmed. Registration evidence and today's equipment availability remain separate claims.

### S6. Parramatta

- [Council parking-finder description](https://www.cityofparramatta.nsw.gov.au/community/getting-around/parking/find-car-bike-motorcycle-parking).
- [Accessible parking guidance](https://www.cityofparramatta.nsw.gov.au/community/getting-around/parking/car-parks/accessible-parking).
- [Council-linked Parking Finder](https://parramatta.spotparking.com.au/).
- [Find a park or reserve](https://www.cityofparramatta.nsw.gov.au/community/parks-and-public-spaces/find-a-park-or-reserve).
- [Council Data Visualisation Hub description](https://www.cityofparramatta.nsw.gov.au/council/projects/smart-city/data-visualisation-hub).
- [Council-linked ArcGIS hub](https://open-data-parracity.hub.arcgis.com/).

Council describes accessible-parking filtering and real-time/predicted parking information. Its park search includes an Accessible filter. The hub identifies public map applications including Parks near Me.

**Gap:** no reusable licensed accessibility endpoint or accessible-bay-specific occupancy feed was verified. Public application functionality does not establish these rights or data semantics.

### S7. Penrith

- [Council City Centre Parking Map](https://penrithcity.nsw.gov.au/services/other-services/parking/penrith-city-centre-parking-map).
- [Council-linked data portal](https://data.penrith.city/).

The parking page provides car-park descriptions, time restrictions and accessible-space counts. It displays a last-updated date of 27 August 2024 and warns that conditions may change daily. The linked data portal redirected to a login page during this review.

**Gap:** neither current counts nor a public licensed feed was established. Keep this source as discovery/verification evidence; do not relabel historical page counts as current vacancy or a surveyed bay inventory.

### S8. Blacktown

- [Wawai Ngurra inclusive adventure playspace](https://www.blacktown.nsw.gov.au/Sport-recreation/Parks-and-recreation-directory/Wawai-Ngurra-inclusive-adventure-playspace).
- [Council MLAK information](https://www.blacktown.nsw.gov.au/Community/Our-people/People-with-disability/Master-Locksmith-Access-Keys-MLAK).

The Wawai Ngurra page reports Changing Places, disability parking, accessible furniture, walking paths and other amenities. It is a useful candidate for participant-led site verification. The MLAK page was available in indexed search results, but direct retrieval returned 403.

**Gap:** no public bulk licence, comprehensive council inventory or real-time condition feed was established. A site location does not locate the individual toilet door or parking bay. Plans for future facilities elsewhere must remain separate from operating assets.

### S9. Transport for NSW

- [Car Park API resource](https://opendata.transport.nsw.gov.au/dataset/car-park-api/resource/b880cae7-ed81-4d3e-9aba-b948d6626b20).
- [Car Park API documentation resource](https://opendata.transport.nsw.gov.au/data/dataset/car-park-api/resource/1cd0b16d-d9f8-4973-93cd-3c6f66a3e99c).
- [Official description of real-time and historical coverage](https://opendata.prod.transport.nsw.gov.au/blog/realtime).

The documentation describes occupancy for selected car parks. Resource metadata labels the licence Creative Commons Attribution. Authentication, the operative licence version and detailed response semantics still require inspection.

**Gate:** only show accessible-bay vacancy if the source explicitly measures that category. Total-car-park vacancy cannot establish it. Timestamp, latency and stale-data behaviour must be part of any future availability contract.

### S10. City of Sydney

- [Official accessibility-map description and data sources](https://www.cityofsydney.nsw.gov.au/lists-maps-inventories/accessibility-map-city-centre).
- [Council data hub](https://data.cityofsydney.nsw.gov.au/).
- [Historical NSW-hosted access-audit item](https://portal.spatial.nsw.gov.au/portal/home/item.html?id=e94645d89ec4418bae6b939c49375c3d&sublayer=2).

The official map description covers parking, toilets, lifts and barriers. It identifies surveyed mobility routes incorporating slope, surface and cross-slope, and acknowledges currency/completeness limits. This is an expansion candidate beyond the Western Sydney windows. A separately discovered historical access-audit item reported August 2020 data; it must not be presented as current.

**Gate:** inspect each dataset's rights, survey date, geometry and semantics before reuse.

## Privacy, accessibility and participant control

The public layer should describe infrastructure. It should not contain participant health records, named travel histories, home addresses, identity documents or private reporter contact details. Keep any personal access preferences local or within existing MapAble consent controls; external map services do not need diagnoses. Photo/report intake needs moderation and a process to remove faces, number plates or unintended private details.

The proposed experience targets WCAG 2.2 AA: equivalent keyboard and screen-reader access to a text list, labelled filters, readable status descriptions, visible focus, and no dependence on pin colour or dragging. AAC users should be able to choose and compare access requirements without mandatory speech. Verification must include people with differing mobility, sensory and communication requirements. A map library alone does not establish conformance.

Show unknowns and contradictory evidence. Let the participant decide whether partial information is sufficient; do not convert an aggregate score into a universal “safe for you” label. A source problem should provide a clear correction route and human review through existing support processes.

## Test and assurance plan

Before enabling any future source adapter, test the concrete failure risks:

1. Source strings TRUE/FALSE, blank values and historical defaults remain semantically distinct.
2. A changed schema, interrupted download, paging truncation or duplicate native ID fails the import visibly without replacing an approved snapshot.
3. Coordinates are valid and correctly ordered; site points cannot be mistaken for bay/entrance geometry.
4. Publication, retrieval and observation dates remain separate; missing dates cannot produce a “recently verified” label.
5. Changing Places, ambulant access, adult change and standard accessible toilets remain distinct.
6. Occupancy or schedule data cannot produce stronger availability claims than the source supports.
7. Licence and attribution records remain attached through export and rendering.

The document's structural validator does not establish data accuracy, physical accessibility, legal compliance or successful integration. Focused adapter tests and participant evaluation remain delivery gates.

## Risks, failure and recovery

| Risk                                              | Required response                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Fetch blocked, feed unavailable or schema changed | Keep the last approved snapshot, show its date and record the failure.                            |
| Rights or licence scope unresolved                | Keep the candidate in this register; do not bulk publish or upload it into OSM.                   |
| Unsafe or inaccurate access claim reported        | Flag the affected claim, retain evidence, enable human review and show uncertainty promptly.      |
| Stale opening/occupancy information               | Expire the availability claim; fall back to unknown without removing stable facility information. |
| Two nearby facilities incorrectly merged          | Retain separate source records; require evidence before assigning a shared canonical identity.    |
| Source data disappears after refresh              | Treat as a reviewable change, not immediate proof that the facility closed.                       |

Rollback should restore the prior approved dataset version and its attribution together. Public corrections need an audit history without exposing the reporter's personal information.

## Proposed expansion, owners and gates

Owners below are role assignments to make before each stage, not claims that staff or partnerships are already appointed.

| Sequence                           | Proposed owner                                        | Deliverable and gate                                                                           |
| ---------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1. Establish release rights        | MapAble data steward, with appropriate licence review | Archive canonical NPTM release metadata, terms and checksum; resolve mirror currency.          |
| 2. Reconcile schema                | Access engineering lead                               | Versioned field mapping, boolean policy, bounded query/paging and focused tests.               |
| 3. Verify a small journey          | Paid participant co-design group and field verifier   | Dated evidence connecting arrival, approach, entrance and facility at selected sites.          |
| 4. Confirm council reuse           | Partnerships/data steward                             | Documented reusable endpoint or permitted extract for each council; no inferred partnership.   |
| 5. Introduce changing availability | Operations and engineering leads                      | Source-specific freshness thresholds, incident review and unknown-state fallback.              |
| 6. Assess expansion                | Access product owner and participant reviewers        | Evidence of usable information, correction turnaround and accessibility before wider coverage. |

Immediate next actions are to finish and verify the bounded OSM slice, then inspect the exact NPTM release and its terms. No council contact, external account changes, OSM editing or production feed connection was performed as part of this source research.
