# AURA — Production Readiness

## Do not enable for general participants until

- [ ] Branch/schema reconciliation with CareOS tip complete (`CareOSMission` writers unified)
- [ ] One canonical Access Passport naming cutover decided
- [ ] Consent + audit canonical paths verified in staging
- [ ] Every tool has authority classification
- [x] No tool has direct Prisma access
- [x] Capability leasing tested
- [x] Participant stop tested (Wave 2: receipt, abort, idempotent)
- [x] Unknown preservation + diagnosis non-inference tested
- [ ] Prompt injection + tenant isolation tested (staging)
- [x] Standard non-AI routes present
- [ ] Keyboard / screen-reader workflows pass (manual pilot gate)
- [x] Audit replay + hash verify unit tests
- [x] Counterfactual labelled simulated; hard requirements protected
- [x] Offline pack stale warnings + data minimisation
- [x] Physical actuation remains disabled
- [x] Safeguarding remains human-only
- [ ] Operational owner assigned
- [x] Rollback documented (see ROLLBACK.md)

## Current flags (defaults)

| Flag                                    | Default       |
| --------------------------------------- | ------------- |
| `MAPABLE_AURA_ENABLED`                  | `false`       |
| `MAPABLE_AURA_COUNTERFACTUALS_ENABLED`  | on when unset |
| `MAPABLE_AURA_RESILIENCE_ENABLED`       | on when unset |
| `MAPABLE_AURA_PLAN_CHALLENGE_ENABLED`   | on when unset |
| `MAPABLE_AURA_AUDIT_REPLAY_ENABLED`     | on when unset |
| `MAPABLE_AURA_OFFLINE_PACKS_ENABLED`    | on when unset |
| `MAPABLE_AURA_PROPOSALS_ENABLED`        | `false`       |
| `MAPABLE_AURA_WRITE_EXECUTION_ENABLED`  | `false`       |
| `MAPABLE_AURA_MEMORY_ENABLED`           | `false`       |
| `MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED` | `false`       |

Stop AURA is mandatory whenever AURA is enabled (no disable flag).

## Authority ceiling (Wave 1–2)

**L2_RECOMMEND** — no L3+ production authority. Zero external writes.

## Claims we do not make

- AURA is not an ASI
- Counterfactual simulation does not change reality
- Offline packs are not live after generation time
- Audit replay does not reveal private chain-of-thought
- AURA is not production-ready for general participants while gates above remain open
