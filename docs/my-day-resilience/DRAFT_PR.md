# Draft PR (do not open until separately authorised)

**Suggested title:** `feat(care): MapAble One My Day Resilience Simulator (Horizon P07, synthetic)`

**Suggested base:** `feat/participant-worker-matching-synthetic-20261108` (PR #27)  
**Suggested head:** `feat/horizon-my-day-resilience`

## Summary

Implements Horizon P07 — one accessible, synthetic-only My Day journey stacked on draft PR #27 (which depends on #26). Participants can plan work → shops → return, experience a preferred-worker cancellation and transport re-evaluation, decline unsuitable substitutes, escalate to a human recovery route, and obtain an explainable decision receipt with deterministic scenario replay.

## What changed

- `lib/my-day-resilience/` state machine, immutable events, care/transport adapters, receipts, fixtures, production hard-disable flags
- Dashboard demo at `/dashboard/my-day-resilience` (404 unless flag enabled and non-production)
- Nav entry only when enabled
- Vitest + Node 22 contract workflow
- Architecture, safety boundary, accessibility evidence, evidence ledger

## Boundaries

- Reuses `reviewFictionalWorker` — does **not** call `matching-service`
- No real bookings, payments, screening, government APIs, emergency dispatch, or personal participant data
- `canBook` / `canExecute` always false; permanent deny constants hard-coded false
- No Prisma migrations

## Test plan

```bash
pnpm --dir apps/web exec vitest run tests/my-day-resilience
node --experimental-strip-types --test apps/web/tests/my-day-resilience/my-day-resilience.contract.test.mjs
# Optional when env permits:
pnpm --dir apps/web type-check
pnpm --dir apps/web lint
```

## Required review before merge

- [ ] Contract workflow + lint/typecheck/build at head
- [ ] Keyboard / AAC / switch / screen-reader / 200–400% reflow review
- [ ] Identity, consent, tenant and flag review
- [ ] Confirm stack base remains #27 until #26/#27 land
- [ ] Human release approval — **no production enablement**

**Draft only.** Do not merge automatically. Do not enable `MAPABLE_MY_DAY_RESILIENCE_ENABLED` in production.

## Real-world actions not performed

No remote push (pending separate authorisation), no PR open/merge, no deploy, no production flag enablement, no live data import, no worker assignment, no NDIS claims, no payments.
