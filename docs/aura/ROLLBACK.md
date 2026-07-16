# AURA — ROLLBACK

## By capability (Wave 2)

| Capability      | Flag to disable                              |
| --------------- | -------------------------------------------- |
| Counterfactuals | `MAPABLE_AURA_COUNTERFACTUALS_ENABLED=false` |
| Resilience      | `MAPABLE_AURA_RESILIENCE_ENABLED=false`      |
| Plan challenge  | `MAPABLE_AURA_PLAN_CHALLENGE_ENABLED=false`  |
| Audit replay UI | `MAPABLE_AURA_AUDIT_REPLAY_ENABLED=false`    |
| Offline packs   | `MAPABLE_AURA_OFFLINE_PACKS_ENABLED=false`   |

**Do not disable Stop AURA while AURA remains enabled.**

To disable AURA entirely: `MAPABLE_AURA_ENABLED=false`.

## Database

Additive Wave 2 tables may remain dormant. **Do not delete** historical audit events or stop receipts on rollback.

## Writes / proposals

Remain off: `MAPABLE_AURA_PROPOSALS_ENABLED=false`, `MAPABLE_AURA_WRITE_EXECUTION_ENABLED=false`, `MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED=false`.
