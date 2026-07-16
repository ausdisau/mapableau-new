# MapAble Transport — API

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/transport/features` | Production-claim registry |

## Participant

| Method | Path | Notes |
| --- | --- | --- |
| GET/PUT | `/api/transport/profile` | Access profile |
| GET | `/api/transport/dashboard` | Typed dashboard summary |
| GET/POST | `/api/transport/trips` | List / create trip |
| GET | `/api/transport/trips/:id` | Role-aware detail |
| GET | `/api/transport/trips/:id/quotes` | Sandbox/provider quotes |
| POST | `/api/transport/trips/:id/sandbox-quotes/accept` | Accept sandbox option |
| POST | `/api/transport/quotes/:id/accept` | Accept persisted quote |
| POST | `/api/transport/complaints` | Complaint (optional trip) |
| POST | `/api/transport/trips/:id/confirm` | Completion confirm |
| POST | `/api/transport/trips/:id/dispute` | Dispute |
| POST | `/api/transport/trips/:id/cancel` | Cancel |

## Operator / driver

Existing provider and driver routes under `/api/provider/transport/*` and `/api/driver/transport/*`. Assignment is fail-closed with eligibility snapshots.

## Compatibility

- New UI must not create transport via `/api/bookings`.
- Legacy `/api/transport/bookings` remains for migration/read paths.
