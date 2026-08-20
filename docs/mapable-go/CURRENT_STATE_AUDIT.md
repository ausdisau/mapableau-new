# MapAble Go — Current State Audit

**Inspected:** main @ `88a59d50926fe59f8873d24e8be2acb0e2bf3fd1`  
**Claim state:** IN_DEVELOPMENT

## Existing capabilities

| Area | Canonical owner | Classification |
| ---- | --------------- | -------------- |
| Place identity | `lib/access/map/` → `AccessPlace` | REUSE |
| Access Graph observations | `lib/access/infrastructure/` | EXTEND |
| Access Passport | `AccessPassport` + requirements | EXTEND |
| Provenance | `lib/access/infrastructure/provenance.ts` | REUSE |
| Indoor routing (Dijkstra) | `lib/access/indoor/routing/route-planner.ts` | REUSE (not outdoor Navigate) |
| Outdoor Navigate API | Epic 03 — **missing** | NEW |
| Transport trips | `lib/transport/` → `TransportTrip` | REUSE (slice 2) |
| Public transit adapters | `lib/transport/public-transit/` (mock, flag off) | DEFER |
| TfNSW proxies | `lib/tfnsw/`, `app/api/transport/tp/` | DEFER |
| Auth / consent / audit | `lib/auth/`, `lib/consent/`, `lib/audit/` | REUSE |
| MCP | `mcp/av/`, `mcp/careos/` (stdio, dev) | DEFER Go MCP |
| MapLibre | `components/access/`, `lib/map/` | REUSE |
| Leaflet marketing map | `app/accessibility-map/` | DEPRECATE_LATER (do not extend) |
| Legacy places | `AccessiblePlace`, `/api/v1/access` | DEPRECATE_LATER |
| Demo journey form | `components/journey/JourneyPlannerForm.tsx` | DEPRECATE_LATER |
| Transport RoutePlan | `RoutePlan` (booking optimiser) | Do not reuse name |

## Duplicated / legacy areas

1. **Three place sources:** `AccessPlace`, `AccessiblePlace`, demo/ADL KML
2. **Three access graphs:** infrastructure observations, intelligence-next Harbour fixture, CareOS evidence graph
3. **Two map libraries:** Leaflet vs MapLibre
4. **Multiple provenance vocabularies:** `AccessProvenanceStatus`, `AccessSourceClass`, `AccessEvidenceClass`
5. **Four “journey” meanings:** geo preflight, indoor door-to-room, support-care session, CareOS mission

## Relevant schemas (Prisma)

- `AccessPlace`, `AccessPlaceLocation`, `AccessPlaceFeature`
- `AccessPassport`, `AccessRequirementRecord`
- `AccessObservationRecord`, `AccessCapabilityRecord`
- `AccessJourneyRecord`, `AccessJourneySegmentRecord`
- `IndoorAccessibilityIncident`, `AccessPlaceReport`
- `ConsentRecord`, `AuditEvent`
- **New (slice 1):** `AccessMobilityRoutingPreference`, `AccessPathNode`, `AccessPathSegment`, `AccessTemporaryBarrier`, `GoLocationSession`, `GoRoutePlan`

## API routes (existing + new)

| Route | Status |
| ----- | ------ |
| `GET /api/access/places` | REUSE |
| `POST /api/access/navigate/route` | NEW |
| `POST /api/go/routes/plan` | NEW |
| `GET /api/go/routes/:id` | NEW |
| `POST /api/go/routes/:id/reroute` | NEW |
| `GET /api/go/routes/:id/evidence` | NEW |
| `GET/POST /api/go/barriers` | NEW |
| `GET/PATCH /api/go/profile` | NEW |
| `POST/DELETE /api/go/location/session` | NEW |

## Feature flags

All default **OFF** in `.env.example`:

- `MAPABLE_GO_ENABLED`
- `MAPABLE_NAVIGATE_ENABLED`
- `MAPABLE_GO_ROUTE_PLANNING_ENABLED`
- `MAPABLE_GO_DYNAMIC_BARRIERS_ENABLED`
- `MAPABLE_GO_PUBLIC_TRANSPORT_ENABLED` (deferred)
- `MAPABLE_GO_ASSISTIVE_INPUT_ENABLED` (deferred)
- `MAPABLE_GO_MCP_ENABLED` (deferred)
- `MAPABLE_GO_TELEMETRY_ENABLED` (deferred)

## Tests

- Unit: `tests/go/`, `tests/access/navigate/`
- Integration: route planning, flags, consent
- Security: `scripts/ci/check-mapable-go-security.ts`
- A11y: `tests/a11y/mapable-go.spec.ts`

## Deployment dependencies

- Next.js on Vercel, Neon Postgres via Prisma
- No local assistive bridge on Vercel (slice 3)
- Pilot graph is labelled sandbox fixture — not live national coverage

## Overlap risks

- Do not treat indoor Dijkstra as Epic 03 Navigate
- Do not grow `AccessiblePlace` or CareOS evidence graph
- Do not duplicate transport GTFS/TfNSW stacks

## Safe extension points

- `lib/access/navigate/` — outdoor suitability engine (Access-owned)
- `lib/go/` — participant orchestration
- `app/go/` + `components/go/` — UX
- Extend `AccessPassport` for mobility preferences (no diagnosis)
