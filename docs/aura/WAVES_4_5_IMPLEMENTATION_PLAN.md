# MapAble AURA Waves 4 & 5 — Implementation Plan

## Waves 1–3 completion state

| Wave | Status | Notes |
|------|--------|-------|
| Wave 1 | Complete | CareOS mission, leases, proof plans, verifier, Taylor@Harbour |
| Wave 2 | Complete | Counterfactuals, resilience, Stop AURA, audit replay, offline packs |
| Wave 3 | Complete | Immutable proposals, shadow review, execution guard, zero external writes |

## Canonical application services reused (Wave 4)

| Action | Service ID | Adapter |
|--------|------------|---------|
| Venue verification | `accessIntelligenceMessagingService` | messaging |
| Visit Plan share | `visitPlanSharingService` | secure link |
| Supporter notification | `notificationService` | notification |
| Transport request | `transportTripService` | transport domain |
| Barrier report | `accessBarrierReportService` | moderation |

Runtime default uses in-memory demo adapters in `lib/aura/execution/registry.ts` that mirror canonical receipt shapes. Production path calls existing Prisma services when `MAPABLE_AURA_USE_PRISMA` and supervised-pilot flags are enabled.

## Wave 4 architecture

- **Fresh execution approval** — `lib/aura/execution/approval.ts` (separate from shadow review; `futureReuseAllowed: false`)
- **Four-Key rule** — `lib/aura/execution/four-key.ts`
- **Service registry** — `lib/aura/execution/registry.ts`
- **Executor** — `lib/aura/execution/executor.ts`
- **Idempotency** — proposal-hash-bound keys + uniqueness in `store.ts`
- **Outbox** — `lib/aura/execution/outbox.ts` (witness-backed; no competing table)
- **Receipts** — immutable in `store.ts`
- **Stop integration** — invalidates approvals, cancels queued executions

## Wave 4 release gate

Evaluated by `evaluateWave4ReleaseGate()` in `lib/aura/execution/release-gate.ts`. Wave 5 flags require gate pass via `MAPABLE_AURA_WAVE4_GATE_PASSED` or successful gate evaluation.

## Wave 5 architecture

- **Memory** — `lib/aura/memory/index.ts` (participant-authored/confirmed only; canonical routing)
- **Outcome calibration** — `lib/aura/calibration/index.ts`
- **Evidence corrections** — draft → moderation (no auto-publish)
- **No online self-training** — deterministic comparison only

## Feature flags

See `.env.example` and `lib/aura/feature-flags.ts`.

## Rollback

- Wave 4: set `MAPABLE_AURA_EXECUTION_MODE=shadow` and all `MAPABLE_AURA_EXECUTE_*=false`
- Wave 5: set all `MAPABLE_AURA_MEMORY_*` and `MAPABLE_AURA_OUTCOME_*` to false

## Tests

- `tests/aura/execution/wave4-execution.test.ts`
- `tests/aura/outcomes/wave5-calibration.test.ts`
