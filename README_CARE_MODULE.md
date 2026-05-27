# Care module (MapAble Care MVP)

## Built

- Participant care request form at `/care/request`
- Provider care request inbox at `/provider/care/requests`
- Provider accept/decline (care request + care booking APIs)
- Manual worker assignment with eligibility and high-intensity competency gates
- Worker portal: `/worker/today`, `/worker/shifts/[id]` with shift status stepper
- Access needs and support tasks summaries
- Service agreement placeholder per booking
- Service log create/submit, participant confirm/dispute
- Invoice placeholder (requires confirmed service log; pricing stub only)
- Incident/concern report with optional Quality & Safeguards Centre escalation
- Role-aware and consent-aware access control with audit events on status changes

## Routes

| Audience | Routes |
|----------|--------|
| Participant | `/care`, `/care/find`, `/care/request`, `/care/bookings`, `/care/bookings/[id]`, `/care/service-logs` |
| Provider | `/provider/care`, `/provider/care/requests`, `/provider/care/roster`, `/provider/care/bookings/[id]`, `/provider/care/service-logs` |
| Worker | `/worker/today`, `/worker/shifts/[id]`, `/worker/service-log`, `/worker/report-issue` |

Legacy redirects: `/dashboard/care/*` → `/care/*`

## APIs

- `GET/POST /api/care/bookings`, `GET /api/care/bookings/[id]`
- `POST /api/care/bookings/[id]/accept|decline|assign-worker|invoice-placeholder`
- `GET/POST /api/care/service-logs`, `POST .../confirm`, `POST .../dispute`
- `POST /api/care/incidents`, `POST /api/care/incidents/[id]/escalate-qsc`
- Existing: `/api/care/requests`, `/api/care/shifts`

## Database tables

Prisma models mapped with `@@map` to: `care_requests`, `care_bookings`, `care_booking_events`, `care_booking_workers`, `care_roster_assignments`, `care_service_agreements`, `care_service_logs`, `care_progress_notes`, `care_participant_preferences`, `care_worker_preferences`, `care_access_needs`, `care_risk_flags`, `care_living_alone_safeguards`, `care_shift_cancellations`, `care_service_recovery_links`, `care_invoice_links`.

## Privacy

Accessibility details require consent (`care.accessibility_share`), including organisation-scoped checks for providers.

## Allocation (HITL)

When `CARE_ALLOCATION_ENABLED=true`, providers can run ranked worker suggestions with compliance gates and an approval inbox. See [README_CARE_ALLOCATION.md](README_CARE_ALLOCATION.md).

- APIs under `/api/care/allocations`
- Provider UI: booking detail **Suggest workers**, [`/provider/care/allocations`](/provider/care/allocations)

## Limitations

- No GPS check-in or recurring bookings (allocation uses existing matching when enabled)
- NDIS pricing is placeholder only — no funding approval claims
- Invoice generation is a stub until NDIS Pricing Intelligence is wired

## Tests

`tests/care-mvp.test.ts` — permissions, worker eligibility, participant access helpers.
