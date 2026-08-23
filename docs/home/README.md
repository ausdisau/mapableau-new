# MapAble Home

**Claim state: PROPOSED / IN DEVELOPMENT** — not production-ready, not real-device capable.

MapAble Home is a vendor-neutral environmental capability framework. Participant authority is evaluated before any adapter may act. In P0 only the in-memory simulator can execute.

## Status legend

| Tag | Meaning |
| --- | --- |
| **IMPLEMENTED** | Behaviour is present and covered by tests |
| **SCAFFOLDED** | Types / mappers / fixtures exist; execute disabled |
| **PROPOSED** | Documented target; not built |
| **NOT SUPPORTED** | Explicitly refused in P0 |

## What exists in P0

| Area | Status |
| --- | --- |
| Feature flags (`MAPABLE_HOME_ENV_*`) | IMPLEMENTED (default OFF) |
| Capability contracts + registry | IMPLEMENTED |
| Authority evaluator + confirmation / delegation | IMPLEMENTED |
| Action broker (AuthorizedHomeAction-only execute) | IMPLEMENTED |
| Simulator adapter + synthetic home | IMPLEMENTED |
| Routines (`GOING_OUT`, `COMING_HOME`, `SUPPORT_WORKER_ARRIVING`, `GOING_TO_BED`) | IMPLEMENTED (evaluate) |
| Matter / Google Home / Alexa / Home Assistant adapters | SCAFFOLDED |
| Labs experiment `/labs/home` | IMPLEMENTED (flag-gated) |
| My MapAble `/my/home` + `/api/home/*` | IMPLEMENTED (flag-gated, simulator-only) |
| Real device actions | NOT SUPPORTED |
| LLM → device path | NOT SUPPORTED |
| Prisma persistence for devices / fabrics | NOT SUPPORTED |

## Flag namespace

Use `MAPABLE_HOME_ENV_*` only. Do **not** collide with the NDIS programme flag `MAPABLE_HOME_ENABLED`.

## Docs in this folder

- [architecture.md](./architecture.md)
- [capability-model.md](./capability-model.md)
- [security-boundaries.md](./security-boundaries.md)
- [google-home-native-integration.md](./google-home-native-integration.md)
- [alexa-integration.md](./alexa-integration.md)
- [alexa-account-linking.md](./alexa-account-linking.md)
- [matter-edge-integration.md](./matter-edge-integration.md)
- [labs-simulator.md](./labs-simulator.md)
