# AURA — Production Readiness

## Do not enable for general participants until

- [ ] CareOS tip reconciliation complete
- [ ] Staging consent + tenant isolation verified
- [x] No AURA tool has Prisma / execution adapters
- [x] Capability leasing + Stop tested
- [x] Counterfactuals labelled simulated
- [x] Audit replay + hash verify
- [x] Offline pack stale warnings
- [x] Wave 3 proposals immutable; shadow ≠ execution
- [x] Execution guard blocks writes
- [x] `futureExecutionEligible` always false in Wave 3
- [ ] Manual a11y pilot (keyboard / SR)
- [ ] Operational owner assigned
- [x] Rollback documented

## Flags (defaults)

| Flag | Default |
|------|---------|
| `MAPABLE_AURA_ENABLED` | `false` |
| `MAPABLE_AURA_PROPOSALS_ENABLED` | `false` |
| `MAPABLE_AURA_PROPOSAL_REVIEW_ENABLED` | `false` |
| `MAPABLE_AURA_SHADOW_EVALUATION_ENABLED` | `false` |
| `MAPABLE_AURA_WRITE_EXECUTION_ENABLED` | `false` |
| `MAPABLE_AURA_EXTERNAL_DELIVERY_ENABLED` | `false` |
| `MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED` | `false` |

## Authority

Wave 3 ceiling: **L3_PROPOSE**. No L4+ execution.

## Claims we do not make

- No message/booking/report/notification occurred in Wave 3
- Shadow acceptance is not execution approval
- AURA is not production-ready for general participants while gates remain open
