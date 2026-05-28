# AV fleet management (MapAble)

Provider operations for **TransportVehicle** and **TransportDriver** — the verified fleet used on the human dispatch board. This is part of the MapAble **AV framework** (accessible, human-dispatched transport), not autonomous vehicle control.

## Governance

- See [`lib/av-framework/governance.ts`](../lib/av-framework/governance.ts): no autonomous dispatch or assignment.
- Fleet APIs manage **inventory and compliance** only; trip assignment stays in [`transport-assignment-service.ts`](../lib/transport/transport-assignment-service.ts).

## Personas

| Role | Task |
|------|------|
| Fleet manager | Add vehicles/drivers, set accessible features, mark verifications verified |
| Dispatcher | Uses fleet on [`/provider/transport/dispatch`](../app/provider/transport/dispatch/page.tsx) |
| Admin | Monitors fleet verification gaps via service ops summary |

## Verification kinds

**Drivers:** licence, screening, training  

**Vehicles:** registration, insurance, inspection  

Optional: `access_equipment` when trips require verified equipment.

Statuses: `not_provided`, `pending_review`, `verified`, `expired`, `rejected`.

Eligibility checks live in [`transport-eligibility-service.ts`](../lib/transport/transport-eligibility-service.ts) and shared helpers in [`transport-fleet-verification.ts`](../lib/transport/transport-fleet-verification.ts).

## Provider UI

| Route | Purpose |
|-------|---------|
| `/provider/transport/fleet` | Fleet hub |
| `/provider/transport/fleet/vehicles` | List vehicles |
| `/provider/transport/fleet/vehicles/new` | Add vehicle (+ optional legacy `Vehicle` link) |
| `/provider/transport/fleet/vehicles/[vehicleId]` | Edit features and verifications |
| `/provider/transport/fleet/drivers` | List drivers |
| `/provider/transport/fleet/drivers/new` | Add driver |
| `/provider/transport/fleet/drivers/[driverId]` | Edit driver and verifications |
| `/provider/transport/fleet/health` | Expired/missing verifications and utilisation hints |

Legacy [`/provider/vehicles`](../app/provider/vehicles/page.tsx) remains for older `TransportBooking` flows; dispatch uses **transport fleet** only.

## APIs

All require `transport:manage:org` and `?organisationId=`.

| Method | Path |
|--------|------|
| GET/POST | `/api/provider/transport/fleet/vehicles` |
| GET/PATCH | `/api/provider/transport/fleet/vehicles/[vehicleId]` |
| PATCH | `/api/provider/transport/fleet/vehicles/[vehicleId]/verifications` |
| GET/POST | `/api/provider/transport/fleet/drivers` |
| GET/PATCH | `/api/provider/transport/fleet/drivers/[driverId]` |
| PATCH | `/api/provider/transport/fleet/drivers/[driverId]/verifications` |
| GET | `/api/provider/transport/fleet/health` |
| GET | `/api/provider/transport/fleet/legacy-vehicles` |

## AV MCP (read-only)

When the `mapable-av` MCP server is running:

- `av_list_fleet_summary` — organisation fleet inventory and verification summary
- `av_check_fleet_readiness` — vehicle eligibility + suitability for mobility needs

See [docs/av-mcp.md](av-mcp.md).

## Related docs

- [Accessible ride-sharing](accessible-ride-share.md)
- [Transport scheduling API](../README_TRANSPORT_SCHEDULING.md)
