# Implementation brief — Horizon P07 My Day Resilience Simulator

## Acceptance criteria

1. Synthetic-only participant journey: work → shops → return with usual worker.
2. Preferred worker cancellation + transport re-evaluation; decline unsuitable substitute; human recovery route.
3. Explicit state transitions; immutable scenario events; decision receipts; deterministic replay.
4. Evidence honesty labels: fictional | unknown | declared | verified (never promote fictional/declared to verified).
5. Reuse `reviewFictionalWorker`; do not introduce a second matching engine.
6. Production hard-disabled; permanent deny constants always false.
7. Tests for consent denial/withdrawal, tenant isolation, AAC preservation, reflow/UI contracts, unavailable workers, delayed transport, withdrawn preferences, irreversible-action prevention, declined-substitute non-reappearance, replay equality.
8. Draft PR description prepared; no push unless separately authorised.

## Affected paths

- `apps/web/lib/my-day-resilience/**`
- `apps/web/components/my-day-resilience/**`
- `apps/web/app/dashboard/my-day-resilience/page.tsx`
- `apps/web/components/layout/DashboardNav.tsx`
- `apps/web/components/layout/DashboardAppShell.tsx`
- `apps/web/app/dashboard/layout.tsx`
- `apps/web/tests/my-day-resilience/**`
- `apps/web/docs/my-day-resilience/**`
- `.github/workflows/my-day-resilience-contract.yml`

## Feature flag

`MAPABLE_MY_DAY_RESILIENCE_ENABLED=true` and `NODE_ENV !== "production"`.

## Rollout / rollback

- Rollout: enable flag only in local/dev/test; never production.
- Rollback: unset flag (page returns 404); remove nav prop; revert branch commits. No schema rollback required.

## Human approvals still required

Privacy/DPIA before any live participant data, regulatory review before screening integrations, accessibility co-design before conformance claims, independent release decision before any production enablement.
