# Community infrastructure: NHVR routing evidence and integration boundaries

**Reviewed:** 28 November 2026, Australia/Sydney.

**Status:** Source research completed; NHVR data integration proposed. No NHVR API connection, network import, route calculation or permit assessment is delivered by this document.

## Decision and participant impact

Treat the supplied [NHVR Go Route Planner link](https://www.service.nhvr.gov.au/#page=informationHub/routePlannerTool) as a potential **vehicle-network reference for MapAble Transport**. Keep it separate from the community parking, toilet and public-space layer and from any pedestrian or wheelchair route assessment.

NHVR describes its planner as a tool for heavy-vehicle networks and access permits. Its newer National Network Map combines jurisdictional heavy-vehicle networks and can display rest areas, height restrictions and road disruptions [S1, S2]. A participant needs additional evidence about getting out of the vehicle and reaching the chosen facility. Road-network permission does not answer those questions. This separation is an architectural inference from the documented purpose of the sources.

The most useful immediate reuse is a clearly labelled reference link or an operator-supplied shared map view. A later licensed, bounded vehicle-restriction overlay may be useful after source rights, vehicle applicability and data currency are established. Do not turn an NHVR network colour into a MapAble accessibility rating.

## Current implementation and research evidence

The current community-infrastructure slice reads a checked-in OSM snapshot and publishes GAIS-compatible GeoJSON display points. Its `routeEndpoint: false` and `liveNationalRouting: false` fields remain authoritative for that slice. The inspected GAIS architecture assigns route graphs to Navigate and participant journeys to Go; this document does not change those boundaries [R1–R3].

| Item                  | Evidence state                                      | Inspected evidence                                                                                            | Consequence                                                                                   |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Supplied NHVR page    | Runtime not independently verified                  | Public extraction returned the NHVR Go page with no readable application content                              | No claim that the interactive route planner was operated or tested                            |
| Heavy-vehicle purpose | Verified in official documentation                  | Route Planner and National Network Map descriptions [S1, S2]                                                  | Vehicle-network context only                                                                  |
| Network downloads     | Documented capability; download not exercised       | Official help describes selecting a network and downloading a GeoPackage [S3]                                 | Open file format is useful; dataset reuse rights still need confirmation                      |
| Network listing API   | Documented capability; authentication not exercised | `GET https://api-public.nhvr.gov.au/network/networks`, API-user prerequisite and subscription-key header [S4] | An integration path exists; it is not an anonymous public endpoint established by this review |
| API account setup     | Verified in official documentation                  | Account administrator nominates an API user and subscribes to the package/terms [S5]                          | Use least privilege if a later task connects it                                               |
| Map and route sharing | Documented capability; no route generated           | Map-view sharing and KML/GPX route-download guides [S6, S7]                                                   | Reference views or user-supplied exports can support review without inventing an API contract |
| Data licence          | Unresolved at dataset level                         | General website copyright is restrictive; exact network-dataset terms were not obtained [S8]                  | No automatic public redistribution or relicensing of NHVR network data                        |

The developer portal homepage describes spatial work using 2022 roadmap language [S9]. The endpoint-specific Network find documentation [S4] provides stronger evidence of a documented API than that older overview. Neither establishes that credentials, quotas or a production entitlement are available to MapAble.

The retrieved National Network Map documentation describes vehicle and jurisdiction coverage; its phase-one route-planning guide specifies a limited release for Class 2 vehicles excluding PBS [S2, S10]. The broader NHVR Go planner and this newer route-planning function are distinct surfaces. Validate the exact surface and supported vehicle configuration before any integration. Do not read a recently crawled page as proof that every statement describes a new release.

## What NHVR can contribute

| Candidate information                       | Proposed MapAble use                                                           | Boundary                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Heavy-vehicle network geometry and identity | Optional operator reference overlay in Transport                               | Preserve jurisdiction, network ID, publication status, vehicle class and applicable conditions          |
| Conditional or restricted road segments     | Explain a vehicle-network limitation and link to its official source           | Do not infer legal permission from a missing restriction, map colour alone or another vehicle's network |
| Height restrictions and disruptions         | A secondary vehicle-planning evidence source where rights and freshness permit | Layer presence does not establish complete clearance data or current conditions at every structure      |
| Rest areas                                  | Candidate location discovery for future cross-source matching                  | A rest-area label does not establish an accessible toilet, parking transfer aisle or step-free path     |
| Shared map view or supplied route export    | Human review of an operator's intended vehicle route                           | Preserve vehicle/network context; do not call the route a wheelchair journey                            |

NHVR's definition of a heavy vehicle refers to GVM or ATM above 4.5 tonnes; passenger buses are among its examples [S11]. Classify each proposed MapAble vehicle using its actual registered/manufacturer configuration. Wheelchair conversion by itself is not evidence that a van belongs on a heavy-vehicle network. Applicable dimensions, loading, notices and approvals require operator review; this document does not determine legal eligibility.

The National Network Map guide distinguishes approved, conditional and restricted network segments and explains that uncoloured segments can require a permit; it also describes area-based permissions that complicate simple colour interpretation [S10]. Keep the source's conditions and route context intact. Do not reproduce a simplistic red/amber/green decision as participant suitability.

## Architecture and data model

Keep three independently evidenced layers:

1. **Vehicle movement:** vehicle dimensions/configuration, network restrictions, conditions and source references. Owned by Transport with the existing routing service.
2. **Arrival and transfer:** actual bay or pickup location, permitted stopping, side/rear ramp deployment envelope, transfer aisle, surface/cross-slope and connection to the footpath. Owned by Access/GAIS evidence with Transport handoff.
3. **Pedestrian or wheelchair movement:** connected footpaths, crossings, kerbs, entrances and internal paths, assessed against the participant's chosen requirements. Owned by Navigate and Access evidence, with Go coordinating the journey.

The second and third layers require their own observations. Relevant OSM source keys include `surface`, `smoothness`, `width`, `width:effective`, `incline`, `kerb`, `kerb:height`, `tactile_paving`, `entrance`, `door` and `access`; absent tags remain unknown [S12–S15]. An OSM facility point or bounding-box centre is not a verified arrival node. NHVR geometry does not supply missing pedestrian topology.

For a future NHVR adapter, extend the existing source contract with a clearly separate `vehicle_network` domain. Proposed fields are network ID, jurisdiction, source publication status, vehicle configuration, restriction/condition text, legal-source link, effective dates, source update date, retrieval time, licence identifier, geometry CRS and assessed scope. Vehicle eligibility and participant suitability remain `not_assessed` until their own checks are complete. No universal access score is required.

Inspect GeoPackage CRS metadata before converting to GeoJSON WGS84. The Network find example contains extents explicitly labelled SRID 3857; those metre coordinates cannot be copied into longitude/latitude fields [S4]. Do not assume an identifier named `networkWkid` is a usable EPSG code without verifying the full schema and file metadata.

The documented API example also includes Draft/retired records and administrative fields. A future adapter must positively select current publishable networks and allowlist public fields, excluding account/user identifiers and internal metadata. A sample response is not evidence that its example network is currently applicable [S4].

## Licensing, privacy and security

OSM's licence covers OSM data; the presence of an OSM basemap does not establish the licence of NHVR network overlays. NHVR's general copyright notice requires permission for commercial reuse of its website materials except applicable statutory exceptions [S8]. The GeoPackage help establishes a download mechanism, not a dataset-specific redistribution grant [S3]. Obtain the exact network licence/terms, attribution wording, caching permission and public-API/export rights before incorporating that layer into MapAble's downloadable GeoJSON.

If a later API connection is authorised, keep subscription keys server-side, use a dedicated least-privilege API user, allowlist documented hosts and bound downloads. Never expose keys in a browser map URL or bundled snapshot. Access to authenticated API data does not automatically authorise republication. No credentials were requested or used, and no messages were sent to NHVR for this research.

Keep participant home addresses, disability profiles, care notes and journey histories outside the public layer. Opening an external shared view may reveal its selected location: give the participant control, explain what is shared and retain a manual alternative. Existing Core consent and audit services remain the authority.

## Accessibility and failure recovery

Any later restriction overlay must have an equivalent text list with network name, vehicle scope, source date, condition and uncertainty. Do not rely on colour, dragging or voice input. Test keyboard, screen-reader and switch access against WCAG 2.2 AA expectations, with participant review of the complete arrival journey.

If NHVR data is unavailable, stale, inconsistent or outside the selected vehicle/network scope, report that uncertainty and retain a clearly dated reference where permitted. Do not erase restrictions, infer unrestricted access or fall back to a generic vehicle route while presenting it as verified. Give the operator a source link and a human-review path. Rollback consists of disabling the optional NHVR overlay; the existing OSM facility/list service remains usable.

## Test plan and next actions

This research adds no routing engine. The next useful integration gate is one explicitly licensed, current NSW network sample relevant to an identified fleet vehicle, inspected offline before any API activation.

1. **Transport owner:** establish whether the actual vehicle falls within the relevant NHVR surface and select the exact network; record height, width, length, mass/configuration and operational restrictions from appropriate vehicle evidence.
2. **Data steward:** obtain dataset-specific terms and inspect a legitimately obtained GeoPackage/export, including publication status, CRS, timestamps, conditions and attribution. Keep it separate from OSM-derived facility data until licensing treatment is resolved.
3. **Access/Navigate owner:** independently inspect a bounded parking-to-entrance path. Check kerbs, widths, slopes, crossings, gates, opening restrictions and transfer geometry. No missing link may become an accessible segment through proximity alone.
4. **Engineering reviewer:** test Draft/retired rejection, CRS conversion, unknown/expired restrictions, conflicting source statements, credential isolation and rollback. Confirm a heavy-vehicle approval never changes a wheelchair-compatibility field.
5. **Participant reviewers:** test whether the map/list makes vehicle approach, transfer and pedestrian access understandable and separately controllable. Record failures and unresolved access evidence before release.

These are proposed owner roles, not assigned staff or completed checks. Preserve the existing source snapshot and read API while the separate NHVR gate remains unresolved.

## Source register

All sources were reviewed on 28 November 2026, Australia/Sydney. Sources are official NHVR or OSM documentation. Public website retrieval was inconsistent: the supplied application and map returned no readable content; some NHVR main-site pages were available through official search extracts but returned HTTP 403 on direct open. The network-download help was available in the official search index but returned HTTP 404 on one direct retrieval. Those limitations do not establish a live service outage, and runtime behaviour/downloads were not tested.

- **S1 — NHVR Route Planner:** <https://www.nhvr.gov.au/road-access/route-planner>. Heavy-vehicle/permit purpose; official search extract inspected. An alternate NHVR-hosted version was also indexed at <https://wws.nhvr.gov.au/road-access/route-planner>.
- **S2 — NHVR National Network Map:** <https://www.nhvr.gov.au/road-access/route-planner/national-network-map>. Networks, layers and documented route-planning scope; official search extract inspected.
- **S3 — How to Download NHVR Network Data:** <https://support.nhvr.gov.au/en/articles/12687520-how-to-download-nhvr-network-data>. GeoPackage workflow; indexed article dated 29 October 2025; live download not exercised.
- **S4 — NHVR Portal API – Network find:** <https://support.nhvr.gov.au/en/articles/18312529-nhvr-portal-api-network-find>. Directly read: API-user prerequisite, required subscription-key header, GET endpoint and example schema.
- **S5 — Logging into the Developer Platform:** <https://support.nhvr.gov.au/en/articles/6311517-logging-into-the-developer-platform>. API-user administration and package subscription; official search extract inspected.
- **S6 — Sharing maps from the National Network Map:** <https://support.nhvr.gov.au/en/articles/18310790-sharing-maps-from-the-national-network-map>. Directly read; article identifies review date 19 February 2026.
- **S7 — Route Planner – Download route:** <https://support.nhvr.gov.au/en/articles/6102821-route-planner-download-route>. Directly read; KML/GPX export instructions.
- **S8 — NHVR Copyright:** <https://www.nhvr.gov.au/copyright>. General website notice; official search extract inspected. Exact network-dataset licence remains unresolved.
- **S9 — NHVR Developer Portal:** <https://api-portal.nhvr.gov.au/>. Directly read; contains older spatial roadmap wording and subscription guidance.
- **S10 — National Network Map Route Planner Phase 1 FAQs:** <https://www.nhvr.gov.au/road-access/route-planner/national-network-map/phase-1-faqs>. Official search extracts inspected; exact current vehicle applicability must be checked before use.
- **S11 — What is a heavy vehicle?:** <https://www.nhvr.gov.au/about-us/who-we-are/what-is-a-heavy-vehicle>. Official NHVR search extract, also indexed at <https://wws.nhvr.gov.au/about-us/who-we-are/what-is-a-heavy-vehicle>.
- **S12 — OSM kerbs:** <https://wiki.openstreetmap.org/wiki/Key:kerb>.
- **S13 — OSM entrances:** <https://wiki.openstreetmap.org/wiki/Key:entrance>.
- **S14 — OSM incline and width:** <https://wiki.openstreetmap.org/wiki/Key:incline>; <https://wiki.openstreetmap.org/wiki/Key:width>.
- **S15 — OSM surface and access:** <https://wiki.openstreetmap.org/wiki/Key:surface>; <https://wiki.openstreetmap.org/wiki/Key:access>.
- **R1 — Inspected repository:** [GAIS convergence](../architecture/gais-convergence.md).
- **R2 — Current source adapter:** [community infrastructure normaliser](../../lib/access/community-infrastructure/normalise.ts).
- **R3 — Current public read service:** [community infrastructure service](../../lib/access/community-infrastructure/service.ts).
