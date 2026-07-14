# Mobile API contracts

## BFF routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/mobile/bootstrap` | Flags, nav mode, min version |
| GET | `/api/v1/mobile/today` | Today composition |
| GET | `/api/v1/mobile/missions` | Mission summaries |
| POST | `/api/v1/mobile/missions` | Create appointment mission |
| GET | `/api/v1/mobile/missions/:id` | Mission detail |
| POST | `/api/v1/mobile/missions/:id/confirmations` | Separate Care/Transport confirmation |
| POST | `/api/v1/mobile/push-tokens` | Push registration |
| POST | `/api/v1/mobile/sync/pull` | Offline pull + revocation |
| POST | `/api/v1/mobile/sync/push` | Idempotent queued mutations |
| GET | `/api/v1/mobile/minimum-supported-version` | Upgrade gate |

Shared Zod schemas: `@mapable/careos-contracts`, `@mapable/api-client`.
