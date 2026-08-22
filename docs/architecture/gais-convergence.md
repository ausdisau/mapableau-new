# GAIS convergence architecture

**Geographic Accessibility Information Service (GAIS)** — Phase 0 read/query layer over existing MapAble access systems.

GAIS represents **environmental facts + evidence + time + optional requirements**. It never assigns universal `accessible = true/false`.

## Ownership model

| System | Owns | GAIS role |
|--------|------|-----------|
| **Access** | `AccessPlace`, place features, community reviews, public map UX | Source of published place anchors and feature tags |
| **Access Intelligence Next** | Evidence envelopes, temporal semantics, AQL, change detection | Source of durable evidence records when persistence flag enabled |
| **Navigate** | Sandbox path graph, segment geometry, route scoring | Not queried by GAIS Phase 0 (no fabricated path geometry) |
| **Go** | Participant journey UX, `AccessTemporaryBarrier`, route plans, location sessions | Temporary barrier events only; sessions never exposed |
| **GAIS** | Stable typed contracts, read adapter, GeoJSON projection, public read API | Cross-system geographic accessibility read surface |

## 1. Existing capability

- Published `AccessPlace` + `AccessPlaceLocation` (Point geometry)
- `AccessPlaceFeature` tags (step-free entry, lift, toilet, etc.)
- `AccessEvidenceEnvelopeRecord` (Intelligence Next persistence)
- `AccessObservationRecord` (Infrastructure pipeline)
- `AccessTemporaryBarrier` (Go dynamic barriers, community-reported)
- Existing maps: Leaflet (`/accessibility-map`), MapLibre (`/access`, Go context map)
- Provenance vocabulary: `AccessSourceClass`, `AccessProvenanceStatus`, `AccessEvidenceClass`

## 2. Location in code

| Capability | Path |
|------------|------|
| Place service | `lib/access/map/access-place-service.ts` |
| Evidence envelopes | `lib/access/intelligence-next/evidence/` |
| Provenance | `lib/access/infrastructure/provenance.ts` |
| Barriers | `lib/go/barrier-service.ts` |
| Navigate graph | `lib/access/navigate/fixture/sandbox-graph.ts` (sandbox only) |
| Accessibility map UI | `components/accessibility-map/` |
| Access map UI | `components/access/AccessMapLayer.tsx` |

## 3. Reuse strategy

- **Read-only adapter** over Prisma — no migration, no data move
- Map `AccessProvenanceStatus` / `AccessSourceClass` → `GaisEvidenceState`
- Project places as `GaisFeature` (PLACE) + derived feature types from `AccessPlaceFeature`
- Project active barriers as `TEMPORARY_BARRIER` with expiry
- Attach envelope/observation evidence without overwriting unknowns
- GeoJSON output reuses RFC 7946 shapes; properties carry GAIS metadata

## 4. Gap (Phase 0)

- No unified geographic query API before GAIS
- No GeoJSON feature collection for cross-map consumption
- Path/entrance LineString geometry not stored for most places
- Graph nodes not persisted in DB
- Four overlapping verification vocabularies need explicit GAIS mapping

## 5. GAIS addition (this slice)

- `lib/gais/contracts/` — canonical types
- `lib/gais/service/` — read adapter
- `lib/gais/geojson/` — deterministic GeoJSON conversion
- `GET /api/gais/features`, `/places/[id]`, `/events` — flag-gated public read
- Optional **accessibility information layer** on existing Leaflet + MapLibre maps
- List view parity for map layer data

## 6. Deferred

- PostGIS / vector tiles / PMTiles
- National pedestrian network ingestion
- Navigate graph segments in GAIS bounds queries
- Natural-language geographic query
- Accessibility scoring / certification
- AI-generated evidence
- Digital twin / LiDAR / sensor streams

## Claim control

Responses include `meta.claimState`, `meta.evidenceScope`, `meta.liveNationalRouting: false`. Never claim national live path data or certified accessible routes unless source data proves it.
