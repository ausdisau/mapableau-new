# Architecture

## Core invariant

**Observation ≠ verified capability.** External payloads never become canonical truth without MapAble provenance and publication policy.

## Flow

1. External system emits raw payload
2. Adapter validates (Zod) and maps to `NormalizedObservation`
3. Provenance attached (`UNVERIFIED` or `COMMUNITY_REPORTED` by default)
4. Domain services / GAIS consume observations — adapters **never** write Prisma directly

## Modules

| Phase | Domain | Integration |
|-------|--------|-------------|
| P01 | Gateway contracts | `lib/integrations/access/contracts.ts` |
| P02 | Quests, Sidewalk | `lib/access/quests`, `project-sidewalk` |
| P03 | Civic issues | `lib/access/civic`, `open311` |
| P04 | Routing overlay | `lib/integrations/access/routing` |
| P05 | Missions | `lib/access/missions`, `odk` |
| P06 | Realtime sensors | `lib/access/realtime`, `sensorthings` |
| P07 | Public interop | `lib/access/interop` |
| P08 | Community graph | `lib/access/community-graph` |
| P09 | Bounded agents | `lib/access/agents` |
| P10 | Hardening | `HARDENING.md` |

## API surface (flag-gated)

- `GET /api/access/open-infrastructure/health`
- `GET|POST /api/access/quests`
- `POST /api/access/civic/draft`
- `GET /api/access/interop/features`

## UI

Map-independent quest form: `/access/quests`
