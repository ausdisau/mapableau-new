# Open Infrastructure Architecture

## Layering

```
External provider (Panoramax, Open311, SensorThings, …)
        ↓
lib/integrations/access/* adapter (validate, provenance)
        ↓
NormalizedObservation (never direct Prisma from adapters)
        ↓
GAIS / Access domain services
```

## Deployment boundaries

| Component | Host | Notes |
|-----------|------|-------|
| MapAble app | Existing platform | Flags OFF in production until GO |
| Panoramax API | Coolify / separate service | `panoramax/api` image |
| Object storage | S3-compatible via `FS_URL` | R2 preferred if compatible; MapAble private evidence stays on MapAble R2 |
| Open311 | City endpoint | Draft-first; no autonomous submit |
| SensorThings | Optional pilot endpoint | Sensor ≠ verified capability |

## Health

- MapAble: `GET /api/access/open-infrastructure/health`
- Panoramax: `GET /api` on Panoramax service

## Fail-closed

Parent flag `MAPABLE_OPEN_INFRASTRUCTURE_ENABLED` must be true before any phase flag activates.
