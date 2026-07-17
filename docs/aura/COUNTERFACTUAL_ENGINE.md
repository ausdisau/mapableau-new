# AURA Wave 2 — Counterfactual Engine

Authority ceiling: **L2_RECOMMEND**. Simulations do not change real venue, transport, care, or booking state.

## Purpose

Answer: _What changes if a key part of the plan fails?_ using deterministic Access Intelligence engines — not free-form model calculation.

## Architecture

Thin AURA adapter: `lib/aura/counterfactual/index.ts`

Reuses:

- `calculatePersonalFit` (fit engine)
- `buildAccessibleRoute` (route engine)
- `getAccessStateAt` (temporal)
- Harbour Living Twin (`buildHarbourLivingTwin`)

Does **not** create a second competing counterfactual engine. Living Twin utilities in `lib/access-intelligence/living/counterfactual.ts` remain available for broader twin mutations; Wave 2 Harbour flagship uses the AURA adapter over the same engines.

## Categories (first release)

| Category                  | Examples                                                 |
| ------------------------- | -------------------------------------------------------- |
| environment / route       | Western lift outage, Entrance B closed                   |
| time                      | Evening visit (Entrance B after 18:00 local)             |
| evidence                  | Confirm toilet present/absent                            |
| support                   | Reception assistance confirmed                           |
| transport / communication | Allowlisted; communication does not alter physical route |

## Invariants

1. Mutation must be labelled `simulated: true`.
2. Hard requirements cannot be weakened.
3. Base mission plan is immutable; CF results are separate artifacts.
4. Stopped missions reject new runs.
5. Capability lease `access.counterfactuals` required.
6. Disclaimer on every result: simulated; no real state changed.

## Flags

`MAPABLE_AURA_COUNTERFACTUALS_ENABLED` (default on when unset; master gate is `MAPABLE_AURA_ENABLED`).
