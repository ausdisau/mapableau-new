# MapAble Core — Phase 3

Phase 3 adds the first service-module layer: **Care**, **Transport**, **Inclusive Jobs**, **Unified Calendar**, **Provider capacity**, and **Cross-module orchestration**.

## What was built

- Care requests and care shifts with participant approval and invoice draft hooks
- Worker profiles, availability windows, and capacity blocks
- Transport booking details, vehicles, and drivers
- Jobs foundation and job applications with sensitive adjustment handling
- Unified calendar (list view default)
- Orchestration for linked transport and invoice lines
- Admin service operations dashboard

## Main routes

| Area | Participant | Provider | Employer | Admin |
|------|-------------|----------|----------|-------|
| Care | `/dashboard/care` | `/provider/care` | — | `/admin/care` |
| Transport | `/dashboard/transport` | `/provider/transport` | — | `/admin/transport` |
| Jobs | `/dashboard/jobs` | — | `/employer/jobs` | `/admin/jobs` |
| Calendar | `/dashboard/calendar` | `/provider/calendar` | `/employer/calendar` | `/admin/service-ops/calendar` |
| Service ops | — | — | — | `/admin/service-ops` |

## Models

`CareRequest`, `CareShift`, `WorkerProfile`, `AvailabilityWindow`, `CapacityBlock`, `TransportBooking`, `Vehicle`, `DriverProfile`, `Job`, `JobApplication`, `CalendarEvent`, `OrchestrationEvent`

## Permissions

See `lib/auth/permissions.ts` — Phase 3 adds `care:*`, `transport:*`, `jobs:*`, `calendar:*`, `admin:service-ops`.

## Configuration

```env
CALENDAR_EXTERNAL_SYNC_ENABLED=false
TRANSPORT_LIVE_TRACKING_ENABLED=false
TRANSPORT_ROUTING_ENABLED=false
JOBS_PUBLIC_BOARD_ENABLED=true
ORCHESTRATION_ENABLED=true
```

## Deploy

```bash
npx prisma db push
npx prisma generate
pnpm prisma db seed
```

## Limitations

No AI matching, live GPS, route optimisation, full NDIS claims, or external iCal sync.

## Phase 4 preview

Matching foundation, marketplace search, live tracking, worker timesheets, incident reporting, NDIS line intelligence.

See also: `README_CARE_MODULE.md`, `README_TRANSPORT_MODULE.md`, `README_JOBS_FOUNDATION.md`, `README_UNIFIED_CALENDAR.md`, `README_CROSS_MODULE_ORCHESTRATION.md`, `README_PROVIDER_CAPACITY.md`, `README_PHASE_3_QA.md`.
