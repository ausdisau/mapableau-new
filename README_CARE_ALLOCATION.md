# Care allocation with HITL guardrails

Tiered worker allocation for care bookings: rank candidates, evaluate gates, and assign only through human approval or conditional auto-assign when all safeguards pass.

## Autonomy tiers

| Tier | Behaviour |
|------|-----------|
| `recommend_only` (default) | Creates proposals; provider must approve before `assignWorkerToCareBooking` runs |
| `conditional_auto` | Auto-executes when exactly one proposal is `auto_eligible` and all gates passed |
| `org_default` | Reserved for per-organisation policy (falls back to recommend_only) |

Unconditional auto-assign is **not** supported (`unconditional_auto_assign` capability is disallowed).

## Configuration

```bash
CARE_ALLOCATION_ENABLED=true
CARE_ALLOCATION_AUTONOMY_TIER=recommend_only   # or conditional_auto
CARE_ALLOCATION_AUTO_MIN_SCORE=0.75
CARE_ALLOCATION_REQUIRE_FAIRNESS_REVIEW=true
CARE_ALLOCATION_MAX_PROPOSALS=10
```

Matching and AI matching should remain enabled for best results (`MATCHING_ENGINE_ENABLED`, optional `AI_MATCHING_ENABLED`).

## Gate chain

Each proposal is evaluated for:

- Worker eligibility ([`lib/care/worker-eligibility.ts`](lib/care/worker-eligibility.ts))
- Provider verification smart contract
- Schedule conflicts ([`lib/care/care-schedule-conflict-service.ts`](lib/care/care-schedule-conflict-service.ts))
- Availability windows (warning if no covering window)
- Active high/critical risk flags
- Fairness review when AI matching was used
- `CARE_ALLOCATION_V1` smart contract

## APIs

- `POST /api/care/allocations/run` — run allocation for a booking
- `GET /api/care/allocations?organisationId=&status=&careBookingId=` — list proposals
- `POST /api/care/allocations/proposals/[id]/approve`
- `POST /api/care/allocations/proposals/[id]/reject`
- `POST /api/care/allocations/proposals/[id]/assign-alternate`

## UI

- Provider booking detail: **Suggest workers** panel
- [`/provider/care/allocations`](app/provider/care/allocations/page.tsx) — review queue
- Admin dispatch console includes `care_allocation` queue items

## Database

- `care_allocation_runs`
- `care_allocation_proposals`
- `care_allocation_decisions`

## Tests

`tests/care-allocation.test.ts` — governance, config, gate status mapping.
