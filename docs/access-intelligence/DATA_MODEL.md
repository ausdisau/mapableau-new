# Data model

## Core (Zod)

`AccessPassport`, `AccessRequirement`, `Place`, `BuildingElement`, `AccessFeature`, `Evidence`, `RouteNode`, `RouteEdge`, `LiveIncident`, `AccessDecision`, `VisitPlan` — [`schemas.ts`](../../lib/access-intelligence/schemas.ts).

## Living Twin (Zod)

`LivingAccessTwin`, `JourneyContext`, `PersonalAccessTwin`, `TemporalRule`, `VenueMutation`, `LearningTraceEvent` — [`living/schemas.ts`](../../lib/access-intelligence/living/schemas.ts).

## Prisma `ai_*` (existing + living)

Passports, requirements, places, elements, features, evidence, route nodes/edges, live incidents, visit plans, verification/barrier, audit.

Living persistence (20260715200000): `AiLivingTwinMeta`, `AiTemporalRule`, `AiVenueMutationDraft`, `AiLearningSession`, `AiLearningTraceEvent`, `AiVenueStaffAssignment`, `AiLiveStatusSnapshot`.

## Runtime defaults

| Concern | Default |
|---------|---------|
| Place/passport repository | Demo in-memory (`repositories.ts`) |
| Living incidents/drafts/traces/staff/snapshots | `getLivingPersistence()` memory, or Prisma when `ACCESS_INTELLIGENCE_USE_PRISMA=true` and demo off |
| Journey context | Request-scoped on Personal Access Twin (not a DB row yet) |

Do not duplicate User/Place core MapAble models — link by id.
