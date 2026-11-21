# MapAble Open Access Commons: OSM and community accessibility infrastructure

Date: 9 November 2026 (Sydney)
Status: Architectural design plus non-executing prototype. No production release, source import, database migration, external network call or automatic mapping edit.

## Decision and unique selling position

MapAble will not replicate every OpenStreetMap repository. It will selectively integrate compatible open-source services and data, reusing the existing MapAble Access/GAIS/Go/Care/Day stack. The proposition to test is:

**Open maps show where the world is. MapAble helps you judge whether your whole day can work, and what to do when access, care or transport breaks down.**

The strategic advantage is a disability-led **Accessibility Intelligence Commons** connecting observable place and route features, participant-chosen requirements, AAC, worker suitability, transport evidence, appointments and human-supported continuity. This is a proposed differentiation, not a claim of unique market status or verified live national coverage.

## Current repository baseline

Inspected ausdisau/mapableau-new main @ 58fffa6:
- AccessPlace and map services: lib/access/map/
- Access observations and provenance: lib/access/infrastructure/
- GAIS typed geographic read/query: lib/gais/
- Access Signals RAGU and Unknown: lib/access-signals/ragu.ts
- Existing MapLibre renderer and geographic configuration: components/map/ and lib/map/
- OSM config and Nominatim adapter: lib/config/openstreetmap.ts and lib/integrations/adapters/openstreetmap-adapter.ts
- MapAble Go / Navigate limited and synthetic journey handling: lib/go/ and lib/access/navigate/
- Participant My Day and consent systems: app/dashboard/ and lib/dashboard/
- Canonical, separate draft DayEval engine: ausdisau/MapAble PR #32.

Existing architecture already describes duplicated mapping and place sources. Do not create another place table, another source of identity, another consent service, a competing Day engine, or a second MapLibre implementation.

## Open-source integration map

| Capability | Community source | How MapAble uses it | Readiness and restrictions |
| --- | --- | --- | --- |
| Community geodata | OpenStreetMap objects, tagging and regional extracts | Geographic anchors and versioned candidate features | ODbL; edit/source dates are not assessment dates |
| Geographic ingest | osmium, osm2pgsql, PostGIS and regional PBF/diffs | Bounded-region provenance pipeline | Proposed; independent software licences and AU hosting review |
| Web maps | MapLibre GL JS | Reuse existing MapAble component library | Existing integration; MapLibre code BSD-3-Clause |
| Native mobile maps | MapLibre Native | MapAble Android and iOS map-list parity | Proposed end-to-end mobile acceptance; code BSD-2-Clause |
| Storage/caching | PMTiles / Protomaps | Optional versioned, self-hosted vector tiles | Proposed; distinguish tile data licence from PMTiles BSD software |
| Geocoding/search | Nominatim | Keep existing adapter behind rate limits and cache | Public service max 1 request/sec; production requires scoped operation |
| Pedestrian network | OpenSidewalks schema and AccessMap methodology | Sidewalk, crossing, kerb and entrance topology | Schema draft and incomplete geography; do not claim safe routes |
| Walking routes | Valhalla | Experiment with per-need preferences and alternate costs | MIT code; output advisory, not fit certification |
| Transit/returns | OpenTripPlanner and GTFS/GTFS-RT | Journey legs and return-trip dependency visibility | OTP LGPL; GTFS feed licensing and accessibility claims require validation |
| Community surveying | StreetComplete and MapComplete | Quests, skip/unknown, moderator training and optional deep links | GPLv3: do not blindly paste software into proprietary frontend |
| Quality assurance | Osmose, OSMCha | Source-change scrutiny, conflict review and data-quality queue | Needs community rules and evidence; not an automatic accuracy guarantee |
| Place access data | Wheelmap, A11yJSON, Accessibility Cloud | Schema mapping and licensed federated evidence | Contact source owners; token, licence, terms and source-specific rights |
| Local imagery | Panoramax | Optional reference photography and human review | Per-image rights, faces/privacy and consent gate |
| Public contribution | OSM edit API and organised mapping guidance | Separate opt-in, attributable human-reviewed changesets | NO automatic upload; no participant-private data |

