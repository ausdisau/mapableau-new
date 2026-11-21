# MapAble Live Access Fabric — dynamic accessibility evidence system

**Status:** PROPOSED design for review (1 November 2026). No import jobs, production route graph, new database tables, external service deployments, location tracking, or feature-flag changes are implemented by this document.

**Dependencies:** municipal-source PR #645 and international-source PR #646. This design branch is based on PR #646's head; merge and rebase order require review.

## Current implementation evidence

- `lib/access/data-sources/registry.ts` already has a source admission and reuse-licensing gate and typed provenance metadata. PRs #645/#646 add unadmitted leads, not live feeds.
- `lib/access/infrastructure/observation-service.ts` has observation storage, evidence status and audit events; `lib/access/infrastructure/freshness.ts` and `lib/access/intelligence-next/evidence/freshness-policy.ts` already separate physical observation age from source retrieval.
- `lib/access/navigate/route-planner.ts` is a Dijkstra solver over a sandbox fixture; `lib/go/route-service.ts` selects `getSandboxGraph()` and reports `isLiveEvidence: false`.
- PostGIS/pgRouting availability in the actual Neon environment has not been verified. Existing `vercel.json` has no approved geospatial refresh worker. Existing CI/security/accessibility and account deployment blockers remain.

## Architecture and data ownership

1. **Source registry and legal gate.** Resolve an exact dataset/resource, licence, authorised use, owner, schema, geographic extent and source revision; never infer permissions from a map viewer or national portal.
2. **Adapter capability discovery.** OSM replication diffs with ordered sequence; ArcGIS layer metadata and `extractChanges` only if supported; OGC API Features; Opendatasoft, CKAN/HDX resource version polling; approved GTFS-RT and Singapore LTA feeds when relevant. Each has its own cursor, rate limits, expiry and credentials.
3. **Isolated durable refresh worker.** Queue source-specific bounded fetch jobs; enforce allowlisted hosts, SSRF protection, download caps, retries, conditional headers, duplicate-work leases and circuit breakers. It cannot read participant profiles or publish routes.
4. **Immutable raw snapshots and append-only revisions.** Store checksums, source record IDs, source-published time, physical-observed time, retrieval time, original CRS, licence, attribution and history separately. Replays must be idempotent; missing pages or sequence gaps block deletion.
5. **Evidence normalisation and review.** Map typed claims to `physical_path`, `temporary_barrier`, `destination_access`, `transit_facility`, `aggregate_travel_time`, `building_footprint` or `catalogue_lead`. Aggregate vehicle travel time and building footprints never certify wheelchair paths. Preserve source disagreements and stale/unknown states.
6. **Optional GIS field loop.** OpenStreetMap provides base context; MapSwipe volunteers identify unmapped/changed features; HOT Tasking Manager and Field-TM/ODK can coordinate optional field tasks; GISCorps may provide volunteer expertise only if agreed; QGIS supports reproducible CRS/topology QA. Imagery labelling cannot measure real curb heights, clear widths, gradients, crossfall or lift operation.
7. **Versioned projections and graph release.** AccessPlace and approved research projections update independently. A human reviewer must approve every route-impacting graph release with field evidence, fit constraints, provenance and rollback. GeoServer (OGC) or GeoNode (collaborative data catalogue) are optional partner-publication tools, not the primary MapAble evidence system.
8. **Participant-controlled replan.** After approved route impact changes, the participant can review an alternate, retain the current route or stop. No silent navigation change; GPS can stay on device, and optional location sharing must be separately consented.

### Update and contribution states

External source: `DISCOVERED → LICENCE_REVIEW → ADMITTED → FETCHED → VALIDATED → STAGED → HUMAN_REVIEW → PUBLISHED_EVIDENCE_VERSION`. Error branches: `PAUSED`, `QUARANTINED`, `STALE`, `DISPUTED`, `REPLAY_REQUIRED`, `REVOKED`.

Mapping contribution: `ASSIGNED → SUBMITTED → ATTRIBUTED → PRIVACY_REVIEW → CANDIDATE → FIELD_CHECK → EVIDENCE_REVIEW`. A verified field measurement may support evidence; it never automatically deploys a routing change.

### Example: lift closure during a selected journey

An authorised lift-operator feed or participant report submits a dated closure. The system retains its source and validates the change. If community reported, it is labelled accordingly; a high-impact change is queued for urgent human review without claiming confirmed closure. A published, evidence-backed route change produces an accessible notice and alternate-route option. The participant decides whether to switch; low-confidence or disconnected alternate segments are not fabricated. Source outages retain the last-known-good graph with clear stale warnings.

