# MapAble Coordinate

Human-in-the-loop NDIS support coordination cockpit. AI can draft, summarise, classify, and flag risks — sensitive actions always require explicit human approval. Nothing is auto-sent, auto-booked, or auto-shared.

## Guardrails

- Feature flag: `MAPABLE_COORDINATE_ENABLED=true` required or `/coordinate` returns 404
- AI confidence capped at **0.7**; tasks below **0.65** escalate to human review
- Blocked automatic actions: `send`, `book`, `share`, `approve_funding`, `submit_claim`
- Communication drafts are **approved only** — MapAble does not transmit messages
- Coordinators require active `SupportCoordinatorRelationship` + consent before participant data access

## Routes

| Audience | Routes |
|----------|--------|
| Participant / family | `/coordinate`, `/coordinate/plan`, `/coordinate/goals`, `/coordinate/providers`, `/coordinate/budget`, `/coordinate/messages` |
| Coordinator / plan manager | Above + `/coordinate/reviews` |
| Admin | Above + `/coordinate/audit` |

Legacy redirect: `/support-coordinator` → `/coordinate`

## Permissions

| Permission | Roles |
|------------|-------|
| `coordinate:participant` | `participant`, `family_member` |
| `coordinate:portal` | `support_coordinator`, `mapable_admin` |
| `coordinate:review` | `support_coordinator`, `plan_manager`, `mapable_admin` |
| `coordinate:audit:read` | `support_coordinator`, `mapable_admin` |

## APIs

- `GET /api/coordinate/dashboard`
- `GET/POST /api/coordinate/plans`, `GET/PATCH /api/coordinate/plans/[planId]`
- `POST /api/coordinate/plans/[planId]/upload`
- `GET/POST /api/coordinate/plans/[planId]/goals`, `/actions`, `/budget`
- `GET/POST /api/coordinate/plans/[planId]/providers/shortlist`
- `GET/PATCH /api/coordinate/reviews`, `PATCH /api/coordinate/reviews/[taskId]`
- `GET/POST /api/coordinate/communications`, `PATCH /api/coordinate/communications/[draftId]`
- `GET /api/coordinate/audit`, `GET /api/coordinate/consent`

Coordinators pass `?participantId=` on scoped calls.

## Database

Prisma models: `CoordinateNdisPlan`, `CoordinatePlanGoal`, `CoordinateBudgetCategory`, `CoordinateSupportNeed`, `CoordinateSupportAction`, `CoordinateProviderShortlistItem`, `CoordinateRiskFlag`, `CoordinateHumanReviewTask`, `CoordinateCommunicationDraft`.

Reuses: `ConsentRecord`, `AuditEvent`, `NdisProvider`, `SupportCoordinatorRelationship`.

Migration: `prisma/migrations/20260611130000_mapable_coordinate/migration.sql`

Seed: `prisma/seed-mapable-coordinate.ts` (demo participant/coordinator plan, review task, draft)

## Environment

```env
MAPABLE_COORDINATE_ENABLED=false
MAPABLE_COORDINATE_AI_ENABLED=false
MAPABLE_COORDINATE_AI_ENGINE_ID=coordinate-rules-v1
```

## Architecture

```
app/coordinate/*  →  app/api/coordinate/*  →  lib/coordinate/*-service.ts
                                              →  lib/coordinate/ai/engine.ts
                                              →  Prisma Coordinate* models + AuditEvent
```

## Tests

`tests/coordinate.test.ts` — permissions, AI escalation, no-auto-action guards, reassurance copy.