Official reference sources:
https://www.openstreetmap.org/copyright
https://operations.osmfoundation.org/policies/tiles/
https://operations.osmfoundation.org/policies/nominatim/
https://osmfoundation.org/wiki/Organised_Editing_Guidelines
https://github.com/maplibre/maplibre-gl-js
https://github.com/maplibre/maplibre-native
https://github.com/protomaps/PMTiles
https://github.com/OpenSidewalks/OpenSidewalks-Schema
https://github.com/AccessMap/accessmap
https://github.com/valhalla/valhalla
https://github.com/opentripplanner/OpenTripPlanner
https://gtfs.org/documentation/schedule/reference/
https://github.com/streetcomplete/StreetComplete
https://source.mapcomplete.org/MapComplete/MapComplete
https://github.com/osm-fr/osmose-backend
https://github.com/OSMCha
https://github.com/sozialhelden/accessibility-cloud
https://sozialhelden.github.io/a11yjson/
https://gitlab.com/panoramax

## Code delivered in this increment

- lib/access/open-commons/osm-access-candidate.ts
  - Validates OSM node/way/relation identifiers.
  - Carries OSM element version, ODbL, attribution, canonical source URL and source edit time.
  - Copies only an explicit list of accessibility-related tags; unrelated source personal notes, phone fields and diagnosis tags are not included.
  - Marks every tag unverified_external_tag, observation date null, verification not_assessed, route safety not_assessed, and participant-specific fit not_assessed.
  - Drafts optional context-aware crossing, footpath and entrance measurement questions for a future Signal workflow. It never writes or sends data.
- lib/access/open-commons/flags.ts
  - Preview requires an exact true flag and is hard-disabled for production.
- tests/access/open-commons-osm-intake.test.ts
  - Synthetic tests for provenance, uncertainty, invalid objects, sensitive fields, survey questions and default-off behavior.

There is **no runtime call site** yet. This is a domain contract only, not a running OSM importer or MapAble Signal integration.

## Evidence and consent separation

Separate:
1. OPEN geographic object: data owner and licence, source object ID/version, map edit time, supported tags.
2. MAPABLE moderated observation: measurement method, observedAt, evidence, assessed scope, confidence, dispute, expiry, review authority.
3. PRIVATE participant context: mobility and communication preferences, chosen destination, home location, support times, care notes, consent, delegates and incident data.

Do not let an OSM tag such as wheelchair=yes become a Green access guarantee. Do not infer a real observation date from the OSM edit timestamp. Do not treat unknown as inaccessible. Do not publish sensitive user data in public OSM changesets, map queries or telemetry. Any contributor-initiated public upload requires its own consent, evidence/rights checks, attribution, moderation and community compliance. Standard operations should use approved regional extracts/self-hosted or contracted infrastructure, not bulk requests to donated public tile/Nominatim/Overpass servers.

## Three connected user journeys

**Signal:** An entrance lacks a door width measurement. A participant may optionally undertake a structured survey or choose Unknown/Skip. A moderator checks the evidence; MapAble keeps the result scoped and dated. Public OSM contribution remains separately authorised.

**Go:** A destination has a kerb profile but no reliable ramp/return journey evidence. MapAble can show why the route is unresolved and provide alternatives, not promise suitability.

**Day:** A worker cancels before a transport pickup and appointment. MapAble Day shows source-confirmed facts, the evidence gap, AAC preferences, recovery options and explicit human approval. No silent worker/vehicle substitutions or unnecessary sharing.

## First 90 days

- **0-30 days:** Validate the typed candidate adapter, fit it behind existing GAIS/Access contracts, audit ODbL/OSM attribution and licences, resolve Vercel and current CI blockers separately, and co-design survey language with disabled contributors. Owner: Access and privacy engineering. Tests: zero unauthorised uploads, zero false confirmed labels, full source lineage.
- **30-60 days:** Stage one bounded Sydney-area OSM extract under approved terms, add accessible map/list parity, provenance and stale/disputed labels, build moderated Signal questions with contributor opt-in and accessible review. Owner: GAIS/data stewardship. Tests: data lineage, review completeness, keyboard, screen reader, switch, AAC and 400% zoom.
- **60-90 days:** Integrate selected path/kerb and transport evidence into one supervised Go -> Day journey, with return-trip dependencies and human continuity recovery. Owner: Care/Transport/Go/Day and disabled co-design reviewers. Tests: human-governed alternative selection, support cancellation drill, no unsupported route guarantees or private disclosure.

After 90 days: candidate open interoperability with A11yJSON/Accessibility Cloud under permission, independent real-user accessibility evaluation, and only separately approved actual service orchestration.

## Release decision

GO: read-only source provenance, licence review, moderated synthetic testing, accessibility co-design.
NO-GO: direct production use of public OSM endpoints at scale, unreviewed API imports, indiscriminate copying of GPL source, auto-editing OSM, cross-tenant/private participant leakage, unverified accessibility guarantees, live worker/transport assignment and merging this draft without checks.

Current Vercel production association remains protected. Previous main build and security failures are independent of this addition.
