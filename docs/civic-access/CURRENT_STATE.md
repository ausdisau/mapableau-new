# Civic Access — Current State (Wave 0 Reconciliation)

**Inspected:** 2026-07-16  
**Basis:** `main` @ `eb52b9f0` plus Wave 1 Civic foundation

## On main today (reuse)

| Domain | Location | Civic decision |
| --- | --- | --- |
| User / Organisation | `User`, `Organisation`, `OrganisationMember` | Reuse tenancy |
| Preferences | `AccessibilityProfile`, `AccessibilityPreferenceProfile` | Reuse; not passport |
| Places | `AccessPlace` + features/sources/floor plans | **Canonical place**; CivicAsset.`accessPlaceId` / `access_place:{id}` |
| Indoor | `lib/indoor-accessibility/*`, `AccessFloorPlan` | Living Access Twin projection until named twin lands |
| Visit plans | `VisitPlan` | Privacy-gated; Civic Wave 1 does not read them |
| Indoor incidents | `IndoorAccessibilityIncident` | Compose later; no second incident DB |
| Transport | `TransportTrip*`, pickup/dropoff | Reuse; **not GTFS** |
| Accreditation | `AccessAccreditation*` | Assessor/venue verification |
| Audit | `AuditEvent` | Consequential Civic actions |
| Open data scaffold | `OpenDataExport` | Later Civic open-data products |
| Worker reliability | `lib/reliability` | **Do not reuse** for asset reliability |
| Civic audit index | `CivicAuditIndexEntry` | Institutional scorecard — separate from Civic registry |

## Unmerged remotes (compose, do not fork)

| PR / branch | Content | Civic stance |
| --- | --- | --- |
| #282 AccessibilityOps asset registry | Digital/product test assets + shadow rules | **Shared external-ref vocabulary**; Civic owns public-infrastructure projection; AccessibilityOps owns digital test assets |
| #273 Access Intelligence expansion | Fit, confidence, cost, coverage engines | Compose when merged; do not reimplement |
| #267–#277 AURA / Journey World / Guardian | Mission projection, GTFS fixtures, Guardian | Compose when merged; AURA may propose only |
| #280 RightsOS | Purpose registry / firewall | Bind disclosure authority later |
| #281 Personal Access Vault registry | Participant-controlled disclosure | Bind later |
| CareOS mission SoR branches | `CareOSMission` | Bind when present; no parallel mission SoR |

## Registry boundary (AccessibilityOps ↔ Civic)

| Concern | Owner |
| --- | --- |
| Public places | `AccessPlace` |
| Digital product accessibility testing | AccessibilityOps `AccessibilityAsset` |
| Public-infrastructure accessibility projection | Civic `CivicAsset` |
| Shared refs | `access_place:{id}`, `access_floor_plan:{id}`, `accessibility_ops_asset:{id}` |
| Forbidden | Second editable AccessPlace database |

## Gaps filled by Wave 1

- `CivicAsset` (+ version, external reference)
- `CivicSource` (+ version, licence)
- Static accessibility projection
- Flag-gated internal admin + APIs
- Harbour synthetic precinct seed
- Docs under `docs/civic-access/`

## Explicitly not migrated in Wave 1

Incidents, Observatory, simulation, GTFS ingest, regional hubs, emergency continuity, participant journeys, CareOSMission, LivingAccessTwin named model.
