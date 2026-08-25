# MapAble Home architecture

**Claim state: PROPOSED / IN DEVELOPMENT**

## Flow (IMPLEMENTED)

```
ParticipantIntent
  → AuthorityEvaluator
  → CapabilityGraph / registry
  → ActionBroker
  → SimulatorAdapter (only live execute path)
  → ActionReceipt + audit
```

Matter / Google / Alexa / Home Assistant adapters are wired as scaffolds. The broker refuses non-simulator execute while `MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED` is false (**NOT SUPPORTED** in P0).

## Invariant (IMPLEMENTED)

`HomeActionRequest` never reaches `adapter.execute()`. Only `AuthorizedHomeAction` after deterministic authority evaluation may execute.

## Persistence (NOT SUPPORTED)

P0 is process-local / in-memory simulator state only. No Prisma models or migrations for devices, fabrics, or credentials.

## Local-first target (PROPOSED)

A future edge host may hold Matter / native bridges and sync receipts to MapAble. That topology is **PROPOSED** and not implemented.
