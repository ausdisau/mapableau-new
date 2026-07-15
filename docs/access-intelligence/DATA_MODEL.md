# Access Intelligence — Data Model

## Runtime strategy

- **MVP / demo**: TypeScript fixtures in `lib/access-intelligence/demo-data.ts` + in-memory passport/audit store.
- **Production tables**: Prisma models `AiAccess*` mapped to `ai_*` tables (migration `20260715120000_access_intelligence`).
- **PostGIS**: not required for MVP indoor graphs. Optional later for outdoor path geometry.

## Entities

| Entity | Table | Notes |
|--------|-------|-------|
| Access Passport | `ai_access_passports` | Indexed by `userId` |
| Access Requirement | `ai_access_requirements` | Indexed by `passportId`, `featureType` |
| Place | `ai_access_places` | Synthetic demo or imported venues |
| Building Element | `ai_building_elements` | Indexed by `placeId` |
| Access Feature | `ai_access_features` | Indexes: place, element, featureType, observedAt |
| Evidence | `ai_access_evidence` | Provenance + status |
| Route Node | `ai_route_nodes` | Indoor graph nodes |
| Route Edge | `ai_route_edges` | Width, steps, gradient, confidence |
| Live Incident | `ai_live_incidents` | Indexed by place + status |
| Verification Request | `ai_verification_requests` | Approval-gated writes |
| Barrier Report | `ai_barrier_reports` | Approval-gated writes |
| Visit Plan | `ai_visit_plans` | Decision + route snapshots |
| Audit Event | `ai_access_audit_events` | Action, actor, purpose, fields, recipient, outcome |

## Proposed PostgreSQL / PostGIS extension (future)

```sql
-- Optional outdoor geometry
ALTER TABLE ai_route_nodes ADD COLUMN geom geometry(Point, 4326);
ALTER TABLE ai_route_edges ADD COLUMN geom geometry(LineString, 4326);
CREATE INDEX ai_route_nodes_geom_idx ON ai_route_nodes USING GIST (geom);
```

MVP routing uses `coordinates` JSON `{x,y}` or ignores geometry entirely.

## Tenant isolation

Passport and write actions are scoped by `userId`. Tools call `getPassport(userId, passportId)` before mutating or sharing.

## Indexes (required)

- place ID, element ID, feature type, observed date
- incident status
- user passport ownership (`userId`)
