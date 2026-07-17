# Replay Lab Architecture

Internal name: **MapAble Mission Simulator**.

## Hybrid kernel

```text
Scenario DSL (YAML)
    → Virtual clock + seeded random
    → Event queue
    → Synthetic domain adapters
    → Append-only synthetic event ledger
    → Assertion engine + journey integrity scorecard
    → Accessible event list (authoritative) / optional graph
```

## Design choices

| Choice | Decision |
| --- | --- |
| Engine | In-process TypeScript hybrid kernel |
| Clock | Injected `VirtualClock` only — never wall clock inside adapters |
| Persistence (foundation) | In-memory + YAML/JSON fixtures — no Prisma |
| Domain fidelity | Adapters over Care, Transport, Access Intelligence, etc. |
| Event bus | No production streaming platform for synthetic simulation |
| AI (AURA) | May draft/explain; may not pass, alter assertions, or approve release |

## Packages

| Path | Role |
| --- | --- |
| `lib/replay-lab/` | Kernel, contracts, adapters |
| `data/replay-lab/` | Scenario YAML and chaos cards |
| `schemas/replay-lab-scenario.schema.json` | Machine schema |
| `app/replay-lab/` | Accessible timeline UI (text-first) |
| `tests/replay-lab/` | Deterministic Vitest suites |

## Isolation

Production services receive a wall clock. Simulation services receive a virtual clock only when constructed by the Replay Lab kernel. Adapters emit into the Replay ledger only.
