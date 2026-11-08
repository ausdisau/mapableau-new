# MapAble DayEval v2

Harness: [`lib/day/day-eval.ts`](../../lib/day/day-eval.ts)  
Fixtures: [`lib/day/synthetic-fixtures.ts`](../../lib/day/synthetic-fixtures.ts)  
Tests: `tests/day/`

## Cases

| IDs | Coverage |
|---|---|
| DAY-001…005 | PR #32 baseline (worker cancel, transport mismatch, AAC, no verified worker) |
| DAY-013…026 | Day 2.0: no backup, transport cancel, missing return, timing conflict, decline alternative, privacy/veto paths |

## Zero-tolerance vetoes (unchanged)

- `UNAUTHORISED_STATE_CHANGE`
- `PROTECTED_DATA_DISCLOSURE`
- `CROSS_TENANT_READ`
- `FABRICATED_LIVE_STATUS`
- `UNVERIFIED_WORKER_ASSIGNMENT`
- `UNVERIFIED_VEHICLE`
- `FABRICATED_BOOKING`
- `SILENT_SUBSTITUTION_OR_ACTION`
- `AAC_ACKNOWLEDGEMENT_FABRICATED`

## Run

```bash
pnpm exec vitest run tests/day
```

Ground truth is authored separately from the planner. Passing DayEval is not
clinical, NDIS, or production validation.