## Pilot engineering decisions

- First pilot: **one bounded Sydney corridor**, verified data-source licence and limited synthetic/test data. Prefer reuse of MapAble's Next.js, MapLibre, Neon and existing Access Graph. Add PostGIS only after database capability and migration approval.
- Refresh policy, batch assessment, source version comparison and volunteer-contribution triage can be implemented as deterministic pure functions before any network worker. No source becomes admitted through a refresh-configuration flag alone.
- Research leads from PNG, China, India, Singapore, HeiGIT, the Malaria Atlas Project and Open Buildings remain separate from physical navigation until precise semantics, licences and jurisdictional rules are verified.
- The source-publishing side must be independent of route-user location and health data. OSM derivatives/third-party data require a specific ODbL and redistribution compatibility review.
- The first live operational release needs an accountable data steward, licensed child dataset, replayable durable cursor, immutable storage, accessible human moderation, independent segment audit and rollback.

## Evidence, privacy, accessibility and failure controls

- **Consent:** participant report visibility, photos, location/trip sharing, research reuse and delegate access must be purpose-bound and revocable. Avoid bystander photos and home-location tracking.
- **Accessibility:** WCAG 2.2 AA web baseline plus keyboard, screen reader, switch, AAC, touch, high zoom, reduced-motion and list-first alternatives. Map-only interaction is insufficient.
- **Failure:** invalid CRS/schema/licence, partial snapshot deletions, replication gaps, unexpected mass deletion, revoked reuse rights or conflicting evidence → hold/quarantine. No automatic expiry reset simply because a record was fetched again.
- **Operations:** audit source changes, actor approvals, published graph version and rollbacks. Incident and dispute handling needs accountable human ownership.
- **Prohibited claims:** no guaranteed wheelchair-safe route, no accessibility certification, no production-live dataset import claim.

## Test plan and release gates

1. Registry admission and default-off manifest; unapproved use and participant-controlled data rejected.
2. Deterministic timestamp, retry, lease, outage and source cursor tests.
3. Immutable idempotent replay, record checksum, duplicate, partial pagination and conflict retention.
4. Volunteer contribution triage: licences, PII consent, remote imagery not field measurement, AI not self-verifying.
5. Graph impact simulation and explicitly confirmed participant reroute; offline fallback.
6. Accessibility, security, privacy, legal/licensing and release-owner review before enabling any external source.

**Prototype evidence:** A separate ZIP package prepared for review contains refresh policy, source manifest, pure reconciliation logic, volunteer triage, three Vitest test files and full design documents. Local strict TypeScript checks with a small registry stub and 44 Node synthetic tests passed. This **does not** establish that full-repository Vitest, CI, accessibility, security or native builds pass. The source package is not committed by this design-only PR.

**Required repo checks after integration:** `pnpm exec vitest run tests/access-infrastructure/`, `pnpm type-check`, `pnpm lint:lib`, `pnpm lint:tests` and formatting/CI pipelines.

## Delivery sequence and stop conditions

**Gate 0:** approve exact datasets, terms, refresh semantics and named data steward; resolve PR #645/#646 review order and existing security/CI failures.

**Gate 1:** implement a synthetic dry-run scheduler and reconciliation storage on a separate PR; demonstrate fail-closed replay and quarantine.

**Gate 2:** field measurement and conflict moderation for a small bounded corridor, with published evidence versions only after human approval.

**Gate 3:** independent disability-led navigation/communication testing, emergency fallback and reversible graph promotion; only then a controlled pilot with explicitly approved flags.

**Stop immediately** if an API, licence, geospatial transformation, human review, security, consent or route-connectivity assumption fails. Do not merge, deploy or change live mapping without separate approval.

## Primary official sources

- OSM replication https://wiki.openstreetmap.org/wiki/Planet.osm/diffs
- MapSwipe https://heigit.org/mapswipe/
- HOT Tasking Manager https://hotosm.github.io/tasking-manager/
- HOT Field-TM https://www.hotosm.org/en/tools-resources/tech-product-suite/field-tasking-manager/
- GISCorps https://www.giscorps.org/what-we-do/
- QGIS batch processing https://github.com/qgis/QGIS-Documentation/blob/master/docs/user_manual/processing/batch.rst
- GeoNode https://geonode.org/
- GeoServer https://docs.geoserver.org/main/en/user/introduction/overview/
- ArcGIS changes https://developers.arcgis.com/rest/services-reference/enterprise/extract-changes-feature-service/
- OGC API - Features https://www.ogc.org/standards/ogcapi-features/
