# Service planning and dispatch (HITL)

Platform-wide automated **planning** (ranked recommendations) and **dispatch** (human-confirmed execution) for care and transport.

## Principles

- Planning produces proposals only — never unconditional auto-assign.
- Care: tiered allocation with gates ([README_CARE_ALLOCATION.md](README_CARE_ALLOCATION.md)).
- Transport: route plans and optimisation jobs surface in dispatch queues; assignment stays on the provider dispatch board.
- Admin: [Dispatch console](/admin/dispatch) aggregates open review items.

## Feature flags

| Variable | Purpose |
|----------|---------|
| `SERVICE_PLANNING_ENABLED` | Master switch for platform sync and orchestration hooks |
| `CARE_ALLOCATION_ENABLED` | Care worker allocation runs |
| `CARE_ALLOCATION_AUTONOMY_TIER` | `recommend_only` or `conditional_auto` |
| `DISPATCH_CONSOLE_ENABLED` | Admin/provider queue sync |
| `ROUTE_OPTIMISATION_ENABLED` | Route plan generation + transport plan review queues |
| `AI_MATCHING_REQUIRE_HUMAN_REVIEW` | AI match outputs require human accept |

## APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/dispatch?category=care` | List open queues |
| `POST /api/admin/dispatch` `{ "action": "sync" }` | Refresh all queues |
| `POST /api/care/allocations/run` | Run care allocation |
| `POST /api/care/allocations/proposals/[id]/approve` | HITL approve |
| `POST /api/transport/route-plans/[id]/approve` | Select route candidate |

## Provider UI

- Care allocation inbox: `/provider/care/allocations`
- Transport dispatch: `/provider/transport/dispatch`

## Code layout

- `lib/service-planning/` — config, governance, platform sync
- `lib/care-allocation/` — care allocator and gates
- `lib/transport-dispatch/` — transport queue bridge
- `lib/dispatch-console/` — shared queue upsert/list

## Rollout

1. Enable `SERVICE_PLANNING_ENABLED` and `DISPATCH_CONSOLE_ENABLED`.
2. Enable `CARE_ALLOCATION_ENABLED` with `recommend_only`; UAT provider inbox + admin console.
3. Enable `ROUTE_OPTIMISATION_ENABLED` for transport plan review queues.
4. Only then consider `CARE_ALLOCATION_AUTONOMY_TIER=conditional_auto`.

See [docs/runbooks/launch/DISPATCH_RUNBOOK.md](docs/runbooks/launch/DISPATCH_RUNBOOK.md).
