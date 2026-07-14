# Mobile API gap analysis

## Existing APIs usable by mobile

| Endpoint | Auth | Mobile use |
|----------|------|------------|
| `GET /api/v1/missions` | API key + participant authority | Mission list (summary) |
| `GET /api/v1/care` | API key + authority | Care summaries |
| `GET /api/v1/transport` | API key + authority | Transport summaries |
| `GET /api/v1/access` / places | API key | Access evidence |
| `GET /api/v1/jobs` | API key | Jobs discovery |
| `GET /api/v1/documents` | API key | Document attention |
| `GET /api/v1/events` | API key | Continuity events |
| `/api/intelligence/careos-missions` | Web session | Mission detail (web) |
| NextAuth `/api/auth/*` | Cookie session | Not sufficient alone for native PKCE |

## Gaps requiring mobile BFF or extensions

| Need | Proposed | Rationale |
|------|----------|-----------|
| App bootstrap (flags, nav, version) | `GET /api/v1/mobile/bootstrap` | Single round-trip; avoid desktop payload |
| Today dashboard composition | `GET /api/v1/mobile/today` | Compose Care + Transport + missions + messages |
| Mobile mission list/detail | `GET /api/v1/mobile/missions`, `.../:id` | Participant-session auth; mobile field selection |
| Push token registration | `POST /api/v1/mobile/push-tokens` | Device-bound tokens |
| Offline sync | `POST /api/v1/mobile/sync/pull`, `.../push` | Idempotent queue + revocation |
| Minimum supported version | `GET /api/v1/mobile/minimum-supported-version` | Force upgrade gate |
| Native token exchange | Extend OAuth authorization-code + PKCE | No client secrets in bundle |

## Non-goals

- Do not duplicate Care / Transport / CareOS domain execution APIs.
- Do not expose full desktop admin payloads.
- Do not invent a second mission schema.

## Backend blockers

None for schema: canonical `CareOSMission` is established on the source branch. Remaining work is session/token bridge for native clients and mobile-shaped response DTOs behind versioned contracts.
