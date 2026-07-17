# Disaster recovery

Disaster recovery objectives and exercise tracking.

## Objectives

| Metric | Default |
|--------|---------|
| RPO | 24 hours |
| RTO | 72 hours |

`recoveryObjectivesMet()` compares actual vs target.

## Exercises

`DISASTER_RECOVERY_EXERCISES_ENABLED` flag enables exercise tracking — flag alone is not readiness.

## Related

- [business continuity](./business-continuity.md)
- [operations/disaster-recovery/README.md](../operations/disaster-recovery/README.md)

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- DR objectives in MapAble are internal targets, not audited recovery guarantees.
